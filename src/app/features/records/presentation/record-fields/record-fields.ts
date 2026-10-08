import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { RecordField } from '../../domain/records';
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { ReferencePicker } from '../../../administration/presentation/reference-picker/reference-picker';
import { parseDocument } from '../../../studio/domain/authoring';
import { setAt } from '../../../administration/domain/reference-options';
@Component({
  selector: 'app-record-fields',
  imports: [SchemaInput, ReferencePicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (field of fields(); track field.key) {
      <app-schema-input
        [controlId]="'record-' + field.key"
        [disabled]="disabled()"
        [errors]="errors()"
        [label]="field.label"
        [path]="field.key"
        [required]="field.required"
        [schema]="schema(field)"
        [value]="value(field)"
        (referenceRequested)="picker().open($event)"
        (valueChange)="change(field, $event)"
      />
    }
    <app-reference-picker
      #references
      [context]="context()"
      (picked)="pick($event.path, $event.value)"
    />
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }
    :host > app-schema-input:has(fieldset) {
      grid-column: 1/-1;
    }
    @media (max-width: 40rem) {
      :host {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
})
export class RecordFields {
  readonly fields = input.required<readonly RecordField[]>();
  readonly values = input.required<Record<string, string | boolean>>();
  readonly draft = linkedSignal(() => this.values());
  readonly valuesChange = output<Record<string, string | boolean>>();
  readonly errors = input<Record<string, string>>({});
  readonly disabled = input(false);
  readonly picker = viewChild.required<ReferencePicker>('references');
  schema(field: RecordField): JsonObject {
    return (
      field.schema ?? {
        type:
          field.type === 'boolean'
            ? 'boolean'
            : field.type === 'number'
              ? 'number'
              : field.type === 'strings'
                ? 'array'
                : 'string',
        ...(field.type === 'strings' ? { items: { type: 'string' } } : {}),
        ...(field.min ? { minLength: field.min } : {}),
        ...(field.max ? { maxLength: field.max } : {}),
      }
    );
  }
  value(field: RecordField): JsonValue | undefined {
    const value = this.draft()[field.key];
    if (field.type === 'json') {
      try {
        return value
          ? parseDocument('{"value":' + value + '}')['value']
          : undefined;
      } catch {
        return undefined;
      }
    }
    if (field.type === 'strings') {
      return String(value ?? '')
        .split('\n')
        .filter(Boolean);
    }
    if (field.type === 'number') {
      return value === '' || value === undefined ? undefined : Number(value);
    }
    return value;
  }
  context(): JsonObject {
    const values = Object.fromEntries(
      this.fields().map((field) => [field.key, this.value(field) ?? null]),
    ) as JsonObject;
    return { ...values, ...((values['spec'] as JsonObject) ?? {}) };
  }
  change(field: RecordField, value: JsonValue | undefined): void {
    const next = {
      ...this.draft(),
      [field.key]:
        field.type === 'json'
          ? (JSON.stringify(value) ?? '')
          : field.type === 'strings'
            ? ((value as JsonValue[]) ?? []).join('\n')
            : typeof value === 'boolean'
              ? value
              : String(value ?? ''),
    };
    this.draft.set(next);
    this.valuesChange.emit(next);
  }
  pick(path: string, value: string): void {
    const [key, ...rest] = path.split('.');
    const field = this.fields().find((candidate) => candidate.key === key);
    if (!field) {
      return;
    }
    this.change(
      field,
      rest.length
        ? setAt((this.value(field) as JsonObject) ?? {}, rest.join('.'), value)
        : value,
    );
  }
}
