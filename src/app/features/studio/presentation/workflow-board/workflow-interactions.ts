import { JsonObject } from '../../../forms/domain/runtime-document';
import { graphSteps } from '../../domain/workflow-authoring';
import {
  computed,
  DestroyRef,
  Directive,
  inject,
  signal,
  Signal,
} from '@angular/core';
import { ActorState } from '../../../../core/auth/actor-state';
import {
  duplicateSteps,
  moveSelection,
  reconnect,
  removeConnection,
} from '../../domain/canvas-editing';
import { canvasEdges, CanvasNode } from '../../domain/workflow-authoring';
import { Point, Workspace } from '../../domain/authoring';
import { WorkflowBoardState } from './workflow-board-state';
@Directive()
export abstract class WorkflowInteractions extends WorkflowBoardState {
  markPending(key: string): void {
    if (['typed', 'connections'].includes(key)) {
      this.pendingStep.set(this.selected());
    }
    this.pending.update((keys) => [...new Set([...keys, key])]);
  }
  discardPending(panel: string): void {
    if (!this.readonly()) {
      this.pending.update((keys) => keys.filter((key) => key !== panel));
      if (
        !this.pending().some((key) => ['typed', 'connections'].includes(key))
      ) {
        this.pendingStep.set('');
      }
      this.error.set('');
    }
  }
  applyTyped(replacement: JsonObject): void {
    if (
      this.readonly() ||
      this.pending().some((key) => key !== 'typed') ||
      replacement['key'] !== this.selected()
    ) {
      return;
    }
    const pending = this.pending();
    const pendingStep = this.pendingStep();
    this.pending.set([]);
    this.pendingStep.set('');
    try {
      this.change({
        ...this.document(),
        graph: {
          ...this.document().graph,
          steps: graphSteps(this.document().graph).map((step) =>
            step['key'] === this.selected() ? replacement : step,
          ),
        },
      });
    } catch {
      this.pending.set(pending);
      this.pendingStep.set(pendingStep);
      this.error.set('Invalid step configuration');
    }
  }
  applyConnections(graph: JsonObject): void {
    if (
      this.readonly() ||
      this.pending().some((key) => key !== 'connections')
    ) {
      return;
    }
    const pending = this.pending();
    const pendingStep = this.pendingStep();
    this.pending.set([]);
    this.pendingStep.set('');
    try {
      this.change({ ...this.document(), graph });
    } catch {
      this.pending.set(pending);
      this.pendingStep.set(pendingStep);
      this.error.set('Invalid connection');
    }
  }

  abstract readonly nodes: Signal<CanvasNode[]>;
  abstract select(key: string): void;
  protected abstract change(next: Workspace): void;
  constructor() {
    super();
    const release = inject(ActorState).register(() => {
      this.selectionKeys.set([]);
      this.connectionId = '';
      this.inspectedConnection.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  protected override clear(): void {
    super.clear();
    this.selectionKeys.set([]);
    this.connectionId = '';
    this.inspectedConnection.set('');
  }
  override async load(): Promise<void> {
    await super.load();
    if (!this.dirty()) {
      this.selectionKeys.set([]);
      this.connectionId = '';
      this.inspectedConnection.set('');
    }
  }
  readonly inspectedSteps = computed(() =>
    graphSteps(this.document().graph).filter(
      (step) => step['key'] === (this.pendingStep() || this.selected()),
    ),
  );
  viewport(viewport: Point & { zoom: number }): void {
    if (JSON.stringify(viewport) === JSON.stringify(this.document().viewport)) {
      return;
    }
    if (
      !Number.isFinite(viewport.x) ||
      !Number.isFinite(viewport.y) ||
      !Number.isFinite(viewport.zoom) ||
      viewport.zoom < 0.1 ||
      viewport.zoom > 4
    ) {
      return;
    }
    // View navigation is independent of definition edits and semantic history.
    this.document.update((document) => ({ ...document, viewport }));
  }
  readonly selectionKeys = signal<readonly string[]>([]);
  readonly connections = computed(() =>
    canvasEdges(this.document().graph, this.nodes()),
  );
  readonly inspectedConnection = signal('');
  connectionId = '';
  inspectConnection(id: string): void {
    if (this.connections().some((edge) => edge.id === id)) {
      this.connectionId = id;
      this.inspectedConnection.set(id);
    }
  }
  selectMany(keys: readonly string[]): void {
    if (this.pending().length) {
      return;
    }
    const existing = new Set(this.nodes().map((node) => node.key));
    const selection = [...new Set(keys)].filter((key) => existing.has(key));
    const first = selection[0] ?? '';
    this.select(first);
    if (this.selected() === first) {
      this.selectionKeys.set(selection);
    }
  }

  toggleSelection(key: string, checked: boolean): void {
    this.selectMany(
      checked
        ? [...this.selectionKeys(), key]
        : this.selectionKeys().filter((item) => item !== key),
    );
  }
  duplicate(): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    try {
      const next = duplicateSteps(
        this.document(),
        this.selectionKeys().length ? this.selectionKeys() : [this.selected()],
      );
      this.change(next.workspace);
      this.selectMany(next.keys);
      this.diagnostics.set(
        'Duplicated steps require validation of external dependencies.',
      );
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid selection',
      );
    }
  }
  removeConnection(): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    try {
      this.change(removeConnection(this.document(), this.connectionId));
      this.connectionId = '';
      this.inspectedConnection.set('');
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid connection',
      );
    }
  }
  reconnect(id: string, source: string, target: string): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    try {
      this.change(reconnect(this.document(), id, source, target, this.nodes()));
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Invalid connection',
      );
    }
  }
  keyboardMove(key: string, point: Point): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const old = this.nodes().find((node) => node.key === key)?.position;
    if (!old) {
      return;
    }
    try {
      this.change(
        moveSelection(
          this.document(),
          this.selectionKeys().includes(key) ? this.selectionKeys() : [key],
          { x: point.x - old.x, y: point.y - old.y },
        ),
      );
    } catch {
      this.error.set('Invalid workspace position');
    }
  }
}
