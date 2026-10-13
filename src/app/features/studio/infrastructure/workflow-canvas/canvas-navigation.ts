import { computed, Directive, input, signal, viewChild } from '@angular/core';
import { FCanvasChangeEvent, FCanvasComponent } from '@foblex/flow';
import { CanvasNode } from '../../domain/workflow-authoring';
import { Point } from '../../domain/authoring';

/** View navigation stays usable independently of mutation guards. */
@Directive()
export abstract class CanvasNavigation {
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly viewport = input.required<Point & { zoom: number }>();
  readonly readOnly = input(false);
  protected readonly canvas = viewChild(FCanvasComponent);
  readonly zoomPercent = computed(() => Math.round(this.viewport().zoom * 100));
  readonly transform =
    input.required<(viewport: Point & { zoom: number }) => void>();
  readonly rendered = signal(false);
  nodesRendered(): void {
    this.rendered.set(true);
    if (this.readOnly()) {
      this.fit();
    }
  }
  zoom(delta: number): void {
    if (this.rendered()) {
      const canvas = this.canvas();
      canvas?.setScale(
        Math.min(4, Math.max(0.1, this.viewport().zoom + delta)),
      );
      canvas?.redraw();
      canvas?.emitCanvasChangeEvent();
    }
  }
  fit(): void {
    if (this.rendered() && this.nodes().length) {
      this.canvas()?.fitToScreen({ x: 40, y: 40 }, false, true, 1);
    }
  }
  reset(): void {
    if (this.rendered()) {
      if (!this.nodes().length) {
        this.transform()({ x: 0, y: 0, zoom: 1 });
        return;
      }
      this.canvas()?.resetScaleAndCenter(false, true);
    }
  }
  changed(event: FCanvasChangeEvent): void {
    if (this.rendered()) {
      this.transform()({
        ...event.position,
        zoom: Math.min(4, Math.max(0.1, event.scale)),
      });
    }
  }
}
