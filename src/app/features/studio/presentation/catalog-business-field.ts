import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { FieldSpec } from '../domain/authoring';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { ListValues } from '../../../shared/ui/list-values/list-values';
import { StudioChoice } from './studio-choice/studio-choice';

@Component({
  selector: 'app-catalog-business-field',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    ListValues,
    StudioChoice,
  ],
  templateUrl: './catalog-business-field.html',
  styleUrl: './catalog-business-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogBusinessField {
  readonly field = input.required<FieldSpec>();
  readonly values = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly changed = output<JsonValue | undefined>();
  readonly id = computed(() => 'author-' + this.field().key);
  readonly kind = computed(() => {
    const kinds: Readonly<Record<string, string>> = {
      form_ref_id: 'forms',
      workflow_ref_id: 'workflows',
      client_ref_id: 'clients',
    };
    return kinds[this.field().key] ?? '';
  });
  readonly selected = computed(() =>
    String(this.values()[this.field().key] ?? ''),
  );
  readonly capabilities = computed(() =>
    ((this.values()['renderer_capabilities'] ?? []) as string[]).join('\n'),
  );
  readonly targets = computed(
    () => (this.values()['client_targets'] ?? []) as JsonObject[],
  );
  changeCapabilities(value: string): void {
    this.changed.emit(value ? value.split('\n') : []);
  }
  addTarget(): void {
    if (!this.disabled() && this.targets().length < 32) {
      this.changed.emit([...this.targets(), { client_ref_id: '' }]);
    }
  }
  changeTarget(index: number, key: string, value: string): void {
    if (this.disabled()) {
      return;
    }
    this.changed.emit(
      this.targets().map((row, position) =>
        position === index
          ? { ...row, [key]: value || (key === 'client_ref_id' ? '' : null) }
          : row,
      ),
    );
  }
  removeTarget(index: number): void {
    if (!this.disabled()) {
      this.changed.emit(
        this.targets().filter((_, position) => position !== index),
      );
    }
  }
}
