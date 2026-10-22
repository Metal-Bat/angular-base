import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  FDragStartedEvent,
  FEventTrigger,
  FFlowComponent,
  FMoveNodesEvent,
  FSelectionChangeEvent,
  isOnFlowBackground,
} from '@foblex/flow';
import { Point } from '../../domain/authoring';
import { CanvasNavigation } from './canvas-navigation';

/** Isolates mutable canvas gestures from canonical workspace/history state. */
@Directive()
export abstract class CanvasGestures extends CanvasNavigation {
  readonly disabled = input(false);
  readonly invalidNodes = input<readonly string[]>([]);
  readonly selectNode =
    input.required<(key: string, preserveGroup?: boolean) => void>();
  readonly toggleNode = input<((key: string) => void) | null>(null);
  readonly addStep = input<(key: string, point: Point) => void>(
    () => undefined,
  );
  readonly moveNode = input.required<(key: string, point: Point) => void>();
  readonly paletteKey = input('');
  readonly paletteDrag = input<{ key: string; token: string } | null>(null);
  readonly cancelPlacement = input<() => void>(() => undefined);
  readonly selectionKeys = input<readonly string[]>([]);
  readonly inspectedEdge = input('');
  readonly selectNodes = input<((keys: string[]) => void) | null>(null);
  readonly keyboardMove = input<((key: string, point: Point) => void) | null>(
    null,
  );
  readonly dropReady = signal(false);
  protected readonly flow = viewChild(FFlowComponent);
  readonly multiSelectTrigger: FEventTrigger = (event) => event.shiftKey;
  readonly selectionTrigger: FEventTrigger = (event) =>
    event.shiftKey &&
    event.target instanceof Element &&
    !event.target.closest('.board-node, f-connection') &&
    isOnFlowBackground(event);
  protected pointerSelectionHandled = false;
  private pointerButton: number | null = null;
  private completedCancelled = false;
  protected readonly gestureRevision = signal(0);
  readonly viewNodes = computed(() => {
    this.gestureRevision();
    return this.nodes().map((node) => ({
      ...node,
      position: { ...node.position },
    }));
  });
  private consumedDrop = '';
  private suppressClick = false;
  private completedSelection: { cancelled: boolean } | null = null;
  private gesture: { kind: string; cancelled: boolean } | null = null;
  constructor() {
    super();
    effect(() => {
      const keys = this.selectionKeys().length
        ? [...this.selectionKeys()]
        : this.selected()
          ? [this.selected()]
          : [];
      const edge = this.inspectedEdge();
      if (this.rendered()) {
        this.flow()?.select(edge ? [] : keys, edge ? [edge] : [], false);
      }
    });
    effect(() => {
      if (this.disabled() || this.readOnly()) {
        this.cancelGesture();
      }
    });
    const cancel = (): void => this.cancelGesture();
    const pointerDown = (event: PointerEvent): void => {
      this.suppressClick = false;
      this.pointerSelectionHandled = false;
      this.completedCancelled = false;
      this.pointerButton = this.flow()?.hostElement.contains(
        event.target as Node,
      )
        ? event.button
        : null;
    };
    const click = (event: MouseEvent): void => {
      if (event.detail > 0 && this.suppressClick) {
        this.suppressClick = false;
        if (this.flow()?.hostElement.contains(event.target as Node)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    };
    document.addEventListener('pointerdown', pointerDown, true);
    document.addEventListener('click', click, true);
    const escape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.cancelGesture();
        this.cancelPlacement()();
      }
    };
    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('keydown', escape);
    window.addEventListener('blur', cancel);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('pointerdown', pointerDown, true);
      document.removeEventListener('click', click, true);
      document.removeEventListener('pointercancel', cancel, true);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('blur', cancel);
    });
  }
  dragStarted(event: FDragStartedEvent): void {
    this.suppressClick = true;
    this.completedSelection = null;
    this.gesture = {
      kind: event.kind,
      cancelled: this.disabled() || this.readOnly(),
    };
  }
  cancelGesture(): void {
    if (this.gesture) {
      this.gesture.cancelled = true;
    }
    this.dropReady.set(false);
  }
  protected gestureCancelled(): boolean {
    return this.gesture?.cancelled ?? false;
  }
  dragEnded(): void {
    if (this.gesture?.cancelled) {
      this.flow()?.select(
        this.selectionKeys().length
          ? [...this.selectionKeys()]
          : this.selected()
            ? [this.selected()]
            : [],
        [],
        false,
      );
    }
    this.completedCancelled = !!this.gesture?.cancelled;
    this.completedSelection =
      this.gesture?.kind === 'selection-area'
        ? { cancelled: this.gesture.cancelled }
        : null;
    this.gesture = null;
    this.gestureRevision.update((value) => value + 1);
    this.flow()?.redraw();
  }
  moved(event: FMoveNodesEvent): void {
    if (this.disabled() || this.readOnly() || this.gesture?.cancelled) {
      return;
    }
    // The installed canvas emits once after all nodes finish. One anchor/delta
    // goes through the existing group command, producing one history entry.
    const anchor = event.nodes[0];
    if (anchor) {
      this.moveNode()(anchor.id, { ...anchor.position });
    }
  }
  selectionChanged(event: FSelectionChangeEvent): void {
    if (
      !this.completedCancelled &&
      (this.completedSelection || this.pointerButton === 0)
    ) {
      if (this.disabled() && !this.readOnly()) {
        if (event.nodeIds.length === 1) {
          this.selectNode()(event.nodeIds[0]);
        }
      } else {
        this.selectNodes()?.(event.nodeIds);
      }
      this.pointerSelectionHandled = true;
    }
    this.completedSelection = null;
  }
  dragOver(event: DragEvent): void {
    if (
      !this.disabled() &&
      !this.readOnly() &&
      this.paletteDrag() &&
      event.dataTransfer?.types.includes('application/x-studio-step')
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      this.dropReady.set(true);
    }
  }
  drop(event: DragEvent): void {
    this.dropReady.set(false);
    const drag = this.paletteDrag();
    const token = event.dataTransfer?.getData('application/x-studio-step');
    if (
      this.disabled() ||
      this.readOnly() ||
      !drag ||
      token !== drag.token ||
      token === this.consumedDrop
    ) {
      return;
    }
    event.preventDefault();
    this.consumedDrop = token;
    this.placeAt(
      event.currentTarget as HTMLElement,
      event.clientX,
      event.clientY,
      drag.key,
    );
  }
  place(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('.board-node, f-connection')) {
      return;
    }
    if (!this.paletteKey()) {
      this.selectNode()('');
      return;
    }
    if (!this.disabled() && !this.readOnly()) {
      this.placeAt(
        event.currentTarget as HTMLElement,
        event.clientX,
        event.clientY,
        this.paletteKey(),
      );
    }
  }
  placeWithKeyboard(event: Event): void {
    if (
      event.target !== event.currentTarget ||
      !this.paletteKey() ||
      this.disabled() ||
      this.readOnly()
    ) {
      return;
    }
    event.preventDefault();
    const stage = event.currentTarget as HTMLElement;
    const rect = stage.getBoundingClientRect();
    this.placeAt(
      stage,
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      this.paletteKey(),
    );
  }
  private placeAt(
    stage: HTMLElement,
    clientX: number,
    clientY: number,
    key: string,
  ): void {
    const rect = stage.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return;
    }
    const viewport = this.viewport();
    const point = {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    };
    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
      this.addStep()(key, point);
    }
  }
}
