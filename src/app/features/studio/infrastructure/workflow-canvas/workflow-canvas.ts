import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import {
  FCanvasChangeEvent,
  FCanvasComponent,
  FCreateConnectionEvent,
  FFlowModule,
  FZoomDirective,
} from '@foblex/flow';
import { CanvasEdge, CanvasNode } from '../../domain/workflow-authoring';
import { Point } from '../../domain/authoring';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  selector: 'app-workflow-canvas',
  imports: [FFlowModule, FZoomDirective, LocalizePipe],
  templateUrl: './workflow-canvas.html',
  styleUrl: './workflow-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowCanvas {
  readonly nodes = input.required<readonly CanvasNode[]>();
  readonly edges = input.required<readonly CanvasEdge[]>();
  readonly viewport = input.required<Point & { zoom: number }>();
  readonly disabled = input(false);
  readonly readOnly = input(false);
  readonly addStep = input<(key: string, point: Point) => void>(
    () => undefined,
  );
  readonly invalidNodes = input<readonly string[]>([]);
  dragOver(event: DragEvent): void {
    if (
      !this.disabled() &&
      !this.readOnly() &&
      event.dataTransfer?.types.includes('application/x-studio-step')
    ) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }
  drop(event: DragEvent): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const key = event.dataTransfer?.getData('application/x-studio-step');
    if (!key) {
      return;
    }
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const viewport = this.viewport();
    this.addStep()(key, {
      x: (event.clientX - rect.left - viewport.x) / viewport.zoom,
      y: (event.clientY - rect.top - viewport.y) / viewport.zoom,
    });
  }
  readonly paletteKey = input('');
  place(event: MouseEvent): void {
    if (
      !this.paletteKey() ||
      this.disabled() ||
      this.readOnly() ||
      (event.target as HTMLElement).closest('.board-node, f-connection')
    ) {
      return;
    }
    this.placeAt(
      event.currentTarget as HTMLElement,
      event.clientX,
      event.clientY,
    );
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
    this.placeAt(stage, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  private placeAt(stage: HTMLElement, clientX: number, clientY: number): void {
    const rect = stage.getBoundingClientRect();
    const viewport = this.viewport();
    this.addStep()(this.paletteKey(), {
      x: (clientX - rect.left - viewport.x) / viewport.zoom,
      y: (clientY - rect.top - viewport.y) / viewport.zoom,
    });
  }
  readonly selected = input('');
  private readonly canvas = viewChild(FCanvasComponent);
  readonly zoomPercent = computed(() => Math.round(this.viewport().zoom * 100));
  readonly collapsed = input<readonly string[]>([]);
  readonly routing = input<Record<string, Point[]>>({});
  readonly routeEdge = input.required<(key: string, points: Point[]) => void>();
  readonly selectNode = input.required<(key: string) => void>();
  readonly moveNode = input.required<(key: string, point: Point) => void>();
  readonly connect = input.required<(source: string, target: string) => void>();
  readonly transform =
    input.required<(viewport: Point & { zoom: number }) => void>();
  constructor() {
    const injector = inject(Injector);
    effect(() => {
      const nodes = this.nodes();
      if (this.readOnly() && nodes.length) {
        afterNextRender(() => this.fit(), { injector });
      }
    });
  }
  zoom(delta: number): void {
    if (!this.disabled()) {
      const canvas = this.canvas();
      canvas?.setScale(
        Math.min(4, Math.max(0.1, this.viewport().zoom + delta)),
      );
      canvas?.redraw();
      canvas?.emitCanvasChangeEvent();
    }
  }
  fit(): void {
    if (!this.disabled() && this.nodes().length) {
      this.canvas()?.fitToScreen({ x: 40, y: 40 }, false, true, 1);
    }
  }
  reset(): void {
    if (!this.disabled()) {
      if (!this.nodes().length) {
        this.transform()({ x: 0, y: 0, zoom: 1 });
        return;
      }
      this.canvas()?.resetScaleAndCenter(false, true);
    }
  }
  created(event: FCreateConnectionEvent): void {
    if (!this.disabled() && !this.readOnly() && event.targetId) {
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
      this.readOnly() ||
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
