import { automaticConnectionRoutes } from './canvas-routing';
import { canvasContextActions } from './canvas-context-actions';
import { CanvasGuidance } from './canvas-guidance/canvas-guidance';
import { CanvasGestures } from './canvas-gestures';
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
import { ContextMenuControl } from '../../../../shared/ui/context-menu-control/context-menu-control';
@Component({
  selector: 'app-workflow-canvas',
  imports: [
    CanvasGuidance,
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
export class WorkflowCanvas extends CanvasGestures {
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
  readonly connectionCaption = computed(() => {
    const connection = this.pendingConnection();
    const title = (port: string): string =>
      this.nodes().find((node) => node.key === port.split(':')[1])?.title ?? '';
    return connection
      ? title(connection.source) + ' → ' + title(connection.target)
      : '';
  });
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
  readonly addNext = input<((key: string) => void) | null>(null);
  readonly insertStep = input<((id: string) => void) | null>(null);
  readonly removeNode = input<((key: string) => void) | null>(null);
  readonly duplicateNode = input<((key: string) => void) | null>(null);
  readonly groupAction = input<((action: string) => void) | null>(null);
  readonly menuItems = computed(() =>
    canvasContextActions(this, (label) => this.locale.text(label)),
  );
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
      this.selectNode()(key, true);
      if (
        this.selectionKeys().includes(key) &&
        this.selectionKeys().length > 1
      ) {
        this.flow()?.select([...this.selectionKeys()], [], false);
      }
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
    event.preventDefault();
    event.stopPropagation();
    this.inspectEdge()?.(id);
  }
  edgeKey(event: KeyboardEvent, id: string): void {
    if (
      event.key === 'ContextMenu' ||
      (event.shiftKey && event.key === 'F10')
    ) {
      this.openEdgeMenu(event as unknown as MouseEvent, id);
    }
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
    if (
      event.type === 'click' &&
      event.isTrusted &&
      this.pointerSelectionHandled
    ) {
      return;
    }
    if (event.shiftKey && this.toggleNode()) {
      this.toggleNode()!(key);
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
    this.centerNode(key);
  }
  reassigned(event: FReassignConnectionEvent): void {
    const source =
      event.endpoint === 'source' ? event.nextSourceId : event.previousSourceId;
    const target =
      event.endpoint === 'target' ? event.nextTargetId : event.previousTargetId;
    if (
      !this.disabled() &&
      !this.readOnly() &&
      !this.gestureCancelled() &&
      source &&
      target
    ) {
      this.reconnect()?.(event.connectionId, source, target);
    }
  }
  readonly collapsed = input<readonly string[]>([]);
  readonly routing = input<Record<string, Point[]>>({});
  readonly automaticRouting = computed(() =>
    automaticConnectionRoutes(this.nodes(), this.edges(), this.routing()),
  );
  editRoute(id: string): void {
    const points = this.automaticRouting()[id];
    if (points && !this.disabled() && !this.readOnly()) {
      this.routeEdge()(id, structuredClone(points));
    }
  }
  readonly viewRouting = computed(() => {
    this.gestureRevision();
    return structuredClone({ ...this.routing(), ...this.automaticRouting() });
  });
  routePoints(id: string, points: Point[]): void {
    if (!this.disabled() && !this.readOnly() && !this.gestureCancelled()) {
      this.routeEdge()(id, points);
    }
  }
  override cancelGesture(): void {
    super.cancelGesture();
    this.linkSource.set('');
    this.pendingConnection.set(null);
  }
  readonly routeEdge = input.required<(key: string, points: Point[]) => void>();
  readonly connect =
    input.required<
      (source: string, target: string, outcome?: string) => void
    >();
  created(event: FCreateConnectionEvent): void {
    if (
      !this.disabled() &&
      !this.readOnly() &&
      !this.gestureCancelled() &&
      event.targetId
    ) {
      this.requestConnection(event.sourceId, event.targetId);
    }
  }
  keyMove(event: KeyboardEvent, node: CanvasNode): void {
    if (
      event.key === 'ContextMenu' ||
      (event.shiftKey && event.key === 'F10')
    ) {
      this.openMenu(event as unknown as MouseEvent, node.key);
      return;
    }
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
