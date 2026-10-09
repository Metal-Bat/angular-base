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
import { SchemaInput } from '../../../administration/presentation/schema-input/schema-input';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { STUDIO_API } from '../../bindings';
import { CanvasNode, connectionKey } from '../../domain/workflow-authoring';
import {
  addCandidate,
  addMapping,
  mappingSources,
  patchTransition,
  removeMapping,
} from '../../domain/graph-controls';
import { StudioChoice } from '../studio-choice/studio-choice';
@Component({
  selector: 'app-graph-connections',
  imports: [
    FormsModule,
    ButtonDirective,
    InputText,
    LocalizePipe,
    SelectControl,
    SchemaInput,
    StudioChoice,
  ],
  templateUrl: './graph-connections.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphConnections {
  readonly graph = input.required<JsonObject>();
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly selected = input.required<string>();
  readonly version = input.required<string>();
  readonly human = input(false);
  readonly disabled = input(false);
  readonly applied = output<JsonObject>();
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
    mappingSources(this.rows(), this.graph(), this.selected()),
  );
  readonly targets = computed(
    () =>
      this.nodes()
        .find((node) => node.key === this.selected())
        ?.ports.filter(
          (port) =>
            port.direction === 'INPUT' &&
            port.cardinality === 'SCALAR' &&
            ['string', 'integer', 'number', 'boolean'].includes(
              String(port.schema['type']),
            ),
        ) ?? [],
  );
  readonly targetSchema = computed(
    () =>
      this.targets().find((port) => port.key === this.target())?.schema ?? {
        type: 'string',
      },
  );
  readonly bindings = computed(() =>
    ((this.graph()['bindings'] ?? []) as JsonObject[])
      .filter((binding) => binding['step'] === this.selected())
      .map((binding) => ({
        id: connectionKey('data', binding),
        edge: binding,
      })),
  );
  removeMapping(id: string): void {
    this.apply(() => removeMapping(this.graph(), id));
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
      this.disabled();
      this.reset();
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
    this.target.set('');
    this.constant.set(undefined);
  }
  setRequest(value: string): void {
    this.generation++;
    this.request.set(value);
    this.rows.set([]);
    this.source.set('');
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
    this.source.set('');
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
    if (
      this.source() &&
      !this.sources().some((item) => item.key === this.source())
    ) {
      return;
    }
    this.apply(() =>
      addMapping(
        this.graph(),
        this.selected(),
        this.target(),
        this.nodes(),
        this.sources().find((item) => item.key === this.source()) ?? null,
        this.constant(),
      ),
    );
  }
  transition(index: number, key: string, value: JsonValue): void {
    const edge = (this.graph()['transitions'] as JsonObject[])[index];
    this.apply(() =>
      patchTransition(this.graph(), index, {
        priority: edge['priority'] ?? 0,
        is_default: edge['is_default'] ?? false,
        condition: edge['condition'] ?? null,
        [key]: value,
      }),
    );
  }
  candidate(kind: 'user_ref' | 'work_group_ref', value: string): void {
    this.apply(() => addCandidate(this.graph(), this.selected(), kind, value));
  }
  private apply(work: () => JsonObject): void {
    if (this.disabled()) {
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
