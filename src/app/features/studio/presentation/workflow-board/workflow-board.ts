import { PublicationReview } from '../publication-review/publication-review';
import { WorkflowEditorPane } from '../workflow-editor-pane/workflow-editor-pane';
import { WorkflowDiagnostics } from './workflow-diagnostics';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import { readWorkspace } from '../../domain/workspace-document';
import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { parseDocument, Point, Workspace } from '../../domain/authoring';
import {
  canvasEdges,
  connectWorkspace,
  graphSteps,
} from '../../domain/workflow-authoring';

import { nodeModels } from '../../domain/node-models';
import { WorkflowInteractions } from './workflow-interactions';
@Component({
  host: { class: 'console-page' },
  selector: 'app-workflow-board',
  imports: [
    PublicationReview,
    WorkflowDiagnostics,
    WorkflowEditorPane,
    SelectControl,
    ButtonDirective,
    FormsModule,
    RouterLink,
    NgComponentOutlet,
    LocalizePipe,
  ],
  templateUrl: './workflow-board.html',
  styleUrl: './workflow-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowBoard extends WorkflowInteractions {
  protected override clear(): void {
    super.clear();
    this.paletteSearch.set('');
    this.paletteSelection.set('');
  }
  readonly paletteSearch = signal('');
  readonly paletteSelection = signal('');
  choosePalette(key: string): void {
    if (!this.readonly() && !this.pending().length) {
      this.paletteSelection.set(this.paletteSelection() === key ? '' : key);
    }
  }
  readonly paletteItems = computed(() =>
    this.catalogEntries().filter((row) =>
      (String(row['title']) + ' ' + String(row['key']))
        .toLowerCase()
        .includes(this.paletteSearch().toLowerCase()),
    ),
  );
  readonly invalidNodes = computed(() =>
    this.issues().flatMap((issue) => (issue.node ? [issue.node] : [])),
  );
  dragType(event: DragEvent, key: string): void {
    if (this.readonly() || this.pending().length) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('application/x-studio-step', key);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  }
  addType(key: string, point?: Point): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const entry = this.catalogEntries().find((row) => row['key'] === key);
    if (!entry) {
      return;
    }
    const base = String(
      (entry['metadata'] as JsonObject | undefined)?.['code'] ?? 'step',
    )
      .replace(/[^A-Za-z0-9_.-]/g, '_')
      .slice(0, 48);
    let index = 1;
    let stepKey = 'step_' + base + '_' + index;
    while (this.nodes().some((node) => node.key === stepKey)) {
      stepKey = 'step_' + base + '_' + ++index;
    }
    this.typeKey = key;
    this.stepKey = stepKey;
    const before = this.nodes().length;
    this.add(point);
    if (this.nodes().length > before) {
      this.paletteSelection.set('');
    }
  }
  override readonly nodes = computed(() =>
    nodeModels(this.document(), this.catalogEntries()),
  );
  readonly inputs = computed(() => ({
    nodes: this.nodes(),
    invalidNodes: this.invalidNodes(),
    paletteKey: this.paletteSelection(),
    addStep: (key: string, point: Point): void => this.addType(key, point),
    edges: canvasEdges(this.document().graph, this.nodes()),
    viewport: this.document().viewport,
    disabled: this.readonly() || this.pending().length > 0,
    selected: this.selected(),
    selectionKeys: this.selectionKeys(),
    selectNodes: (keys: string[]): void => this.selectMany(keys),
    keyboardMove: (key: string, point: Point): void =>
      this.keyboardMove(key, point),
    reconnect: (id: string, source: string, target: string): void =>
      this.reconnect(id, source, target),
    routing: this.document().routing,
    collapsed: this.document().collapsed,
    routeEdge: (key: string, points: Point[]): void =>
      this.routeEdge(key, points),
    selectNode: (key: string): void => this.select(key),
    moveNode: (key: string, point: Point): void => this.move(key, point),
    connect: (source: string, target: string): void =>
      this.connect(source, target),
    transform: (viewport: Point & { zoom: number }): void =>
      this.viewport(viewport),
  }));
  markPending(key: string): void {
    this.pending.update((keys) => [...new Set([...keys, key])]);
    this.dirty.set(true);
  }
  override select(key: string): void {
    if (this.pending().some((panel) => panel === 'node' || panel === 'typed')) {
      this.error.set(
        'Apply or reload component edits before selecting another step',
      );
      return;
    }
    const node = graphSteps(this.document().graph).find(
      (step) => step['key'] === key,
    );
    if (node) {
      this.selected.set(key);
      this.selectedJson = JSON.stringify(node, null, 2);
    }
  }
  protected override change(next: Workspace): void {
    if (this.pending().length) {
      this.error.set('Apply or reload pending JSON edits first');
      return;
    }
    if (this.readonly()) {
      return;
    }
    graphSteps(next.graph);
    const validated = readWorkspace(next);
    this.history.record(this.document());
    this.document.set(validated);
    const keys = new Set(
      graphSteps(next.graph).map((step) => String(step['key'])),
    );
    this.selectionKeys.update((items) => items.filter((key) => keys.has(key)));
    this.syncSelection(next);
    this.graphJson = JSON.stringify(next.graph, null, 2);
    this.dirty.set(true);
    this.error.set('');
  }
  private syncSelection(workspace: Workspace): void {
    const node = graphSteps(workspace.graph).find(
      (step) => step['key'] === this.selected(),
    );
    if (!node) {
      this.selected.set('');
    }
    this.selectedJson = JSON.stringify(node ?? {}, null, 2);
  }
  add(point?: Point): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    try {
      const entry = this.catalogEntries().find(
        (row) => row['key'] === this.typeKey,
      );
      const metadata = entry?.['metadata'] as JsonObject | undefined;
      if (!metadata || entry?.['category'] !== 'step_type') {
        throw Error('Select a registered step type');
      }
      const next = structuredClone(this.document());
      const graph = next.graph as Record<string, JsonValue>;
      graph['steps'] = [
        ...graphSteps(graph),
        {
          key: this.stepKey,
          type_code: String(metadata['code']),
          type_version_ref: String(metadata['ref_id']),
          config: {},
        },
      ];
      const index = this.nodes().length;
      next.positions[this.stepKey] = point ?? {
        x: 40 + (index % 4) * 280,
        y: 40 + Math.floor(index / 4) * 240,
      };
      this.change(next);
      this.select(this.stepKey);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid step');
    }
  }
  readonly selectedStep = computed(() =>
    graphSteps(this.document().graph).find(
      (step) => step['key'] === this.selected(),
    ),
  );
  applyNode(): void {
    if (this.pending().some((key) => key !== 'node')) {
      this.error.set('Apply other edited panels first');
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      const replacement = parseDocument(this.selectedJson);
      if (replacement['key'] !== this.selected()) {
        throw Error('Stable step keys cannot be renamed; create a new step');
      }
      this.change({
        ...this.document(),
        graph: {
          ...this.document().graph,
          steps: graphSteps(this.document().graph).map((step) =>
            step['key'] === this.selected() ? replacement : step,
          ),
        },
      });
      this.pending.set(pending.filter((key) => key !== 'node'));
    } catch {
      this.pending.set(pending);
      this.error.set('Invalid step configuration');
    }
  }
  remove(): void {
    if (!this.selected()) {
      return;
    }
    const key = this.selected();
    const next = structuredClone(this.document());
    next.graph = {
      ...next.graph,
      steps: graphSteps(next.graph).filter((step) => step['key'] !== key),
      transitions: ((next.graph['transitions'] as JsonObject[]) ?? []).filter(
        (edge) => edge['source'] !== key && edge['target'] !== key,
      ),
      bindings: ((next.graph['bindings'] as JsonObject[]) ?? []).filter(
        (edge) => edge['step'] !== key && edge['source_step'] !== key,
      ),
      targets: ((next.graph['targets'] as JsonObject[]) ?? []).filter(
        (target) => target['step'] !== key,
      ),
    };
    delete next.positions[key];
    this.change(next);
    this.selected.set('');
  }
  routeEdge(key: string, points: Point[]): void {
    if (
      JSON.stringify(this.document().routing[key] ?? []) !==
      JSON.stringify(points)
    ) {
      this.change({
        ...this.document(),
        routing: { ...this.document().routing, [key]: points },
      });
    }
  }
  move(key: string, point: Point): void {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return;
    }
    const old = this.document().positions[key];
    if (old?.x === point.x && old.y === point.y) {
      return;
    }
    this.change({
      ...this.document(),
      positions: { ...this.document().positions, [key]: point },
    });
  }
  viewport(viewport: Point & { zoom: number }): void {
    if (JSON.stringify(viewport) === JSON.stringify(this.document().viewport)) {
      return;
    }
    this.change({ ...this.document(), viewport });
  }
  connect(source = this.source, target = this.target): void {
    try {
      this.change(
        connectWorkspace(
          this.document(),
          source,
          target,
          this.outcome,
          this.nodes(),
        ),
      );
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid connection',
      );
    }
  }
  undo(redo = false): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const value = redo
      ? this.history.redo(this.document())
      : this.history.undo(this.document());
    if (value) {
      this.document.set(value);
      this.selectionKeys.set([]);
      this.syncSelection(value);
      this.graphJson = JSON.stringify(value.graph, null, 2);
      this.dirty.set(true);
    }
  }
  applyGraph(): void {
    if (this.pending().some((key) => key !== 'graph')) {
      this.error.set('Apply other edited panels first');
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      const graph = parseDocument(this.graphJson);
      this.change({ ...this.document(), graph });
      this.pending.set(pending.filter((key) => key !== 'graph'));
    } catch {
      this.pending.set(pending);
      this.error.set(
        'Invalid graph document. Keep incomplete typed configurations in the workspace; step keys must be valid.',
      );
    }
  }
  applyLayout(): void {
    if (this.pending().some((key) => key !== 'layout')) {
      this.error.set('Apply other edited panels first');
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      const value = parseDocument(
        '{"collapsed":' +
          this.collapsedJson +
          ',"routing":' +
          this.routingJson +
          '}',
      );
      this.change(
        readWorkspace({
          ...this.document(),
          collapsed: value['collapsed'] as string[],
          routing: value['routing'] as unknown as Record<string, Point[]>,
        }),
      );
      this.pending.set(pending.filter((key) => key !== 'layout'));
    } catch {
      this.pending.set(pending);
      this.error.set('Invalid layout settings');
    }
  }
}
