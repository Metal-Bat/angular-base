import { LayoutDirection, NodeSizes } from '../../domain/arrange-canvas';
import { ElementRef } from '@angular/core';
import {
  afterNextRender,
  computed,
  Directive,
  effect,
  inject,
  Injector,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FCanvasChangeEvent, FCanvasComponent } from '@foblex/flow';
import {
  CanvasFocusRequest,
  CanvasNode,
} from '../../domain/workflow-authoring';
import { Point } from '../../domain/authoring';
import { fitAccessibleNodes, FitNode } from './canvas-fit';

/** View navigation stays usable independently of mutation guards. */
@Directive()
export abstract class CanvasNavigation {
  readonly arrange = input<
    ((direction: LayoutDirection, sizes: NodeSizes) => void) | null
  >(null);
  readonly fitRequest = input(0);
  readonly focusRequest = input<CanvasFocusRequest | null>(null);
  private readonly injector = inject(Injector);
  private fitting = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    effect(() => {
      const request = this.focusRequest();
      if (request && this.rendered()) {
        afterNextRender(
          () => {
            if (this.focusRequest() === request) {
              this.centerNode(request.key);
            }
          },
          { injector: this.injector },
        );
      }
    });
    effect(() => {
      const request = this.fitRequest();
      if (request) {
        afterNextRender(
          () => {
            if (this.fitRequest() === request) {
              this.fit();
            }
          },
          { injector: this.injector },
        );
      }
    });
  }
  arrangeNodes(direction: LayoutDirection): void {
    const sizes = Object.fromEntries(
      [
        ...this.host.nativeElement.querySelectorAll<HTMLElement>('.board-node'),
      ].map((node) => {
        const bounds = node.getBoundingClientRect();
        return [
          node.dataset['nodeKey']!,
          {
            width: bounds.width / this.viewport().zoom,
            height: bounds.height / this.viewport().zoom,
          },
        ];
      }),
    );
    this.arrange()?.(direction, sizes);
  }
  readonly selected = input('');
  protected centerNode(key: string): void {
    if (this.rendered() && this.nodes().some((node) => node.key === key)) {
      this.canvas()?.centerGroupOrNode(key, false, true);
    }
  }
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
      this.fitting = true;
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
  private completeFit(viewport: Point & { zoom: number }): void {
    if (
      ['x', 'y', 'zoom'].some(
        (key) =>
          this.viewport()[key as keyof typeof viewport] !==
          viewport[key as keyof typeof viewport],
      )
    ) {
      return;
    }
    const host = this.host.nativeElement;
    const stage = host.querySelector('.canvas-stage')?.getBoundingClientRect();
    if (!stage?.width || !stage.height) {
      return;
    }
    const elements = [...host.querySelectorAll<HTMLElement>('.board-node')];
    const clipped = elements.some((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.left < stage.left ||
        rect.top < stage.top ||
        rect.right > stage.right ||
        rect.bottom > stage.bottom
      );
    });
    if (!clipped) {
      return;
    }
    const nodes = new Map(this.nodes().map((node) => [node.key, node]));
    const measured: FitNode[] = elements.flatMap((element) => {
      const node = nodes.get(element.dataset['nodeKey']!);
      if (!node) {
        return [];
      }
      const rect = element.getBoundingClientRect();
      return [
        {
          ...node.position,
          width: rect.width / viewport.zoom,
          height: rect.height / viewport.zoom,
          rows: [
            ...element.querySelectorAll(
              '.node-handle, .control-port, .data-port',
            ),
          ].map((row) => ({
            height: row.getBoundingClientRect().height / viewport.zoom,
            minimum:
              row.querySelector('.port-socket')?.getBoundingClientRect()
                .height ?? 25,
          })),
        },
      ];
    });
    if (measured.length) {
      this.transform()(fitAccessibleNodes(measured, stage, viewport.zoom));
    }
  }
  changed(event: FCanvasChangeEvent): void {
    if (this.rendered()) {
      const viewport = {
        ...event.position,
        zoom: Math.min(4, Math.max(0.1, event.scale)),
      };
      this.transform()(viewport);
      if (this.fitting) {
        this.fitting = false;
        afterNextRender(() => this.completeFit(viewport), {
          injector: this.injector,
        });
      }
    }
  }
}
