import { AgentCapabilities } from '../agent-capabilities/agent-capabilities';
import { AgentDecision } from '../agent-decision/agent-decision';
import { AgentPolicy } from '../agent-policy/agent-policy';
import { AgentInstructions } from '../agent-instructions/agent-instructions';
import { AgentLimits } from '../agent-limits/agent-limits';
import { AgentOverview } from '../agent-overview/agent-overview';
import { parseDocument } from '../../../studio/domain/authoring';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { fieldErrors, RecordField } from '../../domain/records';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { RecordFields } from '../record-fields/record-fields';
import { agentSections } from '../agent-sections';
import { ActorState } from '../../../../core/auth/actor-state';
@Component({
  selector: 'app-agent-fields',
  imports: [
    AgentCapabilities,
    AgentDecision,
    AgentPolicy,
    AgentInstructions,
    AgentLimits,
    AgentOverview,
    TabsModule,
    ButtonDirective,
    LocalizePipe,
    RecordFields,
  ],
  templateUrl: './agent-fields.html',
  styleUrl: './agent-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentFields {
  constructor() {
    const release = inject(ActorState).register(() => this.check.set(null));
    inject(DestroyRef).onDestroy(release);
  }
  readonly fields = input.required<readonly RecordField[]>();
  readonly values = input.required<Record<string, string | boolean>>();
  readonly errors = input<Record<string, string>>({});
  readonly disabled = input(false);
  readonly valuesChange = output<Record<string, string | boolean>>();
  readonly changed = output<void>();
  readonly record = input<JsonObject>({});
  readonly tab = signal<string | number>('identity');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly inputRevision = signal(0);
  readonly check = signal<{
    snapshot: string;
    revision: number;
    errors: Record<string, string>;
  } | null>(null);
  readonly checkCurrent = computed(
    () =>
      this.check()?.snapshot === JSON.stringify(this.values()) &&
      this.check()?.revision === this.inputRevision(),
  );
  readonly checkIssues = computed(() =>
    this.checkCurrent() ? Object.entries(this.check()?.errors ?? {}) : [],
  );
  checkConfiguration(): void {
    const errors = fieldErrors(this.fields(), this.values());
    const limits = this.limits();
    for (const field of limits?.fields ?? []) {
      if (limits?.invalid(field.key)) {
        errors['spec.user_limits.' + field.key] =
          'Enter a value within the allowed range.';
      }
    }
    const decision = this.decision();
    if (decision?.mode() === 'static') {
      decision.keyErrors().forEach((error, index) => {
        if (error) {
          errors['spec.decision.options.' + index + '.key'] = error;
        }
      });
    }
    if (decision && !decision.reviewValid()) {
      errors['spec.decision.review_below'] =
        'Confidence must be between 0 and 1.';
    }
    if (
      decision?.mode() === 'input' &&
      !this.permittedInputs().includes(
        String(decision.value()['options_input_key'] ?? ''),
      )
    ) {
      errors['spec.decision.options_input_key'] = 'Choose a permitted input';
    }
    this.check.set({
      snapshot: JSON.stringify(this.values()),
      revision: this.inputRevision(),
      errors,
    });
  }
  unfinishedChange(): void {
    this.inputRevision.update((revision) => revision + 1);
    this.changed.emit();
  }
  issueLabel(path: string): string {
    const limit = this.limits()?.fields.find(
      (field) => path === 'spec.user_limits.' + field.key,
    );
    if (limit) {
      return limit.label;
    }
    const field = this.fields().find((item) => item.key === path);
    if (field) {
      return field.label;
    }
    const names: Record<string, string> = {
      instructions: 'Agent instructions',
      prompt_version: 'Prompt version',
      question: 'Question',
      review_below: 'Human review below confidence',
      options_input_key: 'Workflow choices input',
      options: 'Fixed choices',
      field_classifications: 'Input classifications',
    };
    return (
      names[path.split('.')[1]] ??
      names[path.split('.')[2]] ??
      agentSections.find((section) =>
        section.keys.some((key) => path.startsWith('spec.' + key)),
      )?.title ??
      'Configuration checks'
    );
  }
  private readonly decision = viewChild(AgentDecision);
  private readonly limits = viewChild(AgentLimits);
  readonly valid = computed(
    () =>
      this.limits()?.valid() !== false && this.decision()?.valid() !== false,
  );
  readonly identity = computed(() =>
    this.fields().filter((field) => field.key !== 'spec'),
  );
  readonly spec = computed(() => {
    try {
      return parseDocument(String(this.values()['spec'] ?? '{}'));
    } catch {
      return null;
    }
  });
  readonly permittedInputs = computed(() => {
    const policy = this.spec()?.['data_policy'] as JsonObject | undefined;
    const fields = policy?.['allowed_fields'];
    return Array.isArray(fields)
      ? fields.filter((field): field is string => typeof field === 'string')
      : [];
  });
  setSpec(key: string, value: JsonValue): void {
    if (this.disabled() || !this.spec()) {
      return;
    }
    this.valuesChange.emit({
      ...this.values(),
      spec: JSON.stringify({ ...this.spec(), [key]: value }),
    });
  }
  reveal(path: string): void {
    const key = path.split('.')[1];
    const section = agentSections.find((candidate) =>
      candidate.keys.some((name) => name === key),
    );
    this.tab.set(section?.key ?? 'identity');
    const language = path.match(
      /^spec\.decision\.options\.\d+\.labels\.(en|fa|ar)$/,
    )?.[1];
    if (language) {
      this.decision()?.locale.set(language);
    }
    const snapshot = this.values();
    afterNextRender(
      () => {
        if (
          snapshot !== this.values() ||
          !this.host.nativeElement.isConnected
        ) {
          return;
        }
        const target = [
          ...this.host.nativeElement.querySelectorAll<HTMLElement>(
            '[data-field-path]',
          ),
        ].find((element) => element.dataset['fieldPath'] === path);
        const details = target?.closest('details');
        if (details) {
          details.open = true;
        }
        target
          ?.querySelector<HTMLElement>(
            'input, textarea, [role="combobox"], button',
          )
          ?.focus();
      },
      { injector: this.injector },
    );
  }
  setPolicy(value: { policy: JsonObject; classifications: JsonObject }): void {
    if (!this.disabled() && this.spec()) {
      this.valuesChange.emit({
        ...this.values(),
        spec: JSON.stringify({
          ...this.spec(),
          data_policy: value.policy,
          field_classifications: value.classifications,
        }),
      });
    }
  }
  readonly sections = computed(() => {
    const field = this.fields().find((candidate) => candidate.key === 'spec');
    if (!field?.schema) {
      return [];
    }
    const properties = (field.schema['properties'] ?? {}) as JsonObject;
    return agentSections.map((section) => ({
      ...section,
      fields: [
        {
          ...field,
          label: section.title,
          schema: {
            ...field.schema,
            properties: Object.fromEntries(
              Object.entries(properties).filter(
                ([key]) =>
                  section.keys.some((name) => name === key) &&
                  key !== 'decision' &&
                  key !== 'data_policy' &&
                  key !== 'field_classifications',
              ),
            ),
            required: ((field.schema!['required'] ?? []) as string[]).filter(
              (key) =>
                section.keys.some((name) => name === key) &&
                key !== 'decision' &&
                key !== 'data_policy' &&
                key !== 'field_classifications',
            ),
          },
        },
      ],
    }));
  });
}
