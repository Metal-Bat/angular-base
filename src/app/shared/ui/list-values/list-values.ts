import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LocalizePipe } from '../localize-pipe';
import { SelectControl } from '../select-control/select-control';
@Component({
  selector: 'app-list-values',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    LocalizePipe,
    SelectControl,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of values(); track $index; let index = $index) {
      <div class="value-row">
        @if (type() === 'boolean') {
          <app-select-control
            [ariaLabel]="('Value' | localize) + ' ' + (index + 1)"
            [disabled]="disabled()"
            [inputId]="controlId() + (index ? '-' + index : '')"
            [ngModel]="item"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="update(index, $event)"
          >
            <option value="">{{ 'Choose a value' | localize }}</option>
            <option value="true">{{ 'Yes' | localize }}</option>
            <option value="false">{{ 'No' | localize }}</option>
          </app-select-control>
        } @else {
          <input
            pInputText
            [attr.aria-label]="('Value' | localize) + ' ' + (index + 1)"
            [disabled]="disabled()"
            [id]="controlId() + (index ? '-' + index : '')"
            [ngModel]="item"
            [ngModelOptions]="{ standalone: true }"
            [type]="
              type() === 'number'
                ? 'number'
                : type() === 'date'
                  ? 'date'
                  : 'text'
            "
            (ngModelChange)="update(index, $event)"
          />
        }
        <button
          pButton
          severity="secondary"
          type="button"
          [attr.aria-label]="('Remove' | localize) + ' ' + (index + 1)"
          [disabled]="disabled()"
          [text]="true"
          (click)="remove(index)"
        >
          <i aria-hidden="true" class="pi pi-times"></i>
        </button>
      </div>
    }
    <button
      pButton
      severity="secondary"
      size="small"
      type="button"
      [disabled]="disabled()"
      [outlined]="true"
      (click)="add()"
    >
      <i aria-hidden="true" class="pi pi-plus"></i>{{ 'Add value' | localize }}
    </button>
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }
    .value-row {
      display: flex;
      gap: 0.5rem;
    }
    .value-row > input,
    .value-row > app-select-control {
      flex: 1;
      min-width: 0;
      min-height: var(--workspace-control-height, 2.5rem);
      height: var(--workspace-control-height, 2.5rem);
    }
    .value-row > button {
      margin: 0;
      flex: 0 0 var(--workspace-control-height, 2.5rem);
      height: var(--workspace-control-height, 2.5rem);
      padding: 0;
    }
    :host > button {
      margin: 0;
      justify-self: start;
    }
  `,
})
export class ListValues {
  readonly controlId = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input('text');
  readonly value = model('');
  readonly values = computed(() => String(this.value()).split('\n'));
  update(index: number, value: string | number): void {
    const values = [...this.values()];
    values[index] = String(value ?? '');
    this.value.set(values.join('\n'));
  }
  add(): void {
    this.value.set(this.value() + '\n');
  }
  remove(index: number): void {
    this.value.set(
      this.values()
        .filter((_, i) => i !== index)
        .join('\n'),
    );
  }
}
