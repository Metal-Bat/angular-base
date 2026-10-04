import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  FCanvasChangeEvent,
  FCreateConnectionEvent,
  FFlowModule,
  FZoomDirective,
} from '@foblex/flow';
import { CanvasEdge, CanvasNode } from '../../domain/workflow-authoring';
import { Point } from '../../domain/authoring';
@Component({
  selector: 'app-workflow-canvas',
  imports: [FFlowModule, FZoomDirective],
  templateUrl: './workflow-canvas.html',
  styleUrl: './workflow-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowCanvas {
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly edges = input.required<readonly CanvasEdge[]>();
  readonly viewport = input.required<Point & { zoom: number }>();
  readonly disabled = input(false);
  readonly collapsed = input<readonly string[]>([]);
  readonly routing = input<Record<string, Point[]>>({});
  readonly routeEdge = input.required<(key: string, points: Point[]) => void>();
  readonly selectNode = input.required<(key: string) => void>();
  readonly moveNode = input.required<(key: string, point: Point) => void>();
  readonly connect = input.required<(source: string, target: string) => void>();
  readonly transform =
    input.required<(viewport: Point & { zoom: number }) => void>();
  created(event: FCreateConnectionEvent): void {
    if (!this.disabled() && event.targetId) {
      this.connect()(event.sourceId, event.targetId);
    }
  }
  changed(event: FCanvasChangeEvent): void {
    if (!this.disabled()) {
      this.transform()({
        ...event.position,
        zoom: Math.min(4, Math.max(0.1, event.scale)),
      });
    }
  }
  keyMove(event: KeyboardEvent, node: CanvasNode): void {
    if (
      this.disabled() ||
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    this.moveNode()(node.key, {
      x:
        node.position.x +
        (event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0),
      y:
        node.position.y +
        (event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0),
    });
  }
}
