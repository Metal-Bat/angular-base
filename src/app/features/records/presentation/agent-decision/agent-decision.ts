import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { NgTemplateOutlet } from '@angular/common';
import { parseNumberText } from '../../../../shared/domain/number-text';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { ActorState } from '../../../../core/auth/actor-state';
@Component({
  selector: 'app-agent-decision',
  imports: [
    FormsModule,
    TabsModule,
    NgTemplateOutlet,
    ButtonDirective,
    InputTextModule,
    TextareaModule,
    ControlField,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './agent-decision.html',
  styleUrl: './agent-decision.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentDecision {
  constructor() {
    const release = inject(ActorState).register(() => {
      this.variants.clear();
      this.reviewText.set(String(this.value()['review_below'] ?? 0.8));
      this.locale.set('en');
    });
    inject(DestroyRef).onDestroy(release);
  }
  readonly value = input<JsonObject>({});
  readonly valueChange = output<JsonObject>();
  readonly disabled = input(false);
  readonly errors = input<Record<string, string>>({});
  readonly changed = output<void>();
  readonly inputKeys = input<readonly string[]>([]);
  readonly languages = [
    { key: 'en', label: 'English' },
    { key: 'fa', label: 'فارسی' },
    { key: 'ar', label: 'العربية' },
  ];
  private readonly reviewValue = computed(() =>
    String(this.value()['review_below'] ?? 0.8),
  );
  readonly reviewText = linkedSignal(() => this.reviewValue());
  readonly reviewValid = computed(() => {
    const value = parseNumberText(this.reviewText());
    return value !== undefined && value >= 0 && value <= 1;
  });
  readonly valid = computed(
    () =>
      this.reviewValid() &&
      (this.mode() !== 'static' || this.keyErrors().every((error) => !error)) &&
      (this.mode() !== 'input' ||
        this.inputKeys().includes(
          String(this.value()['options_input_key'] ?? ''),
        )),
  );
  readonly locale = signal('en');
  readonly mode = computed(() =>
    typeof this.value()['options_input_key'] === 'string' ? 'input' : 'static',
  );
  readonly choices = computed(
    () => (this.value()['options'] ?? []) as JsonObject[],
  );
  readonly keyErrors = computed(() => {
    const keys = this.choices().map((choice) => String(choice['key'] ?? ''));
    const counts = new Map<string, number>();
    for (const key of keys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return keys.map((key) =>
      /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(key) && counts.get(key) === 1
        ? ''
        : 'Use a unique choice key starting with a letter.',
    );
  });
  private readonly variants = new Map<string, JsonObject>();
  set(key: string, value: JsonValue | undefined): void {
    if (this.disabled()) {
      return;
    }
    const next = { ...this.value() };
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this.valueChange.emit(next);
  }
  changeMode(mode: string): void {
    if (this.disabled() || mode === this.mode()) {
      return;
    }
    this.variants.set(this.mode(), structuredClone(this.value()));
    const common = { ...this.value() };
    delete common['options'];
    delete common['options_input_key'];
    const next = {
      ...(this.variants.get(mode) ??
        (mode === 'input' ? { options_input_key: '' } : { options: [] })),
      ...common,
    };
    this.valueChange.emit(next);
  }
  updateChoice(index: number, key: string, value: JsonValue): void {
    this.set(
      'options',
      this.choices().map((choice, current) =>
        current === index ? { ...choice, [key]: value } : choice,
      ),
    );
  }
  label(index: number, value: string): void {
    const labels = {
      ...((this.choices()[index]['labels'] ?? {}) as JsonObject),
    };
    if (value.trim()) {
      labels[this.locale()] = value;
    } else {
      delete labels[this.locale()];
    }
    this.updateChoice(index, 'labels', labels);
  }
  choiceLabel(choice: JsonObject): string {
    return String(
      ((choice['labels'] ?? {}) as JsonObject)[this.locale()] ?? '',
    );
  }
  add(): void {
    if (this.choices().length < 254) {
      this.set('options', [
        ...this.choices(),
        {
          key: 'choice_' + crypto.randomUUID().replaceAll('-', ''),
          description: '',
          labels: {},
        },
      ]);
    }
  }
  move(index: number, offset: number): void {
    const next = [...this.choices()];
    const target = index + offset;
    if (target < 0 || target >= next.length || !next[index]) {
      return;
    }
    [next[index], next[target]] = [next[target], next[index]];
    this.set('options', next);
  }
  remove(index: number): void {
    this.set(
      'options',
      this.choices().filter((_, current) => current !== index),
    );
  }
  number(value: string | number | null): void {
    if (this.disabled()) {
      return;
    }
    this.reviewText.set(value === null ? '' : String(value));
    this.changed.emit();
    if (this.reviewValid()) {
      this.set('review_below', parseNumberText(this.reviewText())!);
    }
  }
}
