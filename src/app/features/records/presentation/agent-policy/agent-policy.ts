import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { ActorState } from '../../../../core/auth/actor-state';
@Component({
  selector: 'app-agent-policy',
  imports: [
    FormsModule,
    ButtonDirective,
    InputTextModule,
    CheckboxModule,
    ControlField,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './agent-policy.html',
  styleUrl: './agent-policy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentPolicy {
  constructor() {
    const release = inject(ActorState).register(() => {
      this.drafts = {};
    });
    inject(DestroyRef).onDestroy(release);
  }
  readonly value = input<JsonObject>({});
  readonly classifications = input<JsonObject>({});
  readonly valueChange = output<JsonObject>();
  readonly classificationsChange = output<JsonObject>();
  readonly policyChange = output<{
    policy: JsonObject;
    classifications: JsonObject;
  }>();
  readonly disabled = input(false);
  readonly errors = input<Record<string, string>>({});
  readonly classes = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'];
  readonly sets = [
    {
      key: 'allowed_fields',
      title: 'Named inputs this agent may read',
      hint: 'Map these named inputs in the workflow AI step.',
    },
    {
      key: 'redacted_fields',
      title: 'Inputs to redact',
      hint: 'Redacted inputs are replaced before provider disclosure.',
    },
  ] as const;
  readonly sourceKeys = computed(() =>
    this.strings('allowed_retrieval_sources'),
  );
  readonly classificationRows = computed(() =>
    [
      ...new Set([
        ...Object.keys(this.classifications()),
        ...this.strings('allowed_fields'),
      ]),
    ].map((key) => ({ key, value: this.classifications()[key] ?? null })),
  );
  readonly otherTools = computed(() =>
    this.strings('allowed_tools').filter(
      (key) => key !== 'lookup_saved_report',
    ),
  );
  drafts: Record<string, string> = {};
  private readonly empty: string[] = [];
  strings(key: string): string[] {
    return (this.value()[key] ?? this.empty) as string[];
  }
  set(key: string, values: string[]): void {
    if (!this.disabled()) {
      this.valueChange.emit({ ...this.value(), [key]: values });
    }
  }
  add(key: string): void {
    if (this.disabled()) {
      return;
    }
    const name = this.drafts[key]?.trim();
    if (
      key === 'redacted_fields' &&
      !this.strings('allowed_fields').includes(name ?? '')
    ) {
      return;
    }
    if (
      name?.trim() &&
      !this.strings(key).includes(name) &&
      this.strings(key).length < 64
    ) {
      this.set(key, [...this.strings(key), name]);
      this.drafts[key] = '';
    }
  }
  remove(key: string, value: string): void {
    if (this.disabled()) {
      return;
    }
    if (key === 'allowed_fields' && !this.disabled()) {
      const classifications = { ...this.classifications() };
      delete classifications[value];
      this.policyChange.emit({
        policy: {
          ...this.value(),
          allowed_fields: this.strings(key).filter((item) => item !== value),
          redacted_fields: this.strings('redacted_fields').filter(
            (item) => item !== value,
          ),
        },
        classifications,
      });
      return;
    }
    this.set(
      key,
      this.strings(key).filter((item) => item !== value),
    );
  }
  tool(allowed: boolean): void {
    this.set(
      'allowed_tools',
      allowed
        ? [
            ...new Set([
              ...this.strings('allowed_tools'),
              'lookup_saved_report',
            ]),
          ]
        : this.strings('allowed_tools').filter(
            (key) => key !== 'lookup_saved_report',
          ),
    );
  }
  classify(key: string, value: string): void {
    if (!this.disabled()) {
      this.classificationsChange.emit({
        ...this.classifications(),
        [key]: value,
      });
    }
  }
}
