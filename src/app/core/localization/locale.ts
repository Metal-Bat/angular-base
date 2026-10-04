import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { RUNTIME_CONFIG } from '../configuration/runtime-config';
export type SupportedLocale = 'en' | 'fa';
@Injectable({ providedIn: 'root' })
export class Locale {
  private readonly document = inject(DOCUMENT);
  readonly language = signal<SupportedLocale>(inject(RUNTIME_CONFIG).locale);
  private catalog: Readonly<Record<string, string>> = {};
  private generation = 0;
  readonly changing = signal(false);
  constructor() {
    this.document.documentElement.lang = this.language();
    this.document.documentElement.dir =
      this.language() === 'fa' ? 'rtl' : 'ltr';
  }
  initialize(): Promise<void> {
    return this.set(this.language());
  }
  async set(language: SupportedLocale): Promise<void> {
    if (language !== 'en' && language !== 'fa') {
      throw new Error('Unsupported locale.');
    }
    const generation = ++this.generation;
    this.changing.set(true);
    try {
      if (language === 'fa') {
        this.catalog = (await import('./messages')).persianMessages;
      }
      if (generation !== this.generation) {
        return;
      }
      this.language.set(language);
      this.document.documentElement.lang = language;
      this.document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    } finally {
      if (generation === this.generation) {
        this.changing.set(false);
      }
    }
  }
  text(source: string): string {
    return this.language() === 'fa' ? (this.catalog[source] ?? source) : source;
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
