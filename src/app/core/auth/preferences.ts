import { WorkspaceDefaults } from '../resources/workspace-defaults';
import { DOCUMENT } from '@angular/common';
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
  appearance?: Partial<Appearance> | null;
  locale?: Partial<LocaleSettings>;
  workspace?: Partial<components['schemas']['WorkspacePreferences']>;
  notifications?: Partial<components['schemas']['NotificationPreferences']>;
};
const endpoint = '/api/v1/me/preferences';
function decode(value: unknown): {
  ref: string;
  appearance: Appearance;
  language: LocaleSettings['language'];
  settings: components['schemas']['PreferencesDTO'];
} {
  const row = record(value);
  const appearance = record(row['appearance']);
  const locale = record(row['locale']);
  const workspace = record(row['workspace']);
  const notifications = record(row['notifications']);
  if (typeof locale['timezone'] !== 'string') {
    throw Error('Invalid timezone');
  }
  new Intl.DateTimeFormat('en', { timeZone: locale['timezone'] });
  if (
    row['schema_version'] !== 1 ||
    typeof row['ref_id'] !== 'string' ||
    !row['ref_id'] ||
    row['ref_id'].length > 512 ||
    !themePalettes.some((p) => p.key === appearance['theme_key']) ||
    !['light', 'dark', 'system'].includes(String(appearance['theme_mode'])) ||
    !['comfortable', 'compact'].includes(String(appearance['density'])) ||
    !['en', 'fa', 'ar'].includes(String(locale['language'])) ||
    locale['calendar'] !== 'gregory' ||
    !['latn', 'arabext', 'arab'].includes(String(locale['numbering'])) ||
    !['requests', 'work_items', 'studio', 'dashboard'].includes(
      String(workspace['landing_key']),
    ) ||
    !Number.isInteger(workspace['page_size']) ||
    Number(workspace['page_size']) < 1 ||
    Number(workspace['page_size']) > 100 ||
    typeof notifications['email_enabled'] !== 'boolean'
  ) {
    throw Error('Invalid preferences response');
  }
  return {
    ref: row['ref_id'],
    appearance: appearance as Appearance,
    language: locale['language'] as LocaleSettings['language'],
    settings: value as components['schemas']['PreferencesDTO'],
  };
}

@Injectable({ providedIn: 'root' })
export class Preferences {
  private readonly http = inject(HttpClient);
  private readonly defaults = inject(WorkspaceDefaults);
  private readonly document = inject(DOCUMENT);
  readonly settings = signal<components['schemas']['PreferencesDTO'] | null>(
    null,
  );
  private readonly auth = inject(AuthSession);
  private readonly actor = inject(ActorState);
  private readonly session = inject(SessionContext);
  private readonly feedback = inject(Feedback);
  readonly scheme = inject(ColorScheme);
  readonly locale = inject(Locale);
  readonly status = signal<'idle' | 'loading' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  private readonly profileMutation = signal(false);
  readonly loading = computed(
    () => this.status() === 'loading' || this.profileMutation(),
  );
  beginProfileMutation(): (() => void) | null {
    if (
      this.loading() ||
      this.status() === 'saving' ||
      this.locale.changing()
    ) {
      return null;
    }
    const epoch = this.actor.epoch;
    this.profileMutation.set(true);
    return () => {
      if (epoch === this.actor.epoch) {
        this.profileMutation.set(false);
      }
    };
  }
  private readonly revision = signal(0);
  private ref = '';
  private pending: Changes = {};
  private generation = 0;
  private readonly sessionStatus = computed(
    () => this.session.snapshot().status,
  );
  constructor() {
    const release = this.actor.register(() => {
      this.generation++;
      this.ref = '';
      this.profileMutation.set(false);
      this.settings.set(null);
      delete this.document.documentElement.dataset['density'];
      this.pending = {};
      this.status.set('idle');
      this.revision.update((value) => value + 1);
    });
    inject(DestroyRef).onDestroy(release);
    effect(() => {
      this.revision();
      const profile = this.auth.profile();
      if (profile && this.sessionStatus() === 'authenticated') {
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
      this.acceptSettings(value.settings);
      this.ref = value.ref;
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
    this.queue({ appearance: null });
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
    this.queue({ locale: { language: value } });
  }
  update(change: Changes): void {
    if (!this.loading()) {
      this.queue(change);
    }
  }
  private acceptSettings(
    settings: components['schemas']['PreferencesDTO'],
  ): void {
    if (settings.workspace) {
      this.defaults.accept(settings.workspace);
    }
    this.settings.set(settings);
    this.locale.numbering.set(settings.locale?.numbering ?? 'latn');
    this.locale.timezone.set(settings.locale?.timezone ?? 'UTC');
    this.document.documentElement.dataset['density'] =
      settings.appearance?.density ?? 'comfortable';
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
      ...(change.locale
        ? { locale: { ...this.pending.locale, ...change.locale } }
        : {}),
      ...(change.workspace
        ? { workspace: { ...this.pending.workspace, ...change.workspace } }
        : {}),
      ...(change.notifications
        ? {
            notifications: {
              ...this.pending.notifications,
              ...change.notifications,
            },
          }
        : {}),
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
        this.acceptSettings(value.settings);
        if (changes.appearance === null && !this.pending.appearance) {
          this.scheme.select(`${value.appearance.theme_key}-light`);
          this.scheme.setMode(value.appearance.theme_mode);
        }
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
