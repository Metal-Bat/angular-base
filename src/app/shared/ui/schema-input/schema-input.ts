import { TemporalControl } from '../temporal-control/temporal-control';
import { SchemaArray } from './schema-array';
import { SchemaObject } from './schema-object';
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
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlField } from '../control-field/control-field';
import { LocalizePipe } from '../localize-pipe';
import { Locale } from '../../../core/localization/locale';
import { SelectControl } from '../select-control/select-control';
import { JsonObject, JsonValue } from '../../domain/json-value';
import {
  alternatives,
  schemaBranch,
  schemaLabel,
  seedValue,
} from '../../domain/schema-form';
@Component({
  selector: 'app-schema-input',
  host: { '[attr.data-field-path]': 'path()' },
  imports: [
    TemporalControl,
    SchemaArray,
    SchemaObject,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ControlField,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './schema-input.html',
  styleUrl: './schema-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchemaInput {
  private readonly locale = inject(Locale);
  readonly schema = input.required<JsonObject>();
  readonly value = input<JsonValue | undefined>(undefined);
  readonly draft = linkedSignal(() => this.value());
  readonly valueChange = output<JsonValue | undefined>();
  readonly controlId = input.required<string>();
  readonly label = input('');
  readonly required = input(false);
  readonly longText = computed(
    () =>
      !this.secret() &&
      !this.canPick() &&
      (Number(this.shape()['maxLength'] || 0) > 1024 ||
        [
          'description',
          'reason',
          'instructions',
          'prompt',
          'comment',
          'notes',
        ].includes(this.path().split('.').at(-1) ?? '')),
  );
  readonly disabled = input(false);
  readonly literalValues = input(false);
  readonly path = input('');
  readonly errors = input<Readonly<Record<string, string>>>({});
  readonly referenceLabels = input<
    Readonly<Record<string, { key: string; label: string }>>
  >({});
  readonly referenceRequested = output<{
    key: string;
    path: string;
    value: JsonValue | undefined;
  }>();
  readonly branch = signal(0);
  readonly branches = computed(() => alternatives(this.schema()));
  readonly shape = computed(() =>
    schemaBranch(this.schema(), this.draft(), this.branch()),
  );
  readonly title = computed(
    () =>
      this.label() ||
      schemaLabel(this.path().split('.').pop() ?? '', this.schema()),
  );
  readonly type = computed(() =>
    String(
      this.shape()['type'] ??
        (this.shape()['properties']
          ? 'object'
          : this.draft() === null
            ? 'null'
            : Array.isArray(this.draft())
              ? 'array'
              : typeof this.draft() === 'object'
                ? 'object'
                : typeof this.draft() === 'number'
                  ? 'number'
                  : typeof this.draft() === 'boolean'
                    ? 'boolean'
                    : 'string'),
    ),
  );
  readonly properties = computed(() =>
    Object.entries((this.shape()['properties'] as JsonObject) ?? {}).map(
      ([key, schema]) => ({
        key,
        schema: schema as JsonObject,
        label: schemaLabel(key, schema as JsonObject),
        required: ((this.shape()['required'] as string[]) ?? []).includes(key),
      }),
    ),
  );
  readonly items = computed(() =>
    Array.isArray(this.draft()) ? (this.draft() as JsonValue[]) : [],
  );
  readonly extras = computed(() =>
    this.type() === 'object'
      ? Object.keys(this.object()).filter(
          (key) => !this.properties().some((field) => field.key === key),
        )
      : [],
  );
  readonly choices = computed(
    () => (this.shape()['enum'] as JsonValue[]) ?? [],
  );
  readonly canPick = computed(
    () =>
      !this.literalValues() &&
      [
        'user_ref_id',
        'work_group_ref_id',
        'connection_ref',
        'integration_connection_ref',
        'agent_ref_id',
        'provider_key',
        'model_id',
        'task_name',
        'queue',
      ].includes(this.path().split('.').pop() ?? ''),
  );
  readonly kinds = ['string', 'number', 'boolean', 'object', 'array', 'null'];
  readonly Number = Number;
  referenceText(): string {
    const selected = this.referenceLabels()[this.path()];
    if (selected && selected.key === this.draft()) {
      return selected.label;
    }
    return this.draft() ? this.locale.text('Selected resource') : '';
  }
  newKey = '';
  object(): JsonObject {
    const value = this.draft();
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as JsonObject)
      : {};
  }
  childPath(key: string | number): string {
    return this.path() ? this.path() + '.' + key : String(key);
  }
  childId(key: string | number): string {
    return this.controlId() + '-' + key;
  }
  extraSchema(): JsonObject {
    return typeof this.shape()['additionalProperties'] === 'object'
      ? (this.shape()['additionalProperties'] as JsonObject)
      : {};
  }
  text(): string {
    return this.draft() === undefined || this.draft() === null
      ? ''
      : String(this.draft());
  }
  secret(): boolean {
    return /password|secret|token|api_key/.test(
      this.path().split('.').pop() ?? '',
    );
  }
  set(value: JsonValue | undefined): void {
    if (!this.disabled()) {
      this.draft.set(value);
      this.valueChange.emit(value);
    }
  }
  changeText(value: string): void {
    if (this.canPick()) {
      return;
    }
    this.set(
      value === '' && !this.required() && !this.literalValues()
        ? undefined
        : value,
    );
  }
  changeNumber(value: number | null): void {
    this.set(value === null ? undefined : value);
  }
  setChild(key: string, value: JsonValue | undefined): void {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      return;
    }
    const next = { ...this.object() };
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this.set(next);
  }
  setItem(index: number, value: JsonValue | undefined): void {
    const next = [...this.items()];
    next[index] = value ?? null;
    this.set(next);
  }
  addItem(): void {
    this.set([
      ...this.items(),
      seedValue((this.shape()['items'] as JsonObject) ?? {}) ?? '',
    ]);
  }
  removeItem(index: number): void {
    this.set(this.items().filter((_, i) => i !== index));
  }
  addProperty(): void {
    const key = this.newKey.trim();
    if (key && !Object.hasOwn(this.object(), key)) {
      this.setChild(key, seedValue(this.extraSchema()) ?? '');
      this.newKey = '';
    }
  }
  selectBranch(index: string): void {
    this.branch.set(Number(index));
    const selected = this.branches()[Number(index)];
    const seed = seedValue(selected);
    if (seed !== undefined) {
      this.set(seed);
    } else {
      this.selectKind(String(selected['type'] ?? 'object'));
    }
  }
  selectKind(kind: string): void {
    this.set(
      kind === 'object'
        ? {}
        : kind === 'array'
          ? []
          : kind === 'number' || kind === 'integer'
            ? 0
            : kind === 'boolean'
              ? false
              : kind === 'null'
                ? null
                : '',
    );
  }
  pick(): void {
    this.referenceRequested.emit({
      key: this.path().split('.').pop() ?? '',
      path: this.path(),
      value: this.draft(),
    });
  }
}
