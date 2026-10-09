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
import { ActorState } from '../../../../core/auth/actor-state';
import { FormBehavior } from '../form-behavior/form-behavior';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { authoredNode, outline } from '../../domain/form-authoring';
import {
  fieldRequired,
  patchConstraints,
  patchNode,
  renderOf,
  schemaAt,
} from '../../domain/form-editing';
import {
  choicesSchema,
  constraintSchema,
  formOptions,
  ruleValueSchema,
} from '../../domain/form-inspector-schema';
@Component({
  selector: 'app-form-inspector',
  imports: [
    FormBehavior,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SchemaInput,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './form-inspector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormInspector {
  readonly documents = input.required<JsonObject>();
  readonly path = input.required<readonly number[]>();
  readonly disabled = input(false);
  readonly changed = output<void>();
  readonly applied = output<JsonObject>();
  readonly node = computed(() =>
    authoredNode(renderOf(this.documents()), this.path()),
  );
  readonly draft = linkedSignal<JsonObject>(() => structuredClone(this.node()));
  readonly fields = computed(() =>
    outline(renderOf(this.documents())).filter((item) => item.scope),
  );
  readonly scope = computed(() =>
    typeof this.node()['scope'] === 'string'
      ? (this.node()['scope'] as string)
      : null,
  );
  readonly constraints = linkedSignal<JsonObject>(() => {
    const scope = this.scope();
    return scope ? structuredClone(schemaAt(this.documents(), scope)) : {};
  });
  readonly required = linkedSignal(() =>
    this.scope() ? fieldRequired(this.documents(), this.scope()!) : false,
  );
  readonly optionsSchema = computed(
    () => formOptions[String(this.node()['component'])] ?? null,
  );
  readonly constraintSchema = constraintSchema;
  readonly valueSchema = ruleValueSchema;
  readonly choicesSchema = choicesSchema;
  readonly error = signal('');
  constructor() {
    const release = inject(ActorState).register(() => {
      this.ruleScope = '';
      this.ruleValue = '';
      this.expression = '';
      this.messageKey = '';
      this.messageRole = 'label';
      this.dependencyName = '';
      this.dependencyScope = '';
      this.ruleOperator = 'eq';
      this.ruleEffect = 'show';
      this.error.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  readonly hasChoices = computed(() =>
    ['choice', 'user', 'group'].includes(String(this.node()['component'])),
  );
  readonly messageKeys = computed(() =>
    Object.keys(
      ((
        ((this.documents()['localization'] ?? {}) as JsonObject)['catalogs'] as
          JsonObject | undefined
      )?.['en'] ?? {}) as JsonObject,
    ),
  );
  messageRole = 'label';
  messageKey = '';
  setMessage(): void {
    if (
      this.disabled() ||
      !['label', 'help', 'placeholder', 'action', 'confirmation'].includes(
        this.messageRole,
      ) ||
      !this.messageKeys().includes(this.messageKey)
    ) {
      return;
    }
    const catalogs = ((this.documents()['localization'] ?? {}) as JsonObject)[
      'catalogs'
    ] as JsonObject | undefined;
    const entry = (catalogs?.['en'] as JsonObject | undefined)?.[
      this.messageKey
    ] as JsonObject | undefined;
    if (Object.keys((entry?.['parameters'] ?? {}) as JsonObject).length) {
      this.error.set(
        'Parameterized messages require their existing contract editor',
      );
      return;
    }
    this.patch('messages', {
      ...((this.draft()['messages'] ?? {}) as JsonObject),
      [this.messageRole]: { key: this.messageKey, arguments: {} },
    });
  }
  ruleScope = '';
  ruleOperator = 'eq';
  ruleEffect = 'show';
  ruleValue: JsonValue = '';
  expression = '';
  dependencyName = '';
  dependencyScope = '';
  readonly rules = computed(
    () => (this.draft()['rules'] ?? []) as JsonObject[],
  );
  readonly source = computed(
    () =>
      (this.draft()['source'] ??
        (['user', 'group'].includes(String(this.node()['component']))
          ? {
              kind: 'domain',
              selector:
                this.node()['selector'] ??
                (this.node()['component'] === 'group'
                  ? 'work_groups'
                  : 'users'),
            }
          : { kind: 'schema' })) as JsonObject,
  );
  readonly options = computed(
    () => (this.draft()['options'] ?? {}) as JsonObject,
  );
  patch(key: string, value: JsonValue | undefined): void {
    if (this.disabled()) {
      return;
    }
    const next = { ...this.draft() };
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this.draft.set(next);
    this.changed.emit();
  }
  constraint(value: JsonValue | undefined): void {
    if (
      this.disabled() ||
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return;
    }
    this.constraints.set(value as JsonObject);
    this.changed.emit();
  }
  requirement(value: boolean): void {
    if (!this.disabled()) {
      this.required.set(value);
      this.changed.emit();
    }
  }
  addRule(): void {
    if (
      !['eq', 'ne', 'present'].includes(this.ruleOperator) ||
      !['show', 'hide', 'enable', 'disable', 'require'].includes(
        this.ruleEffect,
      ) ||
      this.disabled() ||
      this.rules().length >= 16 ||
      !this.fields().some((item) => item.scope === this.ruleScope)
    ) {
      return;
    }
    this.patch('rules', [
      ...this.rules(),
      {
        scope: this.ruleScope,
        operator: this.ruleOperator,
        effect: this.ruleEffect,
        value: this.ruleValue,
      },
    ]);
  }
  removeRule(index: number): void {
    this.patch(
      'rules',
      this.rules().filter((_, position) => position !== index),
    );
  }
  sourceKind(kind: string): void {
    if (
      this.disabled() ||
      !['schema', 'custom', 'domain'].includes(kind) ||
      (['user', 'group'].includes(String(this.node()['component'])) &&
        kind !== 'domain') ||
      this.source()['kind'] === 'remote'
    ) {
      return;
    }
    const base = { ...this.source(), kind } as Record<string, JsonValue>;
    delete base['items'];
    delete base['selector'];
    delete base['membership'];
    if (kind === 'custom') {
      base['items'] = [{ key: 'option1', value: 'Option 1' }];
    }
    if (kind === 'domain') {
      base['selector'] =
        this.node()['component'] === 'group' ? 'work_groups' : 'users';
    }
    this.patch('selector', null);
    this.patch('source', base);
  }
  sourcePatch(key: string, value: JsonValue | undefined): void {
    if (
      value !== undefined &&
      !this.disabled() &&
      this.source()['kind'] !== 'remote'
    ) {
      this.patch('selector', null);
      this.patch('source', { ...this.source(), [key]: value });
    }
  }
  readonly dependencies = computed(() =>
    Object.entries((this.source()['dependencies'] ?? {}) as JsonObject),
  );
  addDependency(): void {
    if (
      this.disabled() ||
      this.source()['kind'] === 'remote' ||
      !/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(this.dependencyName) ||
      !this.fields().some((field) => field.scope === this.dependencyScope) ||
      this.dependencies().length >= 8
    ) {
      return;
    }
    this.sourcePatch('dependencies', {
      ...((this.source()['dependencies'] ?? {}) as JsonObject),
      [this.dependencyName]: this.dependencyScope,
    });
    this.dependencyName = '';
    this.dependencyScope = '';
  }
  removeDependency(name: string): void {
    if (this.source()['kind'] === 'remote') {
      return;
    }
    const dependencies = {
      ...((this.source()['dependencies'] ?? {}) as JsonObject),
    };
    delete dependencies[name];
    this.sourcePatch('dependencies', dependencies);
  }
  setExpression(): void {
    if (!this.expression.trim() || this.expression.length > 1024) {
      this.error.set('Invalid expression');
      return;
    }
    const calculation = {
      ...((this.draft()['calculation'] ?? {}) as JsonObject),
      expression: this.expression,
    } as Record<string, JsonValue>;
    delete calculation['function'];
    delete calculation['scopes'];
    this.patch('calculation', calculation);
  }
  apply(): void {
    if (this.disabled()) {
      return;
    }
    try {
      const patch = { ...this.draft() } as Record<string, JsonValue>;
      for (const key of ['node_key', 'component', 'scope', 'children']) {
        delete patch[key];
      }
      let result = patchNode(this.documents(), this.path(), patch);
      if (this.scope()) {
        result = patchConstraints(
          result,
          this.scope()!,
          this.constraints(),
          this.required(),
        );
      }
      this.error.set('');
      this.applied.emit(result);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid component',
      );
    }
  }
}
