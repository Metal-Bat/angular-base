import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectControl } from './select-control/select-control';
import { LocalizePipe } from './localize-pipe';

@Component({
  selector: 'app-query-choice',
  imports: [FormsModule, SelectControl, LocalizePipe],
  template: `
    <app-select-control
      [ariaLabel]="'Value' | localize"
      [describedBy]="describedBy()"
      [disabled]="disabled()"
      [inputId]="controlId()"
      [multiple]="multiple()"
      [ngModel]="multiple() ? selection() : value()"
      [ngModelOptions]="{ standalone: true }"
      (ngModelChange)="choose($event)"
    >
      @if (!multiple()) {
        <option value="">{{ 'Choose a value' | localize }}</option>
      }
      @for (option of options(); track option) {
        <option [value]="option">{{ option | localize }}</option>
      }
    </app-select-control>
  `,
  styles:
    ':host { display: block; min-inline-size: 0; } app-select-control { inline-size: 100%; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueryChoice {
  readonly controlId = input.required<string>();
  readonly options = input.required<readonly string[]>();
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly describedBy = input<string | null>(null);
  readonly value = model('');
  readonly selection = computed(() =>
    this.value() ? this.value().split('\n') : [],
  );
  choose(value: unknown): void {
    if (this.disabled()) {
      return;
    }
    this.value.set(
      this.multiple()
        ? Array.isArray(value)
          ? value.map(String).join('\n')
          : ''
        : String(value ?? ''),
    );
  }
}
