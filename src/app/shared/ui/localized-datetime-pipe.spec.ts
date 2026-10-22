import { TestBed } from '@angular/core/testing';
import { Locale } from '../../core/localization/locale';
import { LocalizedDateTimePipe } from './localized-datetime-pipe';

describe('Localized instant display', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });
  it('uses the chosen calendar and timezone and rejects absent or invalid instants', async () => {
    const locale = TestBed.inject(Locale);
    const pipe = TestBed.runInInjectionContext(
      () => new LocalizedDateTimePipe(),
    );
    locale.timezone.set('Asia/Tehran');
    for (const [language, year] of [
      ['en', '2026'],
      ['fa', '1405'],
      ['ar', '1448'],
    ] as const) {
      await locale.set(language);
      expect(pipe.transform('2026-10-17T20:00:00Z')).toContain(year);
      expect(pipe.transform('2026-10-17T20:00:00Z')).toBe(
        new Intl.DateTimeFormat(language, {
          calendar: locale.calendar(),
          numberingSystem: 'latn',
          timeZone: 'Asia/Tehran',
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date('2026-10-17T20:00:00Z')),
      );
    }
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform('invalid')).toBe('—');
  });
});
