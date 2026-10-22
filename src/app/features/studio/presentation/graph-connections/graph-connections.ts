import { workflowMappingSources } from '../../domain/interface-sources';
import { translatedSchemaSummary } from '../schema-summary';
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
import { Locale } from '../../../../core/localization/locale';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { MappingConstant } from '../mapping-constant/mapping-constant';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { STUDIO_API } from '../../bindings';
import { CanvasNode, connectionKey } from '../../domain/workflow-authoring';
import {
  addCandidate,
  addMapping,
  removeMapping,
} from '../../domain/graph-controls';
import { editorSchema, mappingCompatible } from '../../domain/mapping-schema';
import {
  invalidCollectionIndex,
  isMappingCollection,
  literalErrors,
  mappingItem,
  mappingSelection,
  moveMapping,
  replaceMapping,
} from '../../domain/data-mappings';
import { seedValue } from '../../../../shared/domain/schema-form';
import { mappingFields } from '../../domain/mapping-fields';
import { CollectionSource } from '../collection-source/collection-source';
import { MappingList } from '../mapping-list/mapping-list';
import type { MappingSource } from '../../domain/mapping-sources';
import { StudioChoice } from '../studio-choice/studio-choice';
import { CandidateTargets } from '../candidate-targets/candidate-targets';
import { TransitionEditor } from '../transition-editor/transition-editor';
@Component({
  selector: 'app-graph-connections',
  imports: [
    CandidateTargets,
    MappingList,
    CollectionSource,
    TransitionEditor,
    FormsModule,
    ButtonDirective,
    LocalizePipe,
    SelectControl,
    MappingConstant,
    StudioChoice,
  ],
  templateUrl: './graph-connections.html',
  styleUrl: './graph-connections.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphConnections {
  readonly graph = input.required<JsonObject>();
  readonly inspectedEdge = input('');
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly selected = input.required<string>();
  readonly version = input.required<string>();
  readonly human = input(false);
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
  readonly changed = output<void>();
  readonly discarded = output<void>();
  readonly transitionPending = signal(false);
  readonly sourceDisabled = computed(
    () => this.disabled() || this.transitionPending(),
  );
  readonly interactionDisabled = computed(
    () => this.disabled() || this.transitionPending() || !this.targets().length,
  );
  readonly itemIndex = signal<number | null>(null);
  readonly itemField = signal('');
  readonly selectedSource = computed(() =>
    this.sources().find((item) => item.key === this.source()),
  );
  readonly collectionSource = computed(() =>
    isMappingCollection(this.selectedSource()),
  );
  readonly constantReady = signal(true);
  readonly editing = signal('');
  readonly mappingPending = signal(false);
  readonly fieldErrors = signal<Readonly<Record<string, string>>>({});
  private readonly locale = inject(Locale);
  summary(schema: JsonObject): string {
    return translatedSchemaSummary(schema, (value) => this.locale.text(value));
  }
  readonly request = signal('');
  readonly rows = signal<readonly JsonObject[]>([]);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly source = signal('');
  readonly target = signal('');
  readonly constant = signal<JsonValue | undefined>(undefined);
  readonly sources = computed(() =>
    workflowMappingSources(
      this.rows(),
      this.graph(),
      this.selected(),
      this.nodes(),
      true,
    ),
  );
  readonly targets = computed(
    () =>
      this.nodes()
        .find((node) => node.key === this.selected())
        ?.ports.filter((port) => port.direction === 'INPUT') ?? [],
  );
  readonly targetPort = computed(() =>
    this.targets().find((port) => port.key === this.target()),
  );
  readonly targetSchema = computed(() =>
    editorSchema(this.targetPort()?.schema ?? {}),
  );
  readonly compatible = (schema: JsonObject): boolean =>
    mappingCompatible(schema, this.targetPort()?.schema ?? {});
  readonly bindings = computed(() =>
    ((this.graph()['bindings'] ?? []) as JsonObject[])
      .filter((binding) => binding['step'] === this.selected())
      .map((binding) => ({
        id: connectionKey('data', binding),
        edge: binding,
      })),
  );
  removeMapping(id: string): void {
    if (this.disabled() || this.transitionPending() || this.mappingPending()) {
      return;
    }
    try {
      this.applied.emit(removeMapping(this.graph(), id));
      this.error.set('');
    } catch {
      this.error.set('Invalid connection');
    }
  }
  readonly transitions = computed(() =>
    ((this.graph()['transitions'] ?? []) as JsonObject[])
      .map((edge, index) => ({ edge, index }))
      .filter((item) => item.edge['source'] === this.selected()),
  );
  readonly candidates = computed(() =>
    ((this.graph()['targets'] ?? []) as JsonObject[]).filter(
      (item) => item['step'] === this.selected(),
    ),
  );
  readonly missingRoutes = computed(() => {
    const step = (this.graph()['steps'] as JsonObject[]).find(
      (item) => item['key'] === this.selected(),
    );
    const actions = ((step?.['task_contract'] as JsonObject | undefined)?.[
      'actions'
    ] ?? []) as JsonObject[];
    return actions
      .filter(
        (action) =>
          !this.transitions().some(
            (item) => item.edge['outcome'] === action['outcome_key'],
          ),
      )
      .map((action) => String(action['outcome_key']));
  });
  private readonly api = inject(STUDIO_API);
  private generation = 0;
  constructor() {
    effect(() => {
      this.selected();
      this.version();
      this.reset();
    });
    effect(() => {
      if (this.disabled()) {
        this.generation++;
        this.busy.set(false);
      }
    });
    const release = inject(ActorState).register(() => this.reset());
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  reset(): void {
    this.generation++;
    this.request.set('');
    this.rows.set([]);
    this.page.set(1);
    this.pages.set(0);
    this.busy.set(false);
    this.error.set('');
    this.source.set('');
    this.itemIndex.set(null);
    this.itemField.set('');
    this.target.set('');
    this.editing.set('');
    this.mappingPending.set(false);
    this.fieldErrors.set({});
    this.constant.set(undefined);
    this.transitionPending.set(false);
    this.constantReady.set(true);
  }
  setRequest(value: string): void {
    this.generation++;
    this.request.set(value);
    this.rows.set([]);
    this.busy.set(false);
  }
  async load(page = 1): Promise<void> {
    if (!this.request() || this.disabled() || this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.rows.set([]);
    try {
      const result = (await this.api.auxiliary('completion', {
        workflow_version_ref_id: this.version(),
        request_type_ref_id: this.request(),
        current_step_key: this.selected(),
        page,
        size: 100,
      })) as { items: JsonObject[]; totalPages: number };
      if (generation !== this.generation || this.disabled()) {
        return;
      }
      this.rows.set(result.items);
      this.page.set(page);
      this.pages.set(result.totalPages);
    } catch {
      if (generation === this.generation) {
        this.error.set('Reference search failed. Retry or reload.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  map(): void {
    if (this.collectionSource() && invalidCollectionIndex(this.itemIndex())) {
      this.error.set('');
      return;
    }
    if (
      this.source() &&
      !this.sources().some((item) => item.key === this.source())
    ) {
      this.error.set('Source port changed. Reload suggestions.');
      return;
    }
    this.fieldErrors.set(
      this.source() ? {} : literalErrors(this.targetSchema(), this.constant()),
    );
    this.apply(() => {
      const next = this.editing()
        ? replaceMapping(
            this.graph(),
            this.editing(),
            this.nodes(),
            this.mappingSource(),
            this.constant(),
          )
        : addMapping(
            this.graph(),
            this.selected(),
            this.target(),
            this.nodes(),
            this.mappingSource(),
            this.constant(),
          );
      this.mappingPending.set(false);
      this.fieldErrors.set({});
      this.editing.set('');
      this.source.set('');
      this.itemIndex.set(null);
      this.itemField.set('');
      this.constant.set(seedValue(this.targetSchema()));
      return next;
    });
  }
  private mappingSource(): MappingSource | null {
    const source = this.selectedSource();
    return source && this.itemIndex() !== null
      ? mappingItem(source, this.itemIndex()!, this.itemField())
      : (source ?? null);
  }
  sourceChanged(value: string): void {
    this.source.set(value);
    this.constantReady.set(true);
    this.itemIndex.set(null);
    this.itemField.set('');
    this.touch();
  }
  sourceSelectable(source: MappingSource): boolean {
    const schema = source.schema;
    return (
      this.compatible(schema) ||
      (isMappingCollection(source) &&
        (this.compatible((editorSchema(schema)['items'] as JsonObject) ?? {}) ||
          mappingFields(
            (editorSchema(schema)['items'] as JsonObject) ?? {},
          ).some((field) => this.compatible(field.schema))))
    );
  }
  updateTarget(value: string): void {
    this.target.set(value);
    const schema = this.targetSchema();
    this.constant.set(
      seedValue(schema) ?? (schema['type'] === 'boolean' ? false : undefined),
    );
    this.touch();
  }
  touch(): void {
    this.mappingPending.set(true);
    this.fieldErrors.set({});
    this.changed.emit();
  }
  edit(id: string): void {
    if (this.interactionDisabled() || this.mappingPending()) {
      return;
    }
    const row = this.bindings().find((item) => item.id === id)?.edge;
    if (!row) {
      return;
    }
    this.editing.set(id);
    this.target.set(String(row['target_port']));
    this.constant.set(
      row['source_kind'] === 'CONSTANT'
        ? structuredClone(row['constant_value'])
        : undefined,
    );
    const selection = mappingSelection(this.sources(), row);
    this.source.set(selection.key);
    this.itemIndex.set(selection.index);
    this.itemField.set(selection.field);
    this.touch();
  }
  cancel(): void {
    this.editing.set('');
    this.mappingPending.set(false);
    this.source.set('');
    this.itemIndex.set(null);
    this.itemField.set('');
    this.target.set('');
    this.constant.set(undefined);
    this.fieldErrors.set({});
    this.error.set('');
    this.discarded.emit();
  }
  move(id: string, direction: -1 | 1): void {
    this.apply(() => moveMapping(this.graph(), id, direction, this.nodes()));
  }
  transitionChanged(): void {
    this.transitionPending.set(true);
    this.changed.emit();
  }
  transitionApplied(graph: JsonObject): void {
    if (!this.disabled()) {
      this.transitionPending.set(false);
      this.applied.emit(graph);
    }
  }
  transitionDiscarded(): void {
    this.transitionPending.set(false);
    this.discarded.emit();
  }
  candidate(kind: 'user_ref' | 'work_group_ref', value: string): void {
    if (this.mappingPending()) {
      return;
    }
    this.apply(() => addCandidate(this.graph(), this.selected(), kind, value));
  }
  private apply(work: () => JsonObject): void {
    if (this.interactionDisabled()) {
      return;
    }
    try {
      this.applied.emit(work());
      this.error.set('');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid value');
    }
  }
}
