import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { SessionContext } from '../../../core/auth/session-context';
import { ApiClient } from '../../../core/transport/api-client';
import { record } from '../../../core/transport/api-failure';
import { readData } from '../../../core/transport/response-adapters';
import type { components } from '../../../core/transport/generated/schema';
import { helpIdentity, HelpLanguage, HelpTopic } from '../domain/help-catalog';
type State = components['schemas']['HelpStateDTO'];
@Injectable({ providedIn: 'root' })
export class HelpState {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  readonly states = signal<readonly State[]>([]);
  readonly status = signal<'loading' | 'saved' | 'unsaved'>('loading');
  private generation = 0;
  private writes = Promise.resolve();
  private queued = 0;
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      this.states.set([]);
      this.status.set('unsaved');
    });
    inject(DestroyRef).onDestroy(release);
    const session = inject(SessionContext);
    effect(() => {
      if (session.snapshot().status === 'authenticated') {
        untracked(() => void this.load());
      }
    });
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    this.status.set('loading');
    try {
      const states: State[] = [];
      let compatible = false;
      for (let page = 1; page <= 6; page++) {
        const result = readData(
          await firstValueFrom(
            this.api.call(
              'read_help_state_api_v1_me_help_state_get',
              { query: { page, size: 100 } },
              this.actor.abortSignal,
            ),
          ),
          (raw) => record(raw),
        );
        compatible =
          typeof result['release_key'] === 'string' && !!result['release_key'];
        const rows = record(result['states']);
        if (!Array.isArray(rows['items'])) {
          throw Error('Invalid help state');
        }
        for (const raw of rows['items']) {
          const row = record(raw);
          if (
            typeof row['help_key'] !== 'string' ||
            typeof row['revision'] !== 'string' ||
            !['en', 'fa', 'ar'].includes(String(row['locale']))
          ) {
            throw Error('Invalid help identity');
          }
          states.push(raw as State);
        }
        if (Number(rows['total_pages']) <= page) {
          break;
        }
        if (page === 6) {
          throw Error('Incomplete help state');
        }
      }
      if (generation !== this.generation) {
        return;
      }
      this.states.set(states);
      this.status.set(compatible ? 'saved' : 'unsaved');
    } catch {
      if (generation === this.generation) {
        this.status.set('unsaved');
      }
    }
  }
  saved(topic: HelpTopic, locale: HelpLanguage): State | undefined {
    return this.states().find(
      (row) =>
        `${row.help_key}:${row.revision}:${row.locale}` ===
        helpIdentity(topic, locale),
    );
  }
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const epoch = this.actor.epoch;
    if (this.queued >= 32) {
      return Promise.reject(Error('Help actions are pending'));
    }
    this.queued++;
    const result = this.writes.then(() => {
      if (epoch !== this.actor.epoch) {
        throw Error('Access changed');
      }
      return work();
    });
    this.writes = result.then(
      () => undefined,
      () => undefined,
    );
    return result.finally(() => this.queued--);
  }
  async acknowledge(
    topic: HelpTopic,
    locale: HelpLanguage,
    dismiss = false,
  ): Promise<void> {
    try {
      await this.enqueue(() => this.write(topic, locale, dismiss));
    } catch {
      /* Account cleanup cancels queued writes. */
    }
  }
  private async write(
    topic: HelpTopic,
    locale: HelpLanguage,
    dismiss = false,
  ): Promise<void> {
    const epoch = this.actor.epoch;
    try {
      const result = readData(
        await firstValueFrom(
          this.api.call(
            dismiss
              ? 'dismiss_help_api_v1_me_help_state_dismiss_post'
              : 'see_help_api_v1_me_help_state_seen_post',
            {
              body: {
                help_key: topic.help_key,
                revision: topic.revision,
                locale,
              },
            },
            this.actor.abortSignal,
          ),
        ),
        (raw) => record(raw),
      );
      if (epoch !== this.actor.epoch) {
        return;
      }
      if (result['saved'] !== true) {
        throw Error('Help state was not persisted');
      }
      await this.load();
    } catch {
      if (epoch === this.actor.epoch) {
        this.status.set('unsaved');
      }
    }
  }
  async reset(): Promise<boolean> {
    try {
      return await this.enqueue(() => this.resetSaved());
    } catch {
      return false;
    }
  }
  private async resetSaved(): Promise<boolean> {
    this.generation++;
    const epoch = this.actor.epoch;
    try {
      const response = await firstValueFrom(
        this.api.call(
          'reset_help_api_v1_me_help_state_reset_post',
          { body: {} },
          this.actor.abortSignal,
        ),
      );
      readData(response, (raw) => {
        const result = record(raw);
        if (
          !Number.isSafeInteger(result['deleted_records']) ||
          Number(result['deleted_records']) < 0
        ) {
          throw Error('Invalid reset response');
        }
      });
      if (epoch !== this.actor.epoch) {
        return false;
      }
      this.states.set([]);
      await this.load();
      return epoch === this.actor.epoch;
    } catch {
      if (epoch === this.actor.epoch) {
        this.status.set('unsaved');
      }
      return false;
    }
  }
}
