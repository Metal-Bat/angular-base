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
import { outline } from '../../domain/form-authoring';
import { renderOf } from '../../domain/form-editing';
import { canDuplicateLayout, canReparent } from '../../domain/form-placement';

@Component({
  selector: 'app-form-placement-controls',
  imports: [ButtonDirective, LocalizePipe, SelectControl],
  templateUrl: './form-placement-controls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormPlacementControls {
  readonly documents = input.required<JsonObject>();
  readonly path = input.required<readonly number[]>();
  readonly disabled = input(false);
  readonly moveRequested = output<readonly number[]>();
  readonly duplicateRequested = output<void>();
  readonly destinations = computed(() =>
    outline(renderOf(this.documents()))
      .filter((item) => canReparent(this.documents(), this.path(), item.path))
      .map((item) => ({ ...item, value: JSON.stringify(item.path) })),
  );
  readonly destination = linkedSignal(() => {
    this.destinations();
    return '';
  });
  readonly duplicable = computed(() =>
    canDuplicateLayout(this.documents(), this.path()),
  );
  move(): void {
    const item = this.destinations().find(
      (candidate) => candidate.value === this.destination(),
    );
    if (!this.disabled() && item) {
      this.moveRequested.emit(item.path);
    }
  }
}
