import { workspaceGraphEdit } from '../../domain/workspace-graph-edit';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { canvasEdges, graphSteps } from '../../domain/workflow-authoring';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { ActorState } from '../../../../core/auth/actor-state';
import {
  duplicateSteps,
  moveSelection,
  reconnect,
  removeConnection,
  removeSteps,
} from '../../domain/canvas-editing';
import { Point } from '../../domain/authoring';
import { AuthorIssue } from '../../domain/authoring-diagnostics';
import { focusWorkflowIssue } from './workflow-issue-focus';
import { WorkflowStepActions } from './workflow-step-actions';
@Directive()
export abstract class WorkflowInteractions extends WorkflowStepActions {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  selectIssue(issue: AuthorIssue): void {
    if (!issue.node) {
      return;
    }
    this.select(issue.node);
    this.dockTab.set('properties');
    this.dockOpen.set(true);
    afterNextRender(
      () => {
        if (this.selected() === issue.node) {
          focusWorkflowIssue(this.host.nativeElement, issue.pointer);
        }
      },
      { injector: this.injector },
    );
  }
  readonly paletteDrag = signal<{ key: string; token: string } | null>(null);
  openPalette(): void {
    this.dockTab.set('steps');
    this.dockOpen.set(true);
    this.focusControl('#palette-search');
  }
  protected focusControl(selector: string): void {
    const generation = this.generation;
    afterNextRender(
      () => {
        if (generation === this.generation) {
          this.host.nativeElement
            .querySelector<HTMLElement>(selector)
            ?.focus({ preventScroll: true });
        }
      },
      { injector: this.injector },
    );
  }
  cancelPlacement(): void {
    this.paletteSelection.set('');
    this.paletteDrag.set(null);
  }
  dragType(event: DragEvent, key: string): void {
    if (
      this.readonly() ||
      this.pending().length ||
      !event.dataTransfer ||
      !this.catalogEntries().some((row) => row['key'] === key)
    ) {
      event.preventDefault();
      return;
    }
    const token = crypto.randomUUID();
    this.paletteDrag.set({ key, token });
    event.dataTransfer.setData('application/x-studio-step', token);
    event.dataTransfer.effectAllowed = 'copy';
  }
  protected revealStep(): void {
    afterNextRender(
      () => {
        this.host.nativeElement
          .querySelector('p-tabpanels')
          ?.scrollTo({ top: 0 });
      },
      { injector: this.injector },
    );
  }
  readonly canUndo = computed(() => {
    this.document();
    return this.history.canUndo;
  });
  readonly canRedo = computed(() => {
    this.document();
    return this.history.canRedo;
  });
  readonly dockTab = signal('steps');
  async removeSelection(
    keys = this.selectionKeys().length
      ? this.selectionKeys()
      : [this.selected()],
  ): Promise<void> {
    if (this.readonly() || this.pending().length || !keys[0]) {
      return;
    }
    const owner = this.document();
    const selected = this.selected();
    const group = this.selectionKeys();
    const epoch = this.generation;
    if (
      !(await this.feedback.confirm(
        'Remove the selected steps and their connections? Neighbouring steps will not be connected.',
      )) ||
      epoch !== this.generation ||
      this.document() !== owner ||
      this.selected() !== selected ||
      this.selectionKeys() !== group ||
      this.readonly() ||
      this.pending().length
    ) {
      return;
    }
    try {
      this.change(removeSteps(owner, keys, this.nodes()));
      this.selectMany([]);
    } catch {
      this.error.set('Selected step no longer exists');
    }
  }
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
      const next = workspaceGraphEdit(this.document(), graph);
      this.change(next.workspace);
      const identity = next.identities[this.inspectedConnection()];
      if (identity) {
        this.connectionId = identity;
        this.inspectedConnection.set(identity);
      }
    } catch {
      this.pending.set(pending);
      this.pendingStep.set(pendingStep);
      this.error.set('Invalid connection');
    }
  }

  constructor() {
    super();
    effect(() => {
      if (this.selected() || this.inspectedConnection()) {
        this.dockTab.set('properties');
      }
    });
    const release = inject(ActorState).register(() => {
      this.cancelPlacement();
      this.selectionKeys.set([]);
      this.connectionId = '';
      this.inspectedConnection.set('');
    });
    inject(DestroyRef).onDestroy(release);
  }
  protected override clear(): void {
    super.clear();
    this.focusRequest.set(null);
    this.cancelPlacement();
    this.selectionKeys.set([]);
    this.connectionId = '';
    this.inspectedConnection.set('');
  }
  override async load(): Promise<void> {
    await super.load();
    if (!this.dirty()) {
      this.cancelPlacement();
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
    const edge = this.connections().find((item) => item.id === id);
    if (!edge) {
      return;
    }
    if (this.pending().length) {
      this.error.set('Apply or discard pending inspector edits before saving.');
      return;
    }
    this.select(edge.source.split(':')[1]);
    this.connectionId = id;
    this.inspectedConnection.set(id);
    this.dockOpen.set(true);
    const epoch = this.generation;
    afterNextRender(
      () => {
        if (epoch !== this.generation || this.inspectedConnection() !== id) {
          return;
        }
        const host = this.host.nativeElement;
        const control = host.querySelector<HTMLElement>(
          edge.kind === 'control' ? '#transition-selection' : '#keyboard-edge',
        );
        control?.focus({ preventScroll: true });
        control?.scrollIntoView({ block: 'nearest' });
      },
      { injector: this.injector },
    );
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
      const current = this.document();
      this.change(removeConnection(current, this.connectionId, this.nodes()));
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
      const previous = this.connections().find((edge) => edge.id === id);
      this.change(reconnect(this.document(), id, source, target, this.nodes()));
      const next = this.connections().find(
        (edge) =>
          edge.kind === previous?.kind &&
          edge.source === source &&
          edge.target === target &&
          edge.label === previous?.label,
      );
      if (next) {
        this.inspectConnection(next.id);
      }
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
    if (!old || (old.x === point.x && old.y === point.y)) {
      return;
    }
    try {
      this.change(
        moveSelection(
          {
            ...this.document(),
            positions: {
              ...Object.fromEntries(
                this.nodes().map((node) => [node.key, node.position]),
              ),
              ...this.document().positions,
            },
          },
          this.selectionKeys().includes(key) ? this.selectionKeys() : [key],
          { x: point.x - old.x, y: point.y - old.y },
        ),
      );
    } catch {
      this.error.set('Invalid workspace position');
    }
  }
}
