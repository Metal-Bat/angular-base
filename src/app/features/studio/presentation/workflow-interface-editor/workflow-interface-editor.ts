import {
  interfaceDocument,
  interfaceDraft,
} from '../../domain/interface-document';
import { InterfaceShape } from '../interface-shape/interface-shape';
import { InterfaceOutcomes } from '../interface-outcomes/interface-outcomes';
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
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import {
  interfaceErrors,
  interfaceOutput,
  interfaceRows,
  interfaceSources,
} from '../../domain/workflow-interface';
import { graphSteps } from '../../domain/workflow-authoring';
import { translatedSchemaSummary } from '../schema-summary';
import { Locale } from '../../../../core/localization/locale';
@Component({
  selector: 'app-workflow-interface-editor',
  imports: [
    InterfaceShape,
    InterfaceOutcomes,
    FormsModule,
    ButtonDirective,
    InputText,
    CheckboxModule,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './workflow-interface-editor.html',
  styleUrl: './workflow-interface-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowInterfaceEditor {
  readonly graph = input.required<JsonObject>();
  readonly catalog = input.required<readonly JsonObject[]>();
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly discarded = output<void>();
  readonly saved = computed(
    () => this.graph()['interface'] as JsonObject | null | undefined,
  );
  readonly unsupported = computed(
    () =>
      this.saved() !== null &&
      this.saved() !== undefined &&
      !interfaceDocument(this.saved()),
  );
  readonly locked = computed(() => this.disabled() || this.unsupported());
  readonly value = linkedSignal<JsonObject | null>(() =>
    interfaceDraft(this.saved()),
  );
  readonly outcomes = linkedSignal(() =>
    Object.entries(
      (interfaceDraft(this.saved())?.['outcomes'] ?? {}) as JsonObject,
    ).map(([name, step]) => ({ name, step: String(step) })),
  );
  readonly dirty = linkedSignal(() => {
    this.saved();
    return false;
  });
  readonly sources = computed(() =>
    interfaceSources(this.graph(), this.catalog()),
  );
  readonly finishes = computed(() =>
    graphSteps(this.graph()).filter((step) => step['type_code'] === 'FINISH'),
  );
  readonly inputs = computed(() => interfaceRows(this.value() ?? {}, 'inputs'));
  readonly outputs = computed(() =>
    interfaceRows(this.value() ?? {}, 'outputs'),
  );
  readonly sampleLocked = computed(
    () =>
      Object.keys((this.value()?.['sample_inputs'] ?? {}) as JsonObject)
        .length > 0,
  );
  readonly errors = computed(() => {
    if (!this.value()) {
      return [];
    }
    const rows = this.outcomes();
    const duplicate = new Set(rows.map((row) => row.name)).size !== rows.length;
    return [
      ...(this.shapeEditing()
        ? ['Complete or cancel the input field dialog before applying.']
        : []),
      ...(this.inputName()
        ? [
            this.canAddInput()
              ? 'Add the new input or discard its name before applying.'
              : 'Use unique port names starting with a Latin letter, up to 64 letters, digits or underscores.',
          ]
        : []),
      ...(duplicate ? ['Business outcome names must be unique.'] : []),
      ...interfaceErrors(this.document(), this.graph(), this.catalog()),
    ];
  });
  readonly shapeEditing = signal(false);
  setShapeEditing(editing: boolean): void {
    this.shapeEditing.set(editing);
    if (editing) {
      this.touch();
    }
  }
  private readonly locale = inject(Locale);
  summary(schema: JsonObject): string {
    return translatedSchemaSummary(schema, (value) => this.locale.text(value));
  }
  readonly inputName = signal('');
  readonly inputType = signal('string');
  readonly canAddInput = computed(
    () =>
      /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(this.inputName()) &&
      !this.inputs().some((row) => row['name'] === this.inputName()),
  );
  readonly types = [
    'string',
    'integer',
    'number',
    'boolean',
    'object',
    'array',
  ];
  constructor() {
    const release = inject(ActorState).register(() => {
      this.value.set(null);
      this.outcomes.set([]);
      this.dirty.set(false);
      this.inputName.set('');
      this.shapeEditing.set(false);
      this.inputType.set('string');
    });
    inject(DestroyRef).onDestroy(release);
  }
  editInputName(value: string): void {
    if (this.locked() || this.sampleLocked()) {
      return;
    }
    this.inputName.set(value);
    this.touch();
  }
  private touch(): void {
    this.dirty.set(true);
    this.changed.emit();
  }
  create(): void {
    if (this.locked()) {
      return;
    }
    this.value.set({ inputs: [], outputs: [], category: 'general' });
    this.outcomes.set([
      { name: 'done', step: String(this.finishes()[0]?.['key'] ?? '') },
    ]);
    this.touch();
  }
  field(key: string, value: JsonValue): void {
    if (this.locked() || !this.value()) {
      return;
    }
    this.value.update((current) => ({ ...current, [key]: value }));
    this.touch();
  }
  port(
    kind: 'inputs' | 'outputs',
    index: number,
    key: string,
    value: JsonValue,
  ): void {
    if (
      this.locked() ||
      (kind === 'inputs' &&
        this.sampleLocked() &&
        ['name', 'value_schema'].includes(key))
    ) {
      return;
    }
    this.field(
      kind,
      interfaceRows(this.value() ?? {}, kind).map((row, at) =>
        at === index ? { ...row, [key]: value } : row,
      ),
    );
  }
  addInput(): void {
    if (
      this.locked() ||
      this.sampleLocked() ||
      this.inputs().length >= 64 ||
      !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(this.inputName()) ||
      this.inputs().some((row) => row['name'] === this.inputName())
    ) {
      return;
    }
    const source = this.sources().find((row) => row.key === this.inputType());
    if (!source && !this.types.includes(this.inputType())) {
      return;
    }
    const schema =
      source?.schema ??
      (this.inputType() === 'array'
        ? { type: 'array', items: {} }
        : { type: this.inputType() });
    this.field('inputs', [
      ...this.inputs(),
      {
        name: this.inputName(),
        value_schema: structuredClone(schema),
        required: true,
      },
    ]);
    this.inputName.set('');
  }
  addOutput(): void {
    if (this.locked() || this.outputs().length >= 64) {
      return;
    }
    this.field('outputs', [
      ...this.outputs(),
      { name: '', source_step: '', source_port: '', value_schema: {} },
    ]);
  }
  source(index: number, key: string): void {
    const source = this.sources().find((row) => row.key === key);
    if (this.locked() || !source || !this.value()) {
      return;
    }
    this.value.set(interfaceOutput(this.value()!, index, source));
    this.touch();
  }
  sourceKey(row: JsonObject): string {
    return JSON.stringify([row['source_step'], row['source_port']]);
  }
  sourceAvailable(row: JsonObject): boolean {
    return this.sources().some((source) => source.key === this.sourceKey(row));
  }
  remove(kind: 'inputs' | 'outputs', index: number): void {
    if (this.locked() || (kind === 'inputs' && this.sampleLocked())) {
      return;
    }
    this.field(
      kind,
      interfaceRows(this.value() ?? {}, kind).filter((_, at) => at !== index),
    );
  }
  outcome(index: number, key: 'name' | 'step', value: string): void {
    if (this.locked()) {
      return;
    }
    this.outcomes.update((rows) =>
      rows.map((row, at) => (at === index ? { ...row, [key]: value } : row)),
    );
    this.touch();
  }
  addOutcome(): void {
    if (this.locked() || this.outcomes().length >= 16) {
      return;
    }
    this.outcomes.update((rows) => [...rows, { name: '', step: '' }]);
    this.touch();
  }
  removeOutcome(index: number): void {
    if (this.locked()) {
      return;
    }
    this.outcomes.update((rows) => rows.filter((_, at) => at !== index));
    this.touch();
  }
  private document(): JsonObject {
    return {
      ...this.value(),
      outcomes: Object.fromEntries(
        this.outcomes().map((row) => [row.name, row.step]),
      ),
    };
  }
  apply(): void {
    if (this.locked() || !this.dirty() || this.errors().length) {
      return;
    }
    this.applied.emit({
      ...this.graph(),
      interface: this.value() ? this.document() : null,
    });
    this.dirty.set(false);
  }
  discard(): void {
    if (this.locked()) {
      return;
    }
    this.value.set(interfaceDraft(this.saved()));
    this.outcomes.set(
      Object.entries(
        (interfaceDraft(this.saved())?.['outcomes'] ?? {}) as JsonObject,
      ).map(([name, step]) => ({ name, step: String(step) })),
    );
    this.inputName.set('');
    this.shapeEditing.set(false);
    this.dirty.set(false);
    this.discarded.emit();
  }
}
