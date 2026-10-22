import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { renderOf } from '../../domain/form-editing';
import { fieldLabel } from '../../../../shared/domain/field-label';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';

@Component({
  selector: 'app-form-action-settings',
  imports: [FormsModule, LocalizePipe, SelectControl],
  templateUrl: './form-action-settings.html',
  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
      min-inline-size: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionSettings {
  readonly documents = input.required<JsonObject>();
  readonly node = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly outcomeChanged = output<string>();
  readonly fieldLabel = fieldLabel;
  readonly outcomes = computed(() => {
    const declared = renderOf(this.documents())['outcomes'];
    return Array.isArray(declared)
      ? declared.filter(
          (value): value is string =>
            typeof value === 'string' && value.length > 0 && value.length <= 64,
        )
      : [];
  });
  readonly unavailable = computed(
    () => !this.outcomes().includes(String(this.node()['outcome'] ?? '')),
  );
  choose(value: string): void {
    if (
      !this.disabled() &&
      this.node()['component'] === 'action' &&
      this.outcomes().includes(value)
    ) {
      this.outcomeChanged.emit(value);
    }
  }
}
