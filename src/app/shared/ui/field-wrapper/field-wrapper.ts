import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { fieldId } from '../../../core/feedback/feedback';
@Component({
  selector: 'app-field-wrapper',
  templateUrl: './field-wrapper.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldWrapper {
  readonly pointer = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly errors = input<readonly string[]>([]);
  readonly id = computed(() => fieldId(this.pointer()));
  readonly describedBy = computed(
    () =>
      [
        this.hint() ? this.id() + '-hint' : '',
        this.errors().length ? this.id() + '-errors' : '',
      ]
        .filter(Boolean)
        .join(' ') || null,
  );
}
