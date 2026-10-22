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
import { FormRuleValue } from '../form-rule-value/form-rule-value';
import { ActorState } from '../../../../core/auth/actor-state';
import { parseRuleValue } from '../../domain/form-rule-value';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { authoredNode, OutlineItem } from '../../domain/form-authoring';
import { renderOf, schemaAt } from '../../domain/form-editing';
import { FormRuleResource } from '../form-rule-resource/form-rule-resource';

type RuleDraft = {
  scope: string;
  operator: string;
  effect: string;
  type: string;
  text: string;
};
const emptyDraft = (): RuleDraft => ({
  scope: '',
  operator: 'eq',
  effect: 'show',
  type: 'string',
  text: '',
});
export const ruleOperators: Readonly<Record<string, string>> = {
  eq: 'Equals',
  ne: 'Not equal',
  present: 'Present',
};
export const ruleEffects: Readonly<Record<string, string>> = {
  show: 'Show',
  hide: 'Hide',
  enable: 'Enable',
  disable: 'Disable',
  require: 'Require',
};

/** A buffered rule composer; the existing inspector owns authored changes and Apply. */
@Component({
  selector: 'app-form-rules',
  imports: [
    FormsModule,
    ButtonModule,
    FormRuleValue,
    FormRuleResource,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './form-rules.html',
  styleUrl: './form-rules.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRules {
  readonly documents = input.required<JsonObject>();
  readonly data = input<JsonObject>({});
  readonly locale = input('en');
  readonly fields = input.required<readonly OutlineItem[]>();
  readonly rules = input<readonly JsonObject[]>([]);
  readonly identity = input.required<string>();
  readonly targetLabel = input('');
  readonly disabled = input(false);
  readonly rulesChanged = output<JsonObject[]>();
  readonly changed = output<void>();
  readonly pendingChange = output<boolean>();
  readonly draft = signal(emptyDraft());
  readonly pending = signal(false);
  readonly resourceCurrent = signal(false);
  private readonly resourceSelection = signal<{
    value: JsonValue;
    label: string;
    data: JsonObject;
    documents: JsonObject;
    scope: string;
  } | null>(null);
  readonly resourceField = computed(() => this.resourceFor(this.draft().scope));
  readonly operators = Object.entries(ruleOperators);
  readonly effects = Object.entries(ruleEffects);
  readonly field = computed(() =>
    this.fields().find((field) => field.scope === this.draft().scope),
  );
  readonly node = computed(() => {
    const field = this.field();
    return field ? authoredNode(renderOf(this.documents()), field.path) : {};
  });
  readonly schema = computed(() => {
    const scope = this.field()?.scope;
    return scope ? schemaAt(this.documents(), scope) : {};
  });
  readonly presenceOnly = computed(() => {
    const node = this.node();
    return (
      ['media', 'attachment_collection', 'table', 'repeater'].includes(
        String(node['component']),
      ) ||
      (Array.isArray(this.schema()['type'])
        ? (this.schema()['type'] as JsonValue[])
        : [this.schema()['type']]
      ).some((type) => ['object', 'array'].includes(String(type)))
    );
  });
  readonly choices = computed(() => {
    const source = this.node()['source'] as JsonObject | undefined;
    if (source?.['kind'] === 'custom' && Array.isArray(source['items'])) {
      return (source['items'] as JsonObject[]).map((row) => ({
        key: JSON.stringify(row['key']),
        label: String(row['value']),
      }));
    }
    const values = this.schema()['enum'];
    return Array.isArray(values)
      ? values.map((value) => ({
          key: JSON.stringify(value),
          label: this.valueText(value),
        }))
      : [];
  });
  readonly types = computed(() => {
    const value = this.schema()['type'];
    const types = Array.isArray(value) ? value : [value];
    const supported = types
      .filter((type) =>
        ['string', 'number', 'integer', 'boolean', 'null'].includes(
          String(type),
        ),
      )
      .map(String);
    return [...new Set(supported.length ? supported : ['string'])];
  });
  readonly parsed = computed<JsonValue | undefined>(() => {
    const draft = this.draft();
    if (draft.operator === 'present') {
      return null;
    }
    if (this.presenceOnly()) {
      return undefined;
    }
    if (this.resourceField()) {
      const choice = this.resourceSelection();
      if (
        !choice ||
        !this.resourceCurrent() ||
        choice.data !== this.data() ||
        choice.documents !== this.documents() ||
        choice.scope !== draft.scope ||
        JSON.stringify(choice.value) !== draft.text
      ) {
        return undefined;
      }
      const type = choice.value === null ? 'null' : typeof choice.value;
      return this.types().includes(type) ||
        (type === 'number' &&
          this.types().includes('integer') &&
          Number.isSafeInteger(choice.value))
        ? choice.value
        : undefined;
    }
    if (this.choices().length) {
      return this.choices().some((choice) => choice.key === draft.text)
        ? (JSON.parse(draft.text) as JsonValue)
        : undefined;
    }
    if (!this.types().includes(draft.type)) {
      return undefined;
    }
    return parseRuleValue(draft.type, draft.text);
  });
  readonly canAdd = computed(
    () =>
      !this.disabled() &&
      !!this.field() &&
      this.rules().length < 16 &&
      Object.hasOwn(ruleOperators, this.draft().operator) &&
      Object.hasOwn(ruleEffects, this.draft().effect) &&
      this.parsed() !== undefined,
  );
  constructor() {
    effect(() => {
      this.identity();
      this.reset();
    });
    effect(() => this.pendingChange.emit(this.pending()));
    const release = inject(ActorState).register(() => this.reset());
    inject(DestroyRef).onDestroy(release);
  }
  update(key: keyof RuleDraft, value: string): void {
    if (this.disabled()) {
      return;
    }
    this.draft.update((draft) => ({ ...draft, [key]: value }));
    if (key === 'scope') {
      this.resourceSelection.set(null);
      this.resourceCurrent.set(false);
      const type =
        this.types().find((candidate) => candidate !== 'null') ?? 'null';
      this.draft.update((draft) => ({
        ...draft,
        type,
        text: type === 'boolean' ? 'false' : '',
        operator:
          this.presenceOnly() || this.resourceField()
            ? 'present'
            : draft.operator,
      }));
    } else if (key === 'type') {
      this.draft.update((draft) => ({
        ...draft,
        text: value === 'boolean' ? 'false' : '',
      }));
    }
    this.pending.set(true);
    this.changed.emit();
  }
  add(): void {
    if (!this.canAdd()) {
      return;
    }
    const draft = this.draft();
    this.rulesChanged.emit([
      ...this.rules(),
      {
        scope: draft.scope,
        operator: draft.operator,
        effect: draft.effect,
        value: this.parsed()!,
      },
    ]);
    this.reset();
  }
  remove(index: number): void {
    if (!this.disabled()) {
      this.rulesChanged.emit(
        this.rules().filter((_, position) => position !== index),
      );
    }
  }
  discard(): void {
    if (!this.disabled()) {
      this.reset();
    }
  }
  private reset(): void {
    this.resourceSelection.set(null);
    this.resourceCurrent.set(false);
    this.draft.set(emptyDraft());
    this.pending.set(false);
  }
  resourceFor(scope: JsonValue | undefined): OutlineItem | null {
    const field = this.fields().find((item) => item.scope === scope);
    if (!field) {
      return null;
    }
    const node = authoredNode(renderOf(this.documents()), field.path);
    const source = node['source'] as JsonObject | undefined;
    return ['user', 'group'].includes(String(node['component'])) ||
      (node['component'] === 'choice' &&
        ['domain', 'remote'].includes(String(source?.['kind'])))
      ? field
      : null;
  }
  resourcePicked(choice: { value: JsonValue; label: string }): void {
    if (this.disabled()) {
      return;
    }
    this.update('text', JSON.stringify(choice.value));
    this.resourceSelection.set({
      ...choice,
      data: this.data(),
      documents: this.documents(),
      scope: this.draft().scope,
    });
    this.resourceCurrent.set(true);
  }
  fieldLabel(scope: JsonValue | undefined): string {
    return (
      this.fields().find((field) => field.scope === scope)?.label ??
      'Field unavailable'
    );
  }
  valueText(value: JsonValue | undefined): string {
    if (value === undefined) {
      return 'Value unavailable';
    }
    if (value !== null && typeof value === 'object') {
      return 'Existing structured value';
    }
    return value === null
      ? 'No value'
      : value === true
        ? 'Yes'
        : value === false
          ? 'No'
          : String(value);
  }
  comparisonText(rule: JsonObject): string {
    const field = this.fields().find(
      (candidate) => candidate.scope === rule['scope'],
    );
    const node = field
      ? authoredNode(renderOf(this.documents()), field.path)
      : {};
    if (!field) {
      return 'Value unavailable';
    }
    return ['user', 'group', 'media', 'attachment_collection'].includes(
      String(node['component']),
    )
      ? 'Selected resource'
      : this.valueText(rule['value']);
  }
  operatorLabel(key: JsonValue | undefined): string {
    return ruleOperators[String(key)] ?? 'Unsupported operator';
  }
  effectLabel(key: JsonValue | undefined): string {
    return ruleEffects[String(key)] ?? 'Unsupported effect';
  }
}
