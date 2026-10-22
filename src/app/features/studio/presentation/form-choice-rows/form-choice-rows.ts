import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { validateValue } from '../../../forms/domain/runtime-validation';
import { parseNumberText } from '../../../../shared/domain/number-text';
import { ActorState } from '../../../../core/auth/actor-state';
import { JsonObject, JsonValue } from '../../../../shared/domain/json-value';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';

type ValueType = 'string' | 'number' | 'boolean';
type ChoiceRow = {
  id: number;
  original: JsonObject;
  label: string;
  type: ValueType;
  text: string;
};
/** Buffered choice presentation. Public items remain {key: typed value, value: label}. */
@Component({
  selector: 'app-form-choice-rows',
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './form-choice-rows.html',
  styleUrl: './form-choice-rows.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormChoiceRows {
  readonly value = input<JsonValue | undefined>([]);
  readonly identity = input('');
  readonly schema = input<JsonObject>({});
  readonly allowTypeChange = input(false);
  readonly choiceSchema = computed(() => {
    const type = this.schema()['type'];
    return (Array.isArray(type) ? type.includes('array') : type === 'array')
      ? ((this.schema()['items'] as JsonObject) ?? {})
      : this.schema();
  });
  readonly disabled = input(false);
  readonly valueChange = output<JsonObject[]>();
  readonly changed = output<void>();
  readonly validity = output<boolean>();
  readonly rows = signal<ChoiceRow[]>([]);
  readonly editable = signal(true);
  readonly page = signal(1);
  readonly pages = computed(() =>
    Math.max(1, Math.ceil(this.rows().length / 20)),
  );
  readonly visibleRows = computed(() =>
    this.rows().slice((this.page() - 1) * 20, this.page() * 20),
  );
  readonly valid = computed(
    () =>
      !this.editable() ||
      (this.rows().length >= 1 &&
        this.rows().length <= 256 &&
        this.rows().every(
          (row) =>
            row.label.length >= 1 &&
            row.label.length <= 255 &&
            !this.issue(row),
        )),
  );
  private accepted = '';
  private context = '';
  private nextId = 0;
  constructor() {
    effect(() => {
      const value = this.value();
      const context = this.identity();
      const signature = JSON.stringify(value);
      if (context === this.context && signature === this.accepted) {
        return;
      }
      this.context = context;
      this.accepted = signature ?? '';
      const supported =
        Array.isArray(value) &&
        value.every(
          (item) =>
            !!item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            typeof item['value'] === 'string' &&
            ['string', 'boolean', 'number'].includes(typeof item['key']),
        );
      this.editable.set(supported);
      this.page.set(1);
      this.rows.set(
        supported
          ? (value as JsonObject[]).map((item) => ({
              id: this.nextId++,
              original: structuredClone(item),
              label: item['value'] as string,
              type: typeof item['key'] as ValueType,
              text: String(item['key']),
            }))
          : [],
      );
    });
    effect(() => this.validity.emit(this.valid()));
    const release = inject(ActorState).register(() => {
      this.rows.set([]);
      this.accepted = this.context = '';
    });
    inject(DestroyRef).onDestroy(release);
  }
  update(id: number, field: 'label' | 'text' | 'type', value: string): void {
    if (this.disabled() || !this.editable()) {
      return;
    }
    if (field === 'type' && !['string', 'number', 'boolean'].includes(value)) {
      return;
    }
    this.rows.update((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    this.publish();
  }
  add(): void {
    if (this.disabled() || !this.editable() || this.rows().length >= 256) {
      return;
    }
    let index = 1;
    while (
      this.rows().some(
        (row) => row.type === 'string' && row.text === 'option' + index,
      )
    ) {
      index++;
    }
    this.rows.update((rows) => [
      ...rows,
      {
        id: this.nextId++,
        original: {},
        label: '',
        type: 'string',
        text: 'option' + index,
      },
    ]);
    this.page.set(this.pages());
    this.publish();
  }
  remove(id: number): void {
    if (this.disabled() || !this.editable() || this.rows().length <= 1) {
      return;
    }
    this.rows.update((rows) => rows.filter((row) => row.id !== id));
    this.page.set(Math.min(this.page(), this.pages()));
    this.publish();
  }
  move(id: number, offset: -1 | 1): void {
    if (this.disabled() || !this.editable()) {
      return;
    }
    const rows = [...this.rows()];
    const index = rows.findIndex((row) => row.id === id);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= rows.length) {
      return;
    }
    [rows[index], rows[target]] = [rows[target], rows[index]];
    this.rows.set(rows);
    this.publish();
  }
  issue(row: ChoiceRow): string | null {
    const key = this.key(row);
    if (key === undefined) {
      return 'Invalid value';
    }
    const schema = this.allowTypeChange()
      ? {
          ...this.choiceSchema(),
          type:
            typeof key === 'number' && Number.isInteger(key)
              ? 'integer'
              : typeof key,
        }
      : this.choiceSchema();
    const message = validateValue(key, schema, false);
    if (message) {
      return message;
    }
    return this.rows().some(
      (other) =>
        other.id !== row.id &&
        JSON.stringify(this.key(other)) === JSON.stringify(key),
    )
      ? 'Choice values must be unique.'
      : null;
  }
  private key(row: ChoiceRow): string | number | boolean | undefined {
    if (row.type === 'string') {
      return row.text;
    }
    if (row.type === 'boolean') {
      return row.text === 'true'
        ? true
        : row.text === 'false'
          ? false
          : undefined;
    }
    return parseNumberText(row.text);
  }
  private publish(): void {
    this.changed.emit();
    this.validity.emit(this.valid());
    if (!this.valid()) {
      return;
    }
    const items = this.rows().map((row) => ({
      ...row.original,
      key: this.key(row)!,
      value: row.label,
    }));
    this.accepted = JSON.stringify(items);
    this.valueChange.emit(items);
  }
}
