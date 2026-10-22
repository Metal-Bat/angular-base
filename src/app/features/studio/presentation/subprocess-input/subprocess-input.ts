import { CollectionSource } from '../collection-source/collection-source';
import { mappingFields } from '../../domain/mapping-fields';
import type { ChildSourceSelection } from '../../domain/subprocess-pin';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import {
  literalErrors,
  mappingItem,
  mappingSelection,
} from '../../domain/data-mappings';
import { editorSchema } from '../../domain/mapping-schema';
import { childSourceCompatible } from '../../domain/subprocess-pin';
import { MappingSource } from '../../domain/mapping-sources';
import { MappingConstant } from '../mapping-constant/mapping-constant';
import { StudioChoice } from '../studio-choice/studio-choice';
@Component({
  selector: 'app-subprocess-input',
  imports: [
    CollectionSource,
    FormsModule,
    ButtonDirective,
    LocalizePipe,
    SelectControl,
    MappingConstant,
    StudioChoice,
  ],
  templateUrl: './subprocess-input.html',
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      min-inline-size: 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    p {
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubprocessInput {
  readonly port = input.required<JsonObject>();
  readonly value = input<JsonObject>();
  readonly sources = input.required<readonly MappingSource[]>();
  readonly disabled = input(false);
  readonly changed = output<JsonValue | undefined>();
  readonly sourceChanged = output<ChildSourceSelection>();
  readonly draftChanged = output<void>();
  readonly validity = output<boolean>();
  readonly schema = computed(() =>
    editorSchema(this.port()['value_schema'] as JsonObject),
  );
  readonly name = computed(() => String(this.port()['name']));
  readonly id = computed(() => 'child-' + this.name());
  readonly source = linkedSignal<string>(() =>
    this.value()?.['source_kind'] &&
    this.value()?.['source_kind'] !== 'CONSTANT'
      ? '__saved__'
      : '',
  );
  readonly selected = computed(() =>
    this.sources().find((row) => row.key === this.source()),
  );
  readonly itemIndex = linkedSignal<number | null>(() => {
    this.value();
    return null;
  });
  readonly itemField = linkedSignal(() => {
    this.value();
    return '';
  });
  readonly collectionSource = computed(
    () =>
      this.selected()?.binding['source_kind'] === 'REQUEST' &&
      this.selected()?.schema['type'] === 'array',
  );
  readonly projected = computed(() => {
    const source = this.selected();
    if (!source || this.itemIndex() === null) {
      return source;
    }
    try {
      return mappingItem(source, this.itemIndex()!, this.itemField());
    } catch {
      return null;
    }
  });
  readonly sourceReady = computed(
    () => !!this.projected() && this.compatible(this.projected()!),
  );
  collection(index: number | null, field: string): void {
    if (this.disabled() || !this.collectionSource()) {
      return;
    }
    this.itemIndex.set(index);
    this.itemField.set(field);
    this.pending.set(true);
    this.reportValidity();
    this.draftChanged.emit();
  }
  selectable(source: MappingSource): boolean {
    if (this.compatible(source)) {
      return true;
    }
    if (
      source.binding['source_kind'] !== 'REQUEST' ||
      source.schema['type'] !== 'array'
    ) {
      return false;
    }
    const item = (editorSchema(source.schema)['items'] ?? {}) as JsonObject;
    return (
      childSourceCompatible(item, this.port()['value_schema'] as JsonObject) ||
      mappingFields(item).some((field) =>
        childSourceCompatible(
          field.schema,
          this.port()['value_schema'] as JsonObject,
        ),
      )
    );
  }
  readonly savedSource = computed(
    () => mappingSelection(this.sources(), this.value() ?? {}).key,
  );
  readonly constant = linkedSignal(() => this.value()?.['constant_value']);
  readonly errors = linkedSignal(() => {
    this.value();
    return {} as Readonly<Record<string, string>>;
  });
  readonly pending = linkedSignal(() => {
    this.value();
    return false;
  });
  readonly ready = signal(true);
  readonly hasSavedSource = computed(
    () => !!this.value() && this.value()?.['source_kind'] !== 'CONSTANT',
  );
  readonly sourceLabel = computed(
    () =>
      ({
        REQUEST: 'Request data',
        CONTEXT: 'Process context',
        STEP_OUTPUT: 'Step output',
      })[String(this.value()?.['source_kind'])] ?? 'Unavailable source',
  );
  readonly String = String;
  constructor() {
    effect(() => this.reportValidity());
  }
  private reportValidity(): void {
    this.validity.emit(
      !this.pending() && !Object.keys(this.errors()).length && this.ready(),
    );
  }
  setReady(value: boolean): void {
    this.ready.set(value);
    this.reportValidity();
  }

  compatible(source: MappingSource): boolean {
    return childSourceCompatible(
      source.schema,
      this.port()['value_schema'] as JsonObject,
    );
  }
  choose(key: string): void {
    if (this.disabled()) {
      return;
    }
    this.source.set(key);
    this.itemIndex.set(null);
    this.itemField.set('');
    this.pending.set(true);
    this.reportValidity();
    this.draftChanged.emit();
  }
  edit(value: JsonValue | undefined): void {
    if (this.disabled()) {
      return;
    }
    this.constant.set(value);
    this.draftChanged.emit();
    const errors = literalErrors(this.schema(), value);
    this.errors.set(errors);
    this.pending.set(Object.keys(errors).length > 0);
    this.reportValidity();
    if (!Object.keys(errors).length) {
      this.changed.emit(value);
    }
  }

  applySource(): void {
    if (this.disabled() || !this.selected() || !this.sourceReady()) {
      return;
    }
    this.errors.set({});
    this.sourceChanged.emit({
      key: this.source(),
      index: this.itemIndex(),
      field: this.itemField(),
    });
    this.pending.set(false);
    this.reportValidity();
  }
  clear(): void {
    if (this.disabled() || !this.ready()) {
      return;
    }
    this.constant.set(undefined);
    this.source.set('');
    this.itemIndex.set(null);
    this.itemField.set('');
    this.pending.set(false);
    this.errors.set({});
    this.draftChanged.emit();
    this.changed.emit(undefined);
    this.reportValidity();
  }
}
