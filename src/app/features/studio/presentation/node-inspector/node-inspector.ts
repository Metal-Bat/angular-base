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
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { schemaErrors } from '../../../administration/domain/schema-form';
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
@Component({
  selector: 'app-node-inspector',
  imports: [
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
  readonly step = input.required<JsonObject>();
  readonly catalog = input.required<readonly JsonObject[]>();
  readonly children = input<readonly JsonObject[]>([]);
  readonly child = linkedSignal(() =>
    structuredClone(this.step()['subprocess'] as JsonObject | undefined),
  );
  readonly disabled = input(false);
  readonly changed = output<void>();
  readonly applied = output<JsonObject>();
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
    if (!this.childValid()) {
      this.errors.set({ child: 'Invalid value' });
      return;
    }
    const owned = Object.fromEntries(
      this.fields().map((field) => [field.key, this.draft()[field.key]]),
    ) as JsonObject;
    const errors = {
      ...schemaErrors(inspector.config_schema, owned),
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
