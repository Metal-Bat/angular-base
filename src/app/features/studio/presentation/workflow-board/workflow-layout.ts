import { Directive, Signal, signal } from '@angular/core';
import { Workspace } from '../../domain/authoring';
import {
  CanvasFocusRequest,
  CanvasNode,
} from '../../domain/workflow-authoring';
import {
  arrangeCanvas,
  LayoutDirection,
  NodeSizes,
} from '../../domain/arrange-canvas';
import { alignSteps } from '../../domain/canvas-editing';
import { WorkflowBoardState } from './workflow-board-state';

/** Visual commands preserve executable graph content and share semantic history. */
@Directive()
export abstract class WorkflowLayout extends WorkflowBoardState {
  abstract readonly nodes: Signal<CanvasNode[]>;
  abstract readonly selectionKeys: Signal<readonly string[]>;
  protected abstract change(next: Workspace): void;
  readonly fitRequest = signal(0);
  readonly focusRequest = signal<CanvasFocusRequest | null>(null);
  align(axis: 'x' | 'y'): void {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const next = alignSteps(
      this.document(),
      this.nodes(),
      this.selectionKeys(),
      axis,
    );
    if (
      JSON.stringify(next.positions) !==
      JSON.stringify(this.document().positions)
    ) {
      this.change(next);
    }
  }
  collapseStep(key: string, collapsed: boolean): void {
    if (
      this.readonly() ||
      this.pending().length ||
      !this.nodes().some((node) => node.key === key)
    ) {
      return;
    }
    const keys = this.document().collapsed.filter((item) => item !== key);
    this.change({
      ...this.document(),
      collapsed: collapsed ? [...keys, key] : keys,
    });
  }
  async arrange(direction: LayoutDirection, sizes: NodeSizes): Promise<void> {
    if (this.readonly() || this.pending().length) {
      return;
    }
    const document = this.document();
    const epoch = this.generation;
    if (
      Object.values(document.routing).some((points) => points.length > 0) &&
      !(await this.feedback.confirm(
        'Arrange steps and reset manual connection routes? Undo restores the previous layout.',
      ))
    ) {
      return;
    }
    if (
      epoch !== this.generation ||
      document !== this.document() ||
      this.readonly() ||
      this.pending().length
    ) {
      return;
    }
    const next = arrangeCanvas(document, this.nodes(), sizes, direction);
    if (
      JSON.stringify(next.positions) !== JSON.stringify(document.positions) ||
      JSON.stringify(next.routing) !== JSON.stringify(document.routing)
    ) {
      this.change(next);
    }
    this.fitRequest.update((value) => value + 1);
  }
}
