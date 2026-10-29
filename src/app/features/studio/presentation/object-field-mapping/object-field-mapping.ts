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
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { JsonObject, JsonValue } from '../../../../shared/domain/json-value';
import { CanvasNode, CanvasPort } from '../../domain/workflow-authoring';
import { MappingSource } from '../../domain/mapping-sources';
import { mappingFields } from '../../domain/mapping-fields';
import {
  addObjectField,
  objectDeclaration,
  objectPort,
} from '../../domain/object-field-mappings';
import { mappingCompatible } from '../../domain/mapping-schema';
import { seedValue } from '../../../../shared/domain/schema-form';
import { MappingConstant } from '../mapping-constant/mapping-constant';

@Component({
  selector: 'app-object-field-mapping',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
    MappingConstant,
  ],
  templateUrl: './object-field-mapping.html',
  styleUrl: './object-field-mapping.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectFieldMapping {
  readonly graph = input.required<JsonObject>();
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly step = input.required<string>();
  readonly port = input<CanvasPort>();
  readonly sources = input.required<readonly MappingSource[]>();
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly discarded = output<void>();
  readonly supported = computed(
    () => !!this.port() && objectPort(this.port()!),
  );
  readonly fields = computed(() =>
    this.port()
      ? mappingFields(
          objectDeclaration(this.graph(), this.step(), this.port()!),
        )
      : [],
  );
  readonly fixed = computed(
    () =>
      Object.keys((this.port()?.schema['properties'] ?? {}) as JsonObject)
        .length > 0,
  );
  private readonly context = computed(() =>
    JSON.stringify([this.step(), this.port()?.key, this.port()?.schema]),
  );
  readonly destination = signal('');
  readonly name = signal('');
  readonly kind = signal('string');
  readonly source = signal('');
  readonly constant = signal<JsonValue | undefined>(undefined);
  readonly ready = signal(true);
  readonly error = signal('');
  readonly pending = signal(false);
  readonly selectedSource = computed(() =>
    this.sources().find((item) => item.key === this.source()),
  );
  readonly schema = computed<JsonObject>(
    () =>
      this.fields().find((field) => field.path === this.destination())
        ?.schema ??
      this.selectedSource()?.schema ??
      (this.kind() === 'array'
        ? { type: 'array', items: { type: 'string' } }
        : { type: this.kind() }),
  );
  readonly compatible = (schema: JsonObject): boolean =>
    mappingCompatible(schema, this.schema());
  constructor() {
    effect(() => {
      this.context();
      this.reset();
    });
    const release = inject(ActorState).register(() => this.reset());
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  reset(): void {
    this.destination.set('');
    this.name.set('');
    this.source.set('');
    this.kind.set('string');
    this.constant.set(undefined);
    this.ready.set(true);
    this.error.set('');
    this.pending.set(false);
  }
  touch(): void {
    this.pending.set(true);
    this.error.set('');
    this.changed.emit();
  }
  choose(): void {
    this.constant.set(
      this.schema()['type'] === 'null'
        ? null
        : this.schema()['type'] === 'boolean'
          ? false
          : seedValue(this.schema()),
    );
    this.touch();
  }
  cancel(): void {
    this.reset();
    this.discarded.emit();
  }
  add(): void {
    if (this.disabled() || !this.port()) {
      return;
    }
    try {
      if (this.source() && !this.selectedSource()) {
        throw Error('Reload sources to edit this mapping.');
      }
      const graph = addObjectField(
        this.graph(),
        this.step(),
        this.port()!,
        this.nodes(),
        this.selectedSource() ?? null,
        this.constant(),
        this.destination(),
        this.name(),
        this.schema(),
      );
      this.reset();
      this.applied.emit(graph);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
  }
}
