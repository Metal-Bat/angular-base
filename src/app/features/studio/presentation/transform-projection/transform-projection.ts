import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { mappingFields } from '../../domain/mapping-fields';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
@Component({
  selector: 'app-transform-projection',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './transform-projection.html',
  styles: `
    :host {
      display: grid;
      gap: 0.75rem;
      min-inline-size: 0;
    }
    .projection-row {
      display: grid;
      gap: 0.5rem;
      border: 1px solid var(--console-border);
      border-radius: 0.5rem;
      padding: 0.75rem;
    }
    input {
      width: 100%;
      box-sizing: border-box;
    }
    p {
      margin: 0;
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransformProjection {
  readonly value = input<JsonObject | null>(null);
  readonly schema = input<JsonObject>({});
  readonly disabled = input(false);
  readonly draftChanged = output<void>();
  readonly validity = output<boolean>();
  readonly valueChange = output<JsonObject | undefined>();
  readonly fields = computed(() => mappingFields(this.schema()));
  readonly rows = computed(() =>
    Object.entries(this.value() ?? {}).map(([key, path]) => ({
      key,
      path: String(path),
      known: this.fields().some((field) => field.path === path),
    })),
  );
  readonly name = signal('');
  readonly source = signal('');
  readonly error = signal('');
  constructor() {
    effect(() => {
      this.value();
      this.name.set('');
      this.source.set('');
    });
    effect(() => this.validity.emit(!this.name().trim() && !this.source()));
  }
  changeName(value: string): void {
    this.name.set(value);
    this.draftChanged.emit();
  }
  changeSource(value: string): void {
    this.source.set(value);
    this.draftChanged.emit();
  }
  add(): void {
    if (this.disabled()) {
      return;
    }
    const key = this.name().trim();
    if (
      !key ||
      ['__proto__', 'constructor', 'prototype'].includes(key) ||
      Object.hasOwn(this.value() ?? {}, key) ||
      !this.fields().some((field) => field.path === this.source()) ||
      this.rows().length >= 64
    ) {
      this.error.set('Choose a source field and a unique destination name.');
      return;
    }
    this.valueChange.emit({ ...this.value(), [key]: this.source() });
    this.name.set('');
    this.source.set('');
    this.error.set('');
  }
  remove(key: string): void {
    if (!this.disabled()) {
      const next = { ...this.value() };
      delete next[key];
      this.valueChange.emit(Object.keys(next).length ? next : undefined);
    }
  }
  label(path: string): string {
    return this.fields().find((field) => field.path === path)?.label ?? path;
  }
}
