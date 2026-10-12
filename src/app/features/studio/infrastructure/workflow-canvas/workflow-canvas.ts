import { CanvasToolbar } from './canvas-toolbar';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  FCanvasChangeEvent,
  FCanvasComponent,
  FCreateConnectionEvent,
  FFlowModule,
  FReassignConnectionEvent,
  FZoomDirective,
} from '@foblex/flow';
import { CanvasEdge, CanvasNode } from '../../domain/workflow-authoring';
import { Point } from '../../domain/authoring';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Locale } from '../../../../core/localization/locale';
import {
  ContextAction,
  ContextMenuControl,
} from '../../../../shared/ui/context-menu-control/context-menu-control';
@Component({
  selector: 'app-workflow-canvas',
  imports: [
    CanvasToolbar,
    ContextMenuControl,
    FFlowModule,
    FZoomDirective,
    LocalizePipe,
  ],
  templateUrl: './workflow-canvas.html',
  styleUrl: './workflow-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowCanvas {
  private readonly locale = inject(Locale);
  private readonly menu = viewChild(ContextMenuControl);
  readonly menuNode = signal('');
  readonly linkSource = signal('');
  readonly duplicateNode = input<((key: string) => void) | null>(null);
  readonly menuItems = computed<ContextAction[]>(() => {
    const key = this.menuNode();
    const blocked = this.disabled() || this.readOnly();
    return key
      ? [
          {
            label: this.locale.text('Inspect step'),
            icon: 'pi pi-search',
            command: (): void => this.selectNode()(key),
          },
          {
            label: this.locale.text('Connect to another step'),
            icon: 'pi pi-link',
            disabled: blocked,
            command: (): void => this.beginLink(key),
          },
          {
            label: this.locale.text('Duplicate step'),
            icon: 'pi pi-copy',
            disabled: blocked || !this.duplicateNode(),
            command: (): void => {
              if (
                !this.disabled() &&
                !this.readOnly() &&
                this.nodes().some((node) => node.key === key)
              ) {
                this.duplicateNode()?.(key);
              }
            },
          },
        ]
      : [
          {
            label: this.locale.text('Fit to view'),
            icon: 'pi pi-expand',
            command: (): void => this.fit(),
          },
          {
            label: this.locale.text('Reset view'),
            icon: 'pi pi-refresh',
            command: (): void => this.reset(),
          },
        ];
  });
  constructor() {
    effect(() => {
      if (
        this.disabled() ||
        this.readOnly() ||
        !this.nodes().some((node) => node.key === this.linkSource())
      ) {
        this.linkSource.set('');
      }
      if (
        this.disabled() ||
        (this.menuNode() &&
          !this.nodes().some((node) => node.key === this.menuNode()))
      ) {
        this.menu()?.hide();
        this.menuNode.set('');
      }
    });
  }
  openMenu(event: MouseEvent, key = ''): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    this.menuNode.set(key);
    if (key) {
      this.selectNode()(key);
    }
    this.menu()?.show(event);
  }
  beginLink(key: string): void {
    if (
      !this.disabled() &&
      !this.readOnly() &&
      this.nodes().some((node) => node.key === key)
    ) {
      this.linkSource.set(key);
    }
  }
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
  readonly selectionKeys = input<readonly string[]>([]);
  readonly selectNodes = input<((keys: string[]) => void) | null>(null);
  readonly keyboardMove = input<((key: string, point: Point) => void) | null>(
    null,
  );
  readonly reconnect = input<
    ((id: string, source: string, target: string) => void) | null
  >(null);
  select(event: MouseEvent, key: string): void {
    const source = this.linkSource();
    if (source) {
      if (!this.disabled() && !this.readOnly() && source !== key) {
        this.connect()('control:' + source + ':out', 'control:' + key + ':in');
        this.linkSource.set('');
      }
      return;
    }
    if (event.shiftKey && this.selectNodes()) {
      const keys = this.selectionKeys();
      this.selectNodes()!(
        keys.includes(key)
          ? keys.filter((item) => item !== key)
          : [...keys, key],
      );
    } else {
      this.selectNode()(key);
    }
  }
  find(key: string): void {
    if (!this.rendered() || !this.nodes().some((node) => node.key === key)) {
      return;
    }
    this.selectNode()(key);
    this.canvas()?.centerGroupOrNode(key, false, true);
  }
  reassigned(event: FReassignConnectionEvent): void {
    if (
      !this.disabled() &&
      !this.readOnly() &&
      event.nextSourceId &&
      event.nextTargetId
    ) {
      this.reconnect()?.(
        event.connectionId,
        event.nextSourceId,
        event.nextTargetId,
      );
    }
  }
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
  readonly rendered = signal(false);
  nodesRendered(): void {
    this.rendered.set(true);
    if (this.readOnly()) {
      this.fit();
    }
  }
  zoom(delta: number): void {
    if (!this.disabled() && this.rendered()) {
      const canvas = this.canvas();
      canvas?.setScale(
        Math.min(4, Math.max(0.1, this.viewport().zoom + delta)),
      );
      canvas?.redraw();
      canvas?.emitCanvasChangeEvent();
    }
  }
  fit(): void {
    if (!this.disabled() && this.rendered() && this.nodes().length) {
      this.canvas()?.fitToScreen({ x: 40, y: 40 }, false, true, 1);
    }
  }
  reset(): void {
    if (!this.disabled() && this.rendered()) {
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
    if (!this.disabled() && this.rendered()) {
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
    (this.keyboardMove() ?? this.moveNode())(node.key, {
      x:
        node.position.x +
        (event.key === 'ArrowRight' ? 20 : event.key === 'ArrowLeft' ? -20 : 0),
      y:
        node.position.y +
        (event.key === 'ArrowDown' ? 20 : event.key === 'ArrowUp' ? -20 : 0),
    });
  }
}
