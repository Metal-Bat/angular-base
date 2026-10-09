import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { ActorState } from '../auth/actor-state';
import { RUNTIME_CONFIG } from '../configuration/runtime-config';
import {
  isSupportedLocale,
  languageDirection,
  supportedLanguages,
  SupportedLocale,
} from './languages';
export type { SupportedLocale } from './languages';
const catalogLoaders: Record<
  SupportedLocale,
  () => Promise<Readonly<Record<string, string>>>
> = {
  en: () => Promise.resolve({}),
  fa: async () => (await import('./messages')).persianMessages,
  ar: async () => (await import('./arabic-messages')).arabicMessages,
};
@Injectable({ providedIn: 'root' })
export class Locale {
  readonly languages = supportedLanguages;
  private readonly defaultLanguage = inject(RUNTIME_CONFIG).locale;
  private readonly document = inject(DOCUMENT);
  readonly language = signal<SupportedLocale>(inject(RUNTIME_CONFIG).locale);
  // The released renderer DTOs currently accept en/fa, independently of UI languages.
  readonly contentLanguage = computed<'en' | 'fa'>(() =>
    this.language() === 'fa' ? 'fa' : 'en',
  );
  private catalog: Readonly<Record<string, string>> = {};
  private readonly catalogs = new Map<
    SupportedLocale,
    Readonly<Record<string, string>>
  >();
  private generation = 0;
  readonly changing = signal(false);
  constructor() {
    this.document.documentElement.lang = this.language();
    this.document.documentElement.dir = languageDirection(this.language());
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.catalog = this.catalogs.get(this.defaultLanguage) ?? {};
      this.language.set(this.defaultLanguage);
      this.changing.set(false);
      this.document.documentElement.lang = this.defaultLanguage;
      this.document.documentElement.dir = languageDirection(
        this.defaultLanguage,
      );
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
  }
  initialize(): Promise<void> {
    return this.set(this.language());
  }
  async set(language: SupportedLocale): Promise<void> {
    if (!isSupportedLocale(language)) {
      throw new Error('Unsupported locale.');
    }
    const generation = ++this.generation;
    this.changing.set(true);
    try {
      const catalog = await catalogLoaders[language]();
      this.catalogs.set(language, catalog);
      if (generation !== this.generation) {
        return;
      }
      this.catalog = catalog;
      this.language.set(language);
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = languageDirection(language);
    } finally {
      if (generation === this.generation) {
        this.changing.set(false);
      }
    }
  }
  text(source: string): string {
    return this.language() === 'en' ? source : (this.catalog[source] ?? source);
  }
  number(value: number): string {
    return new Intl.NumberFormat(this.language()).format(value);
  }
  date(instant: Date, timezone: string): string {
    return new Intl.DateTimeFormat(this.language(), {
      calendar: 'gregory',
      timeZone: timezone,
      dateStyle: 'medium',
    }).format(instant);
  }
}
