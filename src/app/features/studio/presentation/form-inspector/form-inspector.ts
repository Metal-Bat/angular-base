import { isItemScope } from '../../../forms/domain/row-values';
import { inspectorProperties } from './form-inspector-edit';
import {
  calculationResult,
  calculationScope,
  setExpression,
  setFunction,
} from './form-calculations';
import { FormRules } from '../form-rules/form-rules';
import { presentationOutline } from '../form-selection-label';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { FormGeometry } from '../form-geometry/form-geometry';
import { FormLabelEditor } from '../form-label-editor/form-label-editor';
import { FormActionSettings } from '../form-action-settings/form-action-settings';
import { focusInspector } from './focus-inspector';
import { ActorState } from '../../../../core/auth/actor-state';
import { FormBehavior } from '../form-behavior/form-behavior';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { AccordionModule } from 'primeng/accordion';
import { FormResourceSettings } from '../form-resource-settings/form-resource-settings';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import {
  JsonObject,
  JsonValue,
  RenderNode,
} from '../../../forms/domain/runtime-document';
import { authoredNode } from '../../domain/form-authoring';
import { fieldRequired, renderOf, schemaAt } from '../../domain/form-editing';
import {
  constraintSchemaFor,
  formOptions,
} from '../../domain/form-inspector-schema';
@Component({
  selector: 'app-form-inspector',
  imports: [
    AccordionModule,
    CheckboxModule,
    FormRules,
    FormGeometry,
    FormLabelEditor,
    FormActionSettings,
    FormBehavior,
    FormsModule,
    ButtonModule,
    InputTextModule,
    FormResourceSettings,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './form-inspector.html',
  styleUrl: './form-inspector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormInspector {
  readonly documents = input.required<JsonObject>();
  readonly sampleData = input<JsonObject>({});
  readonly previewLocale = input('en');
  readonly path = input.required<readonly number[]>();
  readonly disabled = input(false);
  readonly pendingEdits = input(false);
  readonly rulesOnly = input(false);
  readonly resolvedLabel = input('');
  readonly translationRequested = output<string>();
  readonly changed = output<void>();
  readonly applied = output<JsonObject>();
  readonly node = computed(() =>
    authoredNode(renderOf(this.documents()), this.path()),
  );
  readonly draft = linkedSignal<JsonObject>(() => structuredClone(this.node()));
  readonly expressionAvailable = computed(
    () => !this.scope() || !isItemScope(this.scope()!),
  );
  readonly calculationRequired = computed(
    () =>
      this.node()['component'] === 'calculated' && !this.draft()['calculation'],
  );
  readonly resolvedRender = input<RenderNode | null>(null);
  readonly fields = computed(() => [
    ...new Map(
      presentationOutline(renderOf(this.documents()), this.resolvedRender())
        .filter((field) => field.scope)
        .map((field) => [field.scope, field]),
    ).values(),
  ]);
  readonly rulePending = signal(false);
  readonly resourceValid = linkedSignal(() => {
    this.path();
    return true;
  });
  readonly validationValid = linkedSignal(() => {
    this.path();
    return true;
  });
  readonly labelPending = computed(
    () => JSON.stringify(this.draft()) !== JSON.stringify(this.node()),
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
  readonly section = linkedSignal<
    { identity: string; rulesOnly: boolean; calculationRequired: boolean },
    string
  >({
    source: () => ({
      identity: String(this.node()['node_key']) + ':' + this.path().join('/'),
      rulesOnly: this.rulesOnly(),
      calculationRequired:
        this.node()['component'] === 'calculated' &&
        !this.node()['calculation'],
    }),
    computation: (selection, previous) => {
      if (selection.rulesOnly || selection.calculationRequired) {
        return 'behavior';
      }
      return previous?.source.identity === selection.identity &&
        previous.source.rulesOnly === selection.rulesOnly
        ? previous.value
        : 'general';
    },
  });
  readonly constraintSchema = computed(() =>
    constraintSchemaFor(this.constraints()),
  );
  readonly choiceValid = linkedSignal(() => {
    this.path();
    return true;
  });
  readonly error = signal('');
  constructor() {
    focusInspector(this.path, this.disabled, this.rulesOnly);
    effect(() => {
      const calculation = (this.node()['calculation'] ?? {}) as JsonObject;
      this.calculationFunction = String(calculation['function'] ?? 'sum');
      this.calculationScopes = [...((calculation['scopes'] ?? []) as string[])];
      this.expression = String(calculation['expression'] ?? '');
    });
    const release = inject(ActorState).register(() => {
      this.expression = '';
      this.calculationFunction = 'sum';
      this.calculationScopes = [];
      this.messageKey = '';
      this.messageRole = 'label';
      this.dependencyName = '';
      this.dependencyScope = '';
      this.rulePending.set(false);
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
  expression = '';
  calculationFunction = 'sum';
  calculationScopes: string[] = [];
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
      if (['grid', 'accessibility'].includes(key)) {
        next[key] = null;
      } else {
        delete next[key];
      }
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
  calculationScope(scope: string, checked: boolean): void {
    calculationScope(this, scope, checked);
  }
  setFunction(): void {
    setFunction(this);
  }
  setExpression(): void {
    setExpression(this);
  }
  calculationResult(): string {
    return calculationResult(this);
  }
  readonly applyBlocked = computed(
    () =>
      this.disabled() ||
      !this.resourceValid() ||
      !this.validationValid() ||
      this.calculationRequired() ||
      this.rulePending() ||
      (!this.choiceValid() && this.source()['kind'] === 'custom'),
  );
  apply(): void {
    if (this.calculationRequired()) {
      return;
    }
    if (!this.resourceValid() || !this.validationValid()) {
      this.error.set('Correct the invalid limit before applying properties.');
      return;
    }
    if (this.rulePending()) {
      this.error.set('Add or discard this rule before applying properties.');
      return;
    }
    if (!this.choiceValid() && this.source()['kind'] === 'custom') {
      this.error.set('Correct the invalid choice before applying properties.');
      return;
    }
    if (this.disabled()) {
      return;
    }
    try {
      const result = inspectorProperties(this);
      this.error.set('');
      this.applied.emit(result);
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid component',
      );
    }
  }
}
