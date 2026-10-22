import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { SelectControl } from '../select-control/select-control';
import { Locale } from '../../../core/localization/locale';
@Component({
  selector: 'app-timezone-control',
  imports: [SelectControl],
  templateUrl: './timezone-control.html',
  styleUrl: './timezone-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneControl {
  readonly controlId = input.required<string>();
  readonly value = input.required<string>();
  readonly valueChange = output<string>();
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);
  readonly locale = inject(Locale);
  change(value: unknown): void {
    if (
      typeof value === 'string' &&
      this.options().some((option) => option.value === value)
    ) {
      this.valueChange.emit(value);
    }
  }
  readonly options = computed(() =>
    [...new Set(['UTC', this.value(), ...Intl.supportedValuesOf('timeZone')])]
      .sort()
      .map((value) => ({
        value,
        label: value.replaceAll('_', ' ').replaceAll('/', ' / '),
      })),
  );
}
