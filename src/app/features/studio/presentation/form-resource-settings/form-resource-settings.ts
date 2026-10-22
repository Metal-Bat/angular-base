import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SchemaInput } from '../../../../shared/ui/schema-input/schema-input';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import {
  resourceFlags,
  resourceNumbers,
  resourceSettingsDraft,
} from '../../domain/form-resource-settings';
@Component({
  selector: 'app-form-resource-settings',
  imports: [
    FormsModule,
    InputTextModule,
    TextareaModule,
    LocalizePipe,
    SchemaInput,
    SelectControl,
  ],
  templateUrl: './form-resource-settings.html',
  styleUrl: './form-resource-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormResourceSettings {
  readonly identity = input.required<JsonObject>();
  readonly value = input.required<JsonObject>();
  readonly schema = input.required<JsonObject>();
  readonly controlId = input.required<string>();
  readonly validation = input(false);
  readonly disabled = input(false);
  readonly valueChanged = output<JsonValue | undefined>();
  readonly validChange = output<boolean>();
  readonly changed = output<void>();
  readonly locale = inject(Locale);
  readonly kind = computed(() => String(this.identity()['component']));
  readonly supported = computed(() =>
    (this.validation()
      ? ['table', 'repeater', 'attachment_collection']
      : ['table', 'repeater', 'attachment_collection', 'media']
    ).includes(this.kind()),
  );
  readonly numbers = computed(() =>
    resourceNumbers(this.kind(), this.validation()),
  );
  readonly flags = computed(() =>
    this.validation()
      ? []
      : this.kind() === 'attachment_collection'
        ? resourceFlags
        : resourceFlags.slice(0, 1),
  );
  private readonly buffers = linkedSignal<Record<string, string>>(() => {
    this.identity();
    return {};
  });
  private readonly patches = linkedSignal<JsonObject>(() => {
    this.identity();
    return {};
  });
  readonly mime = linkedSignal<string | null>(() => {
    this.identity();
    return null;
  });
  readonly draft = computed(() =>
    resourceSettingsDraft(
      this.value(),
      this.patches(),
      this.numbers(),
      this.buffers(),
      this.mime(),
    ),
  );
  readonly valid = computed(() => this.draft().errors.length === 0);
  constructor() {
    effect(() => this.validChange.emit(!this.supported() || this.valid()));
  }
  numberText(key: string): string {
    return (
      this.buffers()[key] ??
      (typeof this.value()[key] === 'number' ? String(this.value()[key]) : '')
    );
  }
  number(key: string, text: string): void {
    if (this.disabled()) {
      return;
    }
    this.buffers.update((current) => ({ ...current, [key]: text }));
    this.publish();
  }
  flagValue(key: string): string {
    const value = this.draft().value[key];
    return typeof value === 'boolean' ? String(value) : 'default';
  }
  flag(key: string, value: string): void {
    if (
      this.disabled() ||
      !this.flags().some((field) => field.key === key) ||
      !['true', 'false', 'default'].includes(value)
    ) {
      return;
    }
    this.patches.update((current) => ({
      ...current,
      [key]: value === 'default' ? null : value === 'true',
    }));
    this.publish();
  }
  readonly kinds = computed(() => {
    const value = this.draft().value['allowed_kinds'];
    return Array.isArray(value) && value.length
      ? value.length === 2
        ? 'both'
        : value[0]
      : 'default';
  });
  category(value: string): void {
    if (
      this.disabled() ||
      !['default', 'file', 'image', 'both'].includes(value)
    ) {
      return;
    }
    this.patches.update((current) => ({
      ...current,
      allowed_kinds:
        value === 'default'
          ? null
          : value === 'both'
            ? ['file', 'image']
            : [value],
    }));
    this.publish();
  }
  mimeText(): string {
    const value = this.value()['allowed_mime_types'];
    return this.mime() ?? (Array.isArray(value) ? value.join('\n') : '');
  }
  changeMime(value: string): void {
    if (!this.disabled()) {
      this.mime.set(value);
      this.publish();
    }
  }
  private publish(): void {
    this.changed.emit();
    this.validChange.emit(this.valid());
    if (this.valid()) {
      this.valueChanged.emit(this.draft().value);
    }
  }
}
