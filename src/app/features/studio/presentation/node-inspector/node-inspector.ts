import { primitiveChoiceLabels } from '../../domain/primitive-configuration';
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
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SchemaInput } from '../../../../shared/ui/schema-input/schema-input';
import { schemaErrors } from '../../../../shared/domain/schema-form';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import {
  applyConfiguration,
  editableFields,
  flowSchema,
  inspectorFor,
  patchOwned,
  scalarSchema,
  taskSchema,
} from '../../domain/node-inspector';
import { NodeDetails } from '../node-details/node-details';
import { SubprocessPin } from '../subprocess-pin/subprocess-pin';
import { StudioChoice } from '../studio-choice/studio-choice';
import { TransformProjection } from '../transform-projection/transform-projection';
import { transformErrors } from '../../domain/transform-contract';
import { boundInputSchema } from '../../domain/mapping-fields';
import { OperationChoice } from '../operation-choice/operation-choice';
@Component({
  selector: 'app-node-inspector',
  imports: [
    OperationChoice,
    TransformProjection,
    ButtonDirective,
    LocalizePipe,
    SchemaInput,
    StudioChoice,
    SubprocessPin,
    NodeDetails,
  ],
  templateUrl: './node-inspector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeInspector {
  readonly primitiveChoiceLabels = primitiveChoiceLabels;
  readonly step = input.required<JsonObject>();
  readonly catalog = input.required<readonly JsonObject[]>();
  readonly graph = input<JsonObject>({});
  readonly projectionSchema = computed(() =>
    boundInputSchema(this.graph(), String(this.step()['key']), 'value'),
  );
  readonly version = input('');
  readonly children = input<readonly JsonObject[]>([]);
  readonly child = linkedSignal(() =>
    structuredClone(this.step()['subprocess'] as JsonObject | undefined),
  );
  readonly disabled = input(false);
  readonly changed = output<void>();
  readonly applied = output<JsonObject>();
  readonly discarded = output<void>();
  readonly inspector = computed(() =>
    inspectorFor(this.step(), this.catalog()),
  );
  readonly fields = computed(() => {
    const inspector = this.inspector();
    return inspector ? editableFields(inspector) : [];
  });
  readonly draft = linkedSignal(() =>
    structuredClone((this.step()['config'] ?? {}) as JsonObject),
  );
  readonly task = linkedSignal(() =>
    structuredClone(this.step()['task_contract'] as JsonObject | undefined),
  );
  readonly flow = linkedSignal(() =>
    structuredClone(this.step()['flow'] as JsonObject | undefined),
  );
  readonly childValid = linkedSignal(() => {
    this.step();
    return true;
  });
  readonly projectionValid = signal(true);
  readonly errors = signal<Readonly<Record<string, string>>>({});
  readonly taskSchema = taskSchema;
  readonly flowSchema = flowSchema;
  editable(key: string, schema: JsonObject): boolean {
    return (
      scalarSchema(schema) ||
      (this.inspector()?.handler_key === 'transform' &&
        this.inspector()?.handler_version === '2' &&
        ['default', 'projection'].includes(key))
    );
  }
  readonly String = String;
  readonly connectionContext = computed<JsonObject>(() => ({
    ...(this.inspector()?.handler_key === 'notification'
      ? { kind: 'NOTIFICATION' }
      : this.inspector()?.handler_key === 'service_task'
        ? { kind: 'SERVICE' }
        : {}),
  }));
  readonly extraKeys = computed(() =>
    Object.keys(this.draft()).filter(
      (key) => !this.fields().some((field) => field.key === key),
    ),
  );
  readonly hasErrors = computed(() => Object.keys(this.errors()).length > 0);
  constructor() {
    const release = inject(ActorState).register(() => {
      this.draft.set({});
      this.task.set(undefined);
      this.flow.set(undefined);
      this.child.set(undefined);
      this.errors.set({});
      this.childValid.set(true);
    });
    inject(DestroyRef).onDestroy(release);
  }
  update(key: string, value: JsonValue | undefined): void {
    if (this.disabled()) {
      return;
    }
    this.draft.update((draft) => patchOwned(draft, key, value));
    this.errors.set({});
    this.changed.emit();
  }
  discard(): void {
    if (this.disabled()) {
      return;
    }
    this.draft.set(
      structuredClone((this.step()['config'] ?? {}) as JsonObject),
    );
    this.task.set(
      structuredClone(this.step()['task_contract'] as JsonObject | undefined),
    );
    this.flow.set(
      structuredClone(this.step()['flow'] as JsonObject | undefined),
    );
    this.child.set(
      structuredClone(this.step()['subprocess'] as JsonObject | undefined),
    );
    this.errors.set({});
    this.childValid.set(true);
    this.discarded.emit();
  }
  updateSection(
    section: 'task' | 'flow' | 'child',
    value: JsonValue | undefined,
  ): void {
    if (this.disabled()) {
      return;
    }
    this[section].set(value as JsonObject | undefined);
    this.errors.set({});
    this.changed.emit();
  }
  apply(): void {
    const inspector = this.inspector();
    if (this.disabled() || !inspector) {
      return;
    }
    if (!this.projectionValid()) {
      this.errors.set({
        projection: 'Add or discard the pending projected field.',
      });
      return;
    }
    if (!this.childValid()) {
      this.errors.set({ child: 'Invalid value' });
      return;
    }
    const owned = Object.fromEntries(
      this.fields().map((field) => [field.key, this.draft()[field.key]]),
    ) as JsonObject;
    const errors = {
      ...schemaErrors(inspector.config_schema, owned),
      ...(inspector.handler_key === 'transform' &&
      inspector.handler_version === '2'
        ? transformErrors(this.draft())
        : {}),
      ...(this.task() ? schemaErrors(taskSchema, this.task(), 'task') : {}),
      ...(this.flow() ? schemaErrors(flowSchema, this.flow(), 'flow') : {}),
    };
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      return;
    }
    let next = applyConfiguration(this.step(), inspector, this.draft());
    next = patchOwned(next, 'task_contract', this.task());
    next = patchOwned(next, 'flow', this.flow());
    next = patchOwned(next, 'subprocess', this.child());
    this.applied.emit(next);
  }
}
