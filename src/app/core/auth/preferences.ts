import { HttpClient } from '@angular/common/http';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { AuthSession } from './auth-session';
import { ActorState } from './actor-state';
import { SessionContext } from './session-context';
import { ColorScheme, themePalettes } from '../theme/color-scheme';
import { Locale } from '../localization/locale';
import { isSupportedLocale } from '../localization/languages';
import { readData } from '../transport/response-adapters';
import { record } from '../transport/api-failure';
import { Feedback } from '../feedback/feedback';
import type { components } from '../transport/generated/preferences-contract';

type Appearance = components['schemas']['AppearancePreferences'];
type LocaleSettings = components['schemas']['LocalePreferences'];
type Changes = {
  appearance?: Partial<Appearance>;
  locale?: Pick<LocaleSettings, 'language'>;
};
const endpoint = '/api/v1/me/preferences';
function decode(value: unknown): {
  ref: string;
  appearance: Appearance;
  language: 'en' | 'fa';
} {
  const row = record(value);
  const appearance = record(row['appearance']);
  const locale = record(row['locale']);
  if (
    row['schema_version'] !== 1 ||
    typeof row['ref_id'] !== 'string' ||
    !row['ref_id'] ||
    row['ref_id'].length > 512 ||
    !themePalettes.some((p) => p.key === appearance['theme_key']) ||
    !['light', 'dark', 'system'].includes(String(appearance['theme_mode'])) ||
    !['comfortable', 'compact'].includes(String(appearance['density'])) ||
    !['en', 'fa'].includes(String(locale['language']))
  ) {
    throw Error('Invalid preferences response');
  }
  return {
    ref: row['ref_id'],
    appearance: appearance as Appearance,
    language: locale['language'] as 'en' | 'fa',
  };
}

@Injectable({ providedIn: 'root' })
export class Preferences {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSession);
  private readonly actor = inject(ActorState);
  private readonly session = inject(SessionContext);
  private readonly feedback = inject(Feedback);
  readonly scheme = inject(ColorScheme);
  readonly locale = inject(Locale);
  readonly status = signal<'idle' | 'loading' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  readonly loading = computed(() => this.status() === 'loading');
  readonly sessionLanguage = signal(false);
  private readonly revision = signal(0);
  private ref = '';
  private pending: Changes = {};
  private generation = 0;
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      this.ref = '';
      this.pending = {};
      this.status.set('idle');
      this.sessionLanguage.set(false);
      this.revision.update((value) => value + 1);
    });
    inject(DestroyRef).onDestroy(release);
    effect(() => {
      this.revision();
      const profile = this.auth.profile();
      if (profile && this.session.snapshot().status === 'authenticated') {
        untracked(() => {
          void this.load();
        });
      }
    });
  }
  async load(): Promise<void> {
    if (
      !this.auth.profile() ||
      this.session.snapshot().status !== 'authenticated'
    ) {
      return;
    }
    const generation = ++this.generation;
    this.ref = '';
    this.pending = {};
    this.status.set('loading');
    try {
      const response = await firstValueFrom(
        this.http
          .get<unknown>(endpoint, { observe: 'response' })
          .pipe(timeout(15000)),
      );
      const value = readData(response, decode);
      if (generation !== this.generation) {
        return;
      }
      this.scheme.select(
        `${value.appearance.theme_key}-${value.appearance.theme_mode === 'dark' ? 'dark' : 'light'}`,
      );
      this.scheme.setMode(value.appearance.theme_mode);
      await this.locale.set(value.language);
      if (generation !== this.generation) {
        return;
      }
      this.ref = value.ref;
      this.sessionLanguage.set(false);
      this.status.set('saved');
      if (
        this.feedback.state()?.message ===
        'Preferences could not be saved. Reload saved preferences before changing them again.'
      ) {
        this.feedback.state.set(null);
      }
    } catch {
      if (generation === this.generation) {
        this.status.set('error');
      }
    }
  }
  theme(value: unknown): void {
    if (
      typeof value !== 'string' ||
      !themePalettes.some(
        (p) => value === `${p.key}-light` || value === `${p.key}-dark`,
      ) ||
      this.loading()
    ) {
      return;
    }
    this.scheme.select(value);
    this.queue({
      appearance: {
        theme_key: this.scheme.palette(),
        theme_mode: this.scheme.mode(),
      },
    });
  }
  mode(): void {
    if (this.loading()) {
      return;
    }
    this.scheme.setMode('system');
    this.queue({ appearance: { theme_mode: this.scheme.mode() } });
  }
  reset(): void {
    if (this.loading()) {
      return;
    }
    this.scheme.reset();
    this.queue({ appearance: { theme_key: 'blue', theme_mode: 'light' } });
  }
  async language(value: unknown): Promise<void> {
    if (
      typeof value !== 'string' ||
      !isSupportedLocale(value) ||
      this.loading()
    ) {
      return;
    }
    const generation = this.generation;
    await this.locale.set(value);
    if (generation !== this.generation) {
      return;
    }
    this.sessionLanguage.set(value === 'ar');
    if (value === 'ar') {
      delete this.pending.locale;
      return;
    }
    this.queue({ locale: { language: value } });
  }
  private queue(change: Changes): void {
    if (!this.ref || this.status() === 'error') {
      if (this.auth.profile()) {
        this.reportFailure();
      }
      return;
    }
    this.pending = {
      ...this.pending,
      ...change,
      ...(change.appearance
        ? { appearance: { ...this.pending.appearance, ...change.appearance } }
        : {}),
    };
    if (this.status() !== 'saving') {
      void this.save();
    }
  }
  private async save(): Promise<void> {
    const generation = this.generation;
    this.status.set('saving');
    try {
      while (Object.keys(this.pending).length) {
        const changes = this.pending;
        this.pending = {};
        const response = await firstValueFrom(
          this.http
            .patch<unknown>(
              endpoint,
              { ref_id: this.ref, ...changes },
              { observe: 'response' },
            )
            .pipe(timeout(15000)),
        );
        const value = readData(response, decode);
        if (generation !== this.generation) {
          return;
        }
        this.ref = value.ref;
      }
      this.status.set('saved');
    } catch {
      if (generation === this.generation) {
        this.pending = {};
        this.ref = '';
        this.status.set('error');
        this.reportFailure();
      }
    }
  }
  private reportFailure(): void {
    this.feedback.show({
      kind: 'error',
      message:
        'Preferences could not be saved. Reload saved preferences before changing them again.',
      reconcile: () => {
        void this.load();
      },
    });
  }
}
