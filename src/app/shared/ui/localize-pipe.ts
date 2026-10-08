import { inject, Pipe, PipeTransform } from '@angular/core';
import { Locale } from '../../core/localization/locale';
@Pipe({ name: 'localize', pure: false })
export class LocalizePipe implements PipeTransform {
  private readonly locale = inject(Locale);
  transform(value: string): string {
    return this.locale.text(value);
  }
}
