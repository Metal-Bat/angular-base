import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../../core/auth/actor-state';
import { ApiClient } from '../../../../core/transport/api-client';
import { record } from '../../../../core/transport/api-failure';
import { readData } from '../../../../core/transport/response-adapters';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { setupLabels, setupReasons } from '../../domain/setup-labels';
import { ReadinessCheck } from '../../domain/readiness';
import { ReadinessPanel } from '../readiness-panel/readiness-panel';
@Component({
  selector: 'app-readiness-page',
  imports: [ReadinessPanel, LocalizePipe],
  templateUrl: './readiness-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadinessPage {
  readonly checks = signal<readonly ReadinessCheck[]>([]);
  readonly receivedAt = signal<string | null>(null);
  readonly stale = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      clearTimeout(this.timer);
      this.checks.set([]);
      this.receivedAt.set(null);
      this.stale.set(true);
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      clearTimeout(this.timer);
      release();
    });
    void this.load();
  }
  async load(): Promise<void> {
    if (this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.stale.set(true);
    try {
      const value = readData(
        await firstValueFrom(
          this.api.call('setup_readiness_api_v1_setup_readiness_get', {}),
        ),
        (raw) => {
          const row = record(raw);
          if (
            row['schema_version'] !== 1 ||
            row['scope'] !== 'development_demo' ||
            !Array.isArray(row['checks']) ||
            typeof row['checked_at'] !== 'string' ||
            row['refresh_after_seconds'] !== 30
          ) {
            throw Error('Invalid readiness');
          }
          return {
            at: row['checked_at'],
            checks: row['checks'].map((rawCheck) => {
              const check = record(rawCheck);
              if (
                typeof check['key'] !== 'string' ||
                typeof check['reason'] !== 'string' ||
                typeof check['required'] !== 'boolean' ||
                !['ready', 'blocked', 'unknown', 'not_applicable'].includes(
                  String(check['status']),
                )
              ) {
                throw Error('Invalid check');
              }
              return {
                key: check['key'],
                label: setupLabels[check['key']] ?? 'Installation check',
                category: String(check['repair_key']),
                required: check['required'],
                status: check['status'] as ReadinessCheck['status'],
                reason: setupReasons[check['reason']] ?? 'Unknown',
              };
            }),
          };
        },
      );
      if (generation !== this.generation) {
        return;
      }
      this.checks.set(value.checks);
      this.receivedAt.set(value.at);
      this.stale.set(false);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.stale.set(true), 30000);
    } catch {
      if (generation === this.generation) {
        this.checks.set([]);
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
