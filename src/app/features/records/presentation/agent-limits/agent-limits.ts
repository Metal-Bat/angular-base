import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { parseNumberText } from '../../../../shared/domain/number-text';
import { latinDigits } from '../../../../shared/domain/calendar-value';
import { JsonObject } from '../../../forms/domain/runtime-document';

@Component({
  selector: 'app-agent-limits',
  imports: [
    FormsModule,
    InputTextModule,
    CheckboxModule,
    ControlField,
    LocalizePipe,
  ],
  templateUrl: './agent-limits.html',
  styleUrl: './agent-limits.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentLimits {
  readonly value = input.required<JsonObject>();
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly errors = input<Record<string, string>>({});
  readonly valueChange = output<JsonObject>();
  readonly changed = output<void>();
  readonly fields = [
    { key: 'requests', label: 'Provider requests', minimum: 1, maximum: 1000 },
    { key: 'tool_calls', label: 'Tool calls', minimum: 0, maximum: 1000 },
    {
      key: 'input_tokens',
      label: 'Input tokens',
      minimum: 1,
      maximum: 10000000,
    },
    {
      key: 'output_tokens',
      label: 'Output tokens',
      minimum: 1,
      maximum: 10000000,
    },
    {
      key: 'total_tokens',
      label: 'Total tokens',
      minimum: 1,
      maximum: 20000000,
    },
    {
      key: 'elapsed_seconds',
      label: 'Elapsed time (seconds)',
      minimum: 1,
      maximum: 86400,
    },
    {
      key: 'spend_usd',
      label: 'Spend limit (USD)',
      minimum: 0,
      maximum: 999999.999999,
    },
  ] as const;
  readonly buffers = linkedSignal<JsonObject, Record<string, string>>({
    source: () => this.value(),
    computation: (source, previous) =>
      Object.fromEntries(
        Object.entries(previous?.value ?? {}).filter(
          ([key]) => previous?.source[key] === source[key],
        ),
      ),
  });
  text(key: string): string {
    return this.buffers()[key] ?? String(this.value()[key] ?? '');
  }
  invalid(key: string): boolean {
    const field = this.fields.find((item) => item.key === key);
    if (!field) {
      return false;
    }
    const text = this.text(key).trim();
    if (key === 'spend_usd') {
      const value = parseNumberText(text);
      return (
        value === undefined || !/^\d{1,6}(?:\.\d{1,6})?$/.test(String(value))
      );
    }
    const value = parseNumberText(text);
    return (
      value === undefined ||
      !Number.isInteger(value) ||
      value < field.minimum ||
      value > field.maximum
    );
  }
  readonly valid = computed(() =>
    this.fields.every((field) => !this.invalid(field.key)),
  );
  number(key: string, text: string): void {
    if (this.disabled() || this.readonly()) {
      return;
    }
    this.buffers.update((values) => ({ ...values, [key]: text }));
    this.changed.emit();
    if (!this.invalid(key)) {
      this.valueChange.emit({
        ...this.value(),
        [key]:
          key === 'spend_usd'
            ? latinDigits(text.trim()).replaceAll('٫', '.')
            : parseNumberText(text)!,
      });
    }
  }
  strict(value: boolean): void {
    if (!this.disabled() && !this.readonly()) {
      this.valueChange.emit({ ...this.value(), strict_spend: value });
    }
  }
}
