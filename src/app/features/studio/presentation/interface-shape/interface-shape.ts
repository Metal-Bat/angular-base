import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { translatedSchemaSummary } from '../schema-summary';
import { Locale } from '../../../../core/localization/locale';
import {
  addInterfaceProperty,
  editableInterfaceShape,
  interfaceTypes,
  newInterfaceSchema,
  removeInterfaceProperty,
  requireInterfaceProperty,
} from '../../domain/interface-shape';
@Component({
  selector: 'app-interface-shape',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    CheckboxModule,
    DialogModule,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './interface-shape.html',
  styleUrl: './interface-shape.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceShape {
  readonly Object = Object;
  readonly schema = input.required<JsonObject>();
  readonly controlId = input.required<string>();
  readonly disabled = input(false);
  readonly depth = input(0);
  readonly schemaChange = output<JsonObject>();
  readonly editing = output<boolean>();
  readonly working = linkedSignal(() => this.schema());
  readonly available = computed(
    () => editableInterfaceShape(this.working()) && this.depth() < 8,
  );
  readonly properties = computed(() =>
    Object.entries((this.working()['properties'] ?? {}) as JsonObject).map(
      ([name, schema]) => ({ name, schema: schema as JsonObject }),
    ),
  );
  readonly items = computed(
    () => (this.working()['items'] ?? {}) as JsonObject,
  );
  private readonly locale = inject(Locale);
  summary(schema: JsonObject): string {
    return translatedSchemaSummary(schema, (value) => this.locale.text(value));
  }
  readonly types = interfaceTypes;
  readonly dialog = signal(false);
  readonly name = signal('');
  readonly type = signal('string');
  readonly error = signal('');
  private emit(schema: JsonObject): void {
    if (this.disabled() || !this.available()) {
      return;
    }
    this.working.set(schema);
    this.schemaChange.emit(schema);
  }
  open(): void {
    if (
      this.disabled() ||
      !this.available() ||
      this.properties().length >= 64
    ) {
      return;
    }
    this.name.set('');
    this.type.set('string');
    this.error.set('');
    this.dialog.set(true);
    this.editing.emit(true);
  }
  close(): void {
    this.dialog.set(false);
    this.name.set('');
    this.error.set('');
    this.editing.emit(false);
  }
  add(): void {
    if (this.disabled() || !this.dialog()) {
      return;
    }
    try {
      this.emit(addInterfaceProperty(this.working(), this.name(), this.type()));
      this.close();
    } catch {
      this.error.set('Use a new field name of up to 64 characters.');
    }
  }
  remove(name: string): void {
    this.emit(removeInterfaceProperty(this.working(), name));
  }
  required(name: string): boolean {
    return ((this.working()['required'] ?? []) as string[]).includes(name);
  }
  require(name: string, value: boolean): void {
    this.emit(requireInterfaceProperty(this.working(), name, value));
  }
  child(name: string, schema: JsonObject): void {
    this.emit({
      ...this.working(),
      properties: {
        ...(this.working()['properties'] as JsonObject),
        [name]: schema,
      },
    });
  }
  item(schema: JsonObject): void {
    this.emit({ ...this.working(), items: schema });
  }
  itemType(type: string): void {
    if (Object.keys(this.items()).length) {
      return;
    }
    this.item(newInterfaceSchema(type));
  }
  childId(index: number): string {
    return this.controlId() + '-field-' + index;
  }
}
