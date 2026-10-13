import { CanvasNavigation } from './canvas-navigation';
import { FormsModule } from '@angular/forms';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
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
    FormsModule,
    SelectControl,
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
export class WorkflowCanvas extends CanvasNavigation {
  private readonly locale = inject(Locale);
  private readonly menu = viewChild(ContextMenuControl);
  readonly menuNode = signal('');
  readonly menuEdge = signal('');
  readonly inspectEdge = input<((id: string) => void) | null>(null);
  readonly deleteEdge = input<((id: string) => void) | null>(null);
  readonly linkSource = signal('');
  readonly pendingConnection = signal<{
    source: string;
    target: string;
  } | null>(null);
  readonly connectionOutcome = signal('');
  readonly connectionOutcomes = computed(
    () =>
      this.nodes().find(
        (node) => node.key === this.pendingConnection()?.source.split(':')[1],
      )?.outcomes ?? [],
  );
  requestConnection(source: string, target: string): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    if (source.startsWith('data:')) {
      this.connect()(source, target);
      return;
    }
    this.connectionOutcome.set('');
    this.pendingConnection.set({ source, target });
  }
  confirmConnection(): void {
    const connection = this.pendingConnection();
    const outcome = this.connectionOutcome().trim();
    if (
      !connection ||
      this.disabled() ||
      this.readOnly() ||
      !outcome ||
      (this.connectionOutcomes().length &&
        !this.connectionOutcomes().includes(outcome))
    ) {
      return;
    }
    this.connect()(connection.source, connection.target, outcome);
    this.pendingConnection.set(null);
  }
  readonly duplicateNode = input<((key: string) => void) | null>(null);
  readonly menuItems = computed<ContextAction[]>(() => {
    const key = this.menuNode();
    const edge = this.menuEdge();
    const blocked = this.disabled() || this.readOnly();
    if (edge) {
      return [
        {
          label: this.locale.text('Inspect connection'),
          icon: 'pi pi-search',
          command: (): void => this.inspectEdge()?.(edge),
        },
        {
          label: this.locale.text('Remove connection'),
          icon: 'pi pi-trash',
          disabled: blocked || !this.deleteEdge(),
          command: (): void => {
            if (
              !this.disabled() &&
              !this.readOnly() &&
              this.edges().some((item) => item.id === edge)
            ) {
              this.deleteEdge()?.(edge);
            }
          },
        },
      ];
    }
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
    super();
    effect(() => {
      if (
        this.disabled() ||
        this.readOnly() ||
        (this.linkSource() &&
          !this.nodes().some((node) => node.key === this.linkSource()))
      ) {
        this.linkSource.set('');
        this.pendingConnection.set(null);
      }
      const connection = this.pendingConnection();
      if (
        connection &&
        [connection.source, connection.target].some(
          (port) =>
            !this.nodes().some((node) => node.key === port.split(':')[1]),
        )
      ) {
        this.pendingConnection.set(null);
      }
      if (
        this.menuEdge() &&
        !this.edges().some((edge) => edge.id === this.menuEdge())
      ) {
        this.menu()?.hide();
        this.menuEdge.set('');
      }
      if (
        this.menuNode() &&
        !this.nodes().some((node) => node.key === this.menuNode())
      ) {
        this.menu()?.hide();
        this.menuNode.set('');
      }
    });
  }
  openMenu(event: MouseEvent, key = ''): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuEdge.set('');
    this.menuNode.set(key);
    if (key) {
      this.selectNode()(key);
    }
    this.menu()?.show(event);
  }
  openEdgeMenu(event: MouseEvent, id: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuNode.set('');
    this.menuEdge.set(id);
    this.inspectEdge()?.(id);
    this.menu()?.show(event);
  }
  selectEdge(event: Event, id: string): void {
    event.stopPropagation();
    this.inspectEdge()?.(id);
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
  readonly edges = input.required<readonly CanvasEdge[]>();
  readonly disabled = input(false);
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
      !(event.target as HTMLElement).closest('.board-node, f-connection') &&
      !this.paletteKey()
    ) {
      this.selectNode()('');
    }
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
        this.requestConnection(
          'control:' + source + ':out',
          'control:' + key + ':in',
        );
        this.linkSource.set('');
      }
      return;
    }
    if (event.shiftKey && this.selectNodes()) {
      const keys = this.selectionKeys().length
        ? this.selectionKeys()
        : this.selected()
          ? [this.selected()]
          : [];
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
  readonly collapsed = input<readonly string[]>([]);
  readonly routing = input<Record<string, Point[]>>({});
  readonly routeEdge = input.required<(key: string, points: Point[]) => void>();
  readonly selectNode = input.required<(key: string) => void>();
  readonly moveNode = input.required<(key: string, point: Point) => void>();
  readonly connect =
    input.required<
      (source: string, target: string, outcome?: string) => void
    >();
  created(event: FCreateConnectionEvent): void {
    if (!this.disabled() && !this.readOnly() && event.targetId) {
      this.requestConnection(event.sourceId, event.targetId);
    }
  }
  keyMove(event: KeyboardEvent, node: CanvasNode): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      this.select(event as unknown as MouseEvent, node.key);
      return;
    }
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
