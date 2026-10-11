import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { placeField, placementFields } from '../../domain/field-placement';
@Component({
  selector: 'app-form-field-placement',
  imports: [ButtonDirective, LocalizePipe, SelectControl],
  templateUrl: './form-field-placement.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldPlacement {
  readonly documents = input.required<JsonObject>();
  readonly path = input.required<readonly number[]>();
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
  readonly fields = computed(() =>
    placementFields(this.documents(), this.path()),
  );
  readonly scope = linkedSignal(() => {
    this.fields();
    return '';
  });
  place(): void {
    if (
      !this.disabled() &&
      this.fields().some((field) => field.scope === this.scope())
    ) {
      this.applied.emit(
        placeField(this.documents(), this.path(), this.scope()),
      );
    }
  }
}
