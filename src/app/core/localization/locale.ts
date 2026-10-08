import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
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
  private readonly document = inject(DOCUMENT);
  readonly language = signal<SupportedLocale>(inject(RUNTIME_CONFIG).locale);
  // The released renderer DTOs currently accept en/fa, independently of UI languages.
  readonly contentLanguage = computed<'en' | 'fa'>(() =>
    this.language() === 'fa' ? 'fa' : 'en',
  );
  private catalog: Readonly<Record<string, string>> = {};
  private generation = 0;
  readonly changing = signal(false);
  constructor() {
    this.document.documentElement.lang = this.language();
    this.document.documentElement.dir = languageDirection(this.language());
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
