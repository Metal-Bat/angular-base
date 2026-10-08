import { WorkflowStepInspector } from './workflow-step-inspector';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  Type,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { CANVAS_LOADER, STUDIO_API } from '../../bindings';
import { Point } from '../../domain/authoring';
import { canvasEdges, CanvasNode } from '../../domain/workflow-authoring';
import { WorkflowTopology } from '../../domain/workflow-topology';
import { readWorkflowTopology } from '../../domain/read-workflow-topology';
import { diagramPositions } from '../../domain/diagram-layout';

@Component({
  selector: 'app-workflow-diagram',
  imports: [
    WorkflowStepInspector,
    SelectControl,
    NgComponentOutlet,
    FormsModule,
    RouterLink,
    ButtonDirective,
    LocalizePipe,
  ],
  templateUrl: './workflow-diagram.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowDiagram {
  private readonly api = inject(STUDIO_API);
  readonly workflow = input('');
  readonly version = input('');
  readonly versions = signal<readonly JsonObject[]>([]);
  readonly current = signal<JsonObject | null>(null);
  readonly page = signal(1);
  readonly pages = signal(0);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly topology = signal<WorkflowTopology>({ steps: [], transitions: [] });
  readonly graph = signal<JsonObject>({ steps: [], transitions: [] });
  readonly positions = signal<Record<string, Point>>({});
  readonly viewport = signal({ x: 0, y: 0, zoom: 1 });
  readonly selected = signal('');
  readonly nodes = computed<CanvasNode[]>(() =>
    this.topology().steps.map((step) => ({
      key: step.key,
      title: step.typeCode,
      position: this.positions()[step.key] ?? { x: 40, y: 40 },
      ports: [],
    })),
  );
  readonly edges = computed(() => canvasEdges(this.graph(), this.nodes()));
  readonly selectedStep = computed(() =>
    this.topology().steps.find((step) => step.key === this.selected()),
  );
  readonly transitions = computed(() =>
    this.topology().transitions.filter(
      (edge) =>
        edge.source === this.selected() || edge.target === this.selected(),
    ),
  );
  readonly select = (key: string): void => this.selected.set(key);
  readonly transform = (view: Point & { zoom: number }): void =>
    this.viewport.set(view);
  readonly ignore = (): void => {
    /* Viewing never edits the graph. */
  };
  readonly canvas = signal<Type<unknown> | null>(null);
  readonly canvasInputs = computed(() => ({
    connect: this.ignore,
    edges: this.edges(),
    moveNode: this.ignore,
    nodes: this.nodes(),
    readOnly: true,
    routeEdge: this.ignore,
    selected: this.selected(),
    selectNode: this.select,
    transform: this.transform,
    viewport: this.viewport(),
  }));
  private generation = 0;
  constructor() {
    const destroyRef = inject(DestroyRef);
    void inject(CANVAS_LOADER)()
      .then((canvas) => {
        if (!destroyRef.destroyed) {
          this.canvas.set(canvas);
        }
      })
      .catch(() => {
        if (!destroyRef.destroyed) {
          this.error.set('The workflow diagram is unavailable.');
        }
      });
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    effect(() => {
      const version = this.version();
      const workflow = this.workflow();
      this.clear();
      if (version) {
        void this.show(version);
      } else if (workflow) {
        void this.loadVersions();
      }
    });
  }
  private clear(): void {
    this.generation++;
    this.versions.set([]);
    this.current.set(null);
    this.selected.set('');
    this.graph.set({ steps: [], transitions: [] });
    this.topology.set({ steps: [], transitions: [] });
    this.positions.set({});
    this.viewport.set({ x: 0, y: 0, zoom: 1 });
    this.error.set('');
    this.busy.set(false);
    this.page.set(1);
    this.pages.set(0);
  }
  async loadVersions(page = 1): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.search('workflow-versions', page, {
        workflow_ref_id: this.workflow(),
        size: 20,
        filters: [],
        sort_orders: [{ field_name: 'number', operation: 'desc' }],
      });
      if (generation !== this.generation) {
        return;
      }
      this.versions.set(result.items);
      this.page.set(result.page);
      this.pages.set(result.totalPages);
      if (result.items.length) {
        await this.show(String(result.items[0]['ref_id']));
      } else {
        this.current.set(null);
        this.graph.set({ steps: [], transitions: [] });
        this.topology.set({ steps: [], transitions: [] });
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('Workflow versions are unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async show(reference: string): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    this.current.set(null);
    this.selected.set('');
    this.graph.set({ steps: [], transitions: [] });
    this.topology.set({ steps: [], transitions: [] });
    try {
      const version = await this.api.get('workflow-versions', reference);
      if (generation !== this.generation) {
        return;
      }
      const current = String(version['ref_id']);
      const [raw, workspace] = await Promise.all([
        this.api.auxiliary('workflowGraph', undefined, { ref_id: current }),
        this.api.workspace(current).catch(() => null),
      ]);
      if (generation !== this.generation) {
        return;
      }
      const topology = readWorkflowTopology(raw);
      this.topology.set(topology);
      this.graph.set(raw as JsonObject);
      this.positions.set({
        ...diagramPositions(topology),
        ...(workspace?.document.positions ?? {}),
      });
      this.viewport.set({ x: 0, y: 0, zoom: 1 });
      this.current.set(version);
      this.versions.update((rows) =>
        rows.map((row) =>
          row['ref_id'] === reference ? { ...row, ...version } : row,
        ),
      );
    } catch {
      if (generation === this.generation) {
        this.error.set('The workflow diagram is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
