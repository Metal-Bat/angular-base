import { inject, Pipe, PipeTransform } from '@angular/core';
import { Locale } from '../../core/localization/locale';

export function localizedDateTime(locale: Locale, value: string): string {
  try {
    return new Intl.DateTimeFormat(locale.language(), {
      calendar: locale.calendar(),
      numberingSystem: locale.numbering(),
      timeZone: locale.timezone(),
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

/** Display instants using the current language, calendar and user timezone. */
@Pipe({ name: 'localizedDateTime', pure: false })
export class LocalizedDateTimePipe implements PipeTransform {
  private readonly locale = inject(Locale);
  transform(value: string | null | undefined): string {
    return value ? localizedDateTime(this.locale, value) : '—';
  }
}
