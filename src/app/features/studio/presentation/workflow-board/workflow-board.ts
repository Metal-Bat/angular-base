import { WorkflowStepActionDialog } from '../workflow-step-action-dialog/workflow-step-action-dialog';
import {
  appendRegisteredStep,
  nextStepKey,
} from '../../domain/workflow-step-actions';
import { WorkflowInterfaceEditor } from '../workflow-interface-editor/workflow-interface-editor';
import { WorkflowHistory } from '../workflow-history/workflow-history';
import { StudioChoice } from '../studio-choice/studio-choice';
import { WorkflowSelection } from '../workflow-selection/workflow-selection';
import { fieldLabel } from '../../../../shared/domain/field-label';
import { MenuButton } from '../../../../shared/ui/menu-button/menu-button';
import { LayoutDirection, NodeSizes } from '../../domain/arrange-canvas';
import { EditorViewport } from '../../../../shared/ui/editor-viewport';
import { TabsModule } from 'primeng/tabs';
import { CanvasConnections } from '../canvas-connections/canvas-connections';
import { PublicationReview } from '../publication-review/publication-review';
import { WorkflowEditorPane } from '../workflow-editor-pane/workflow-editor-pane';
import { WorkflowDiagnostics } from './workflow-diagnostics';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { ButtonDirective } from 'primeng/button';
import { readWorkspace } from '../../domain/workspace-document';
import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { parseDocument, Point, Workspace } from '../../domain/authoring';
import {
  canvasEdges,
  connectWorkspace,
  graphSteps,
} from '../../domain/workflow-authoring';

import { nodeModels } from '../../domain/node-models';
import { readablePalette } from '../../domain/workflow-labels';
import { WorkflowPalette } from '../workflow-palette/workflow-palette';
import { WorkflowInteractions } from './workflow-interactions';
@Component({
  host: { class: 'console-page' },
  hostDirectives: [EditorViewport],
  selector: 'app-workflow-board',
  imports: [
    WorkflowInterfaceEditor,
    WorkflowPalette,
    WorkflowSelection,
    WorkflowHistory,
    WorkflowStepActionDialog,
    StudioChoice,
    MenuButton,
    TabsModule,
    CanvasConnections,
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
  readonly isOtherInterfacePanel = (key: string): boolean =>
    key !== 'interface';
  applyInterface(graph: JsonObject): void {
    if (this.readonly() || this.pending().some((key) => key !== 'interface')) {
      return;
    }
    const pending = this.pending();
    this.pending.set([]);
    try {
      this.change({
        ...this.document(),
        graph: { ...this.document().graph, interface: graph['interface'] },
      });
    } catch {
      this.pending.set(pending);
      this.error.set('Invalid workflow interface');
    }
  }
  readonly fieldLabel = fieldLabel;
  choosePalette(key: string): void {
    if (!this.readonly() && !this.pending().length) {
      this.paletteSelection.set(this.paletteSelection() === key ? '' : key);
      if (this.paletteSelection()) {
        this.dockOpen.set(false);
        this.focusControl('.canvas-stage');
      }
    }
  }
  readonly paletteItems = computed(() =>
    readablePalette(this.catalogEntries(), this.paletteSearch()),
  );
  readonly catalogChoices = computed(() => readablePalette(this.catalog(), ''));
  readonly invalidNodes = computed(() =>
    this.issues().flatMap((issue) => (issue.node ? [issue.node] : [])),
  );
  addType(key: string, point?: Point): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const entry = this.catalogEntries().find((row) => row['key'] === key);
    if (!entry) {
      return;
    }
    const metadata = entry['metadata'] as JsonObject | undefined;
    const stepKey = nextStepKey(
      this.document().graph,
      String(metadata?.['code'] ?? 'step'),
    );
    this.typeKey = key;
    this.stepKey = stepKey;
    const before = this.nodes().length;
    this.add(point);
    if (this.nodes().length > before) {
      this.paletteSelection.set('');
      this.paletteDrag.set(null);
      this.dockOpen.set(false);
      if (!point) {
        this.focusRequest.update((request) => ({
          key: stepKey,
          sequence: (request?.sequence ?? 0) + 1,
        }));
      }
    }
  }
  override readonly nodes = computed(() =>
    nodeModels(this.document(), this.catalogEntries(), this.childCatalog()),
  );
  readonly inputs = computed(() => ({
    fitRequest: this.fitRequest(),
    focusRequest: this.focusRequest(),
    arrange: (direction: LayoutDirection, sizes: NodeSizes): void =>
      void this.arrange(direction, sizes),
    nodes: this.nodes(),
    invalidNodes: this.invalidNodes(),
    addNext: (key: string): void => this.beginNext(key),
    insertStep: (id: string): void => this.beginInsert(id),
    paletteKey: this.paletteSelection(),
    paletteDrag: this.paletteDrag(),
    cancelPlacement: (): void => this.cancelPlacement(),
    addStep: (key: string, point: Point): void => this.addType(key, point),
    edges: canvasEdges(this.document().graph, this.nodes()),
    viewport: this.document().viewport,
    disabled:
      this.readonly() || this.pending().length > 0 || !!this.stepAction(),
    readOnly: this.status() !== 'DRAFT',
    selected: this.selected(),
    selectionKeys: this.selectionKeys(),
    toggleNode: (key: string): void =>
      this.toggleSelection(key, !this.selectionKeys().includes(key)),
    selectNodes: (keys: string[]): void => this.selectMany(keys),
    groupAction: (action: string): void => {
      if (action === 'duplicate') {
        this.duplicate();
      } else if (action === 'remove') {
        void this.removeSelection();
      } else {
        this.align(action === 'left' ? 'x' : 'y');
      }
    },
    keyboardMove: (key: string, point: Point): void =>
      this.keyboardMove(key, point),
    inspectedEdge: this.inspectedConnection(),
    inspectEdge: (id: string): void => this.inspectConnection(id),
    deleteEdge: (id: string): void => {
      if (this.readonly() || this.pending().length) {
        return;
      }
      this.inspectConnection(id);
      if (this.connectionId === id) {
        this.removeConnection();
      }
    },
    reconnect: (id: string, source: string, target: string): void =>
      this.reconnect(id, source, target),
    routing: this.document().routing,
    collapsed: this.document().collapsed,
    routeEdge: (key: string, points: Point[]): void =>
      this.routeEdge(key, points),
    selectNode: (key: string, preserveGroup = false): void => {
      if (!preserveGroup || !this.selectionKeys().includes(key)) {
        this.select(key);
      }
    },
    moveNode: (key: string, point: Point): void => this.move(key, point),
    removeNode: (key: string): void => {
      void this.removeSelection([key]);
    },
    duplicateNode: (key: string): void => {
      if (this.readonly() || this.pending().length) {
        return;
      }
      this.selectMany([key]);
      this.duplicate();
    },
    connect: (source: string, target: string, outcome?: string): void =>
      this.connect(source, target, outcome),
    transform: (viewport: Point & { zoom: number }): void =>
      this.viewport(viewport),
  }));
  override select(key: string): void {
    this.inspectedConnection.set('');
    this.revealStep();
    if (key === this.selected()) {
      this.selectionKeys.set(key ? [key] : []);
      return;
    }
    if (this.pending().includes('node')) {
      this.error.set(
        'Apply or reload component edits before selecting another step',
      );
      return;
    }
    const node = graphSteps(this.document().graph).find(
      (step) => step['key'] === key,
    );
    if (node || !key) {
      this.selectionKeys.set(node ? [key] : []);
      this.selected.set(key);
      this.selectedJson = JSON.stringify(node ?? {}, null, 2);
    }
  }
  protected override change(next: Workspace): void {
    if (this.pending().length) {
      this.error.set('Apply or discard pending inspector edits before saving.');
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
      this.change(
        appendRegisteredStep(this.document(), entry!, this.stepKey, point),
      );
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
    void this.removeSelection([this.selected()]);
  }
  routeEdge(key: string, points: Point[]): void {
    if (
      this.readonly() ||
      this.pending().length ||
      !this.connections().some((edge) => edge.id === key)
    ) {
      return;
    }
    if (
      JSON.stringify(this.document().routing[key] ?? []) ===
      JSON.stringify(points)
    ) {
      return;
    }
    try {
      this.change({
        ...this.document(),
        routing: { ...this.document().routing, [key]: points },
      });
    } catch {
      this.error.set('Invalid layout settings');
    }
  }
  move(key: string, point: Point): void {
    this.keyboardMove(key, point);
  }
  connect(
    source = this.source,
    target = this.target,
    outcome = this.outcome,
  ): void {
    try {
      this.change(
        connectWorkspace(
          this.document(),
          source,
          target,
          outcome,
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
      this.document.set({ ...value, viewport: this.document().viewport });
      this.selectionKeys.set([]);
      this.inspectedConnection.set('');
      this.connectionId = '';
      this.syncSelection(value);
      this.selectionKeys.set(this.selected() ? [this.selected()] : []);
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
}
