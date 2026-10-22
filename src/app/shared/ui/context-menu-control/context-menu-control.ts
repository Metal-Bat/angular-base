import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';

export type ContextAction = {
  label: string;
  icon?: string;
  disabled?: boolean;
  command: () => void;
};
type MenuRequest = {
  anchor: HTMLElement | null;
  x: number;
  y: number;
};
let nextMenuId = 0;
/** Public seam for canvas adapters; vendor menu types remain in shared UI. */
@Component({
  selector: 'app-context-menu-control',
  imports: [ContextMenuModule],
  template: `
    <p-contextmenu
      appendTo="body"
      [id]="menuId"
      [model]="model()"
      [pt]="menuPt"
      (onHide)="hidden()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuControl {
  readonly menuId = 'app-canvas-menu-' + nextMenuId++;
  // aria-level is a tree attribute, not a menuitem attribute.
  readonly menuPt = { item: { 'aria-level': null } };
  readonly items = input.required<readonly ContextAction[]>();
  readonly model = computed(() => [...this.items()]);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly menu = viewChild(ContextMenu);
  private anchor: HTMLElement | null = null;
  private closing: HTMLElement | null = null;
  private pending: MenuRequest | null = null;
  private observer: MutationObserver | null = null;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.observer?.disconnect();
      this.pending = null;
      this.anchor = null;
    });
  }
  show(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const anchor = event.currentTarget as HTMLElement | null;
    const rect = anchor?.getBoundingClientRect();
    const view = anchor?.ownerDocument.defaultView;
    const keyboard = !event.clientX && !event.clientY && !!rect;
    const request = {
      anchor,
      x: keyboard ? rect!.left + (view?.scrollX ?? 0) : event.pageX,
      y: keyboard ? rect!.bottom + (view?.scrollY ?? 0) : event.pageY,
    };
    if (this.closing?.isConnected) {
      this.pending = request;
      return;
    }
    this.pending = null;
    this.observer?.disconnect();
    this.closing = null;
    this.open(request);
  }
  hide(): void {
    this.pending = null;
    this.menu()?.hide();
  }
  hidden(): void {
    this.restoreFocus();
    const document = this.host.nativeElement.ownerDocument;
    this.closing = document.getElementById(this.menuId);
    this.observer?.disconnect();
    if (!this.closing) {
      this.closed();
      return;
    }
    // PrimeNG emits onHide before its leave cleanup. A new show before actual
    // removal can be erased by that cleanup. Observe only while closing, using
    // our own public overlay ID; never override vendor motion callbacks/state.
    this.observer = new MutationObserver(() => {
      if (!this.closing?.isConnected) {
        this.closed();
      }
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }
  private closed(): void {
    this.observer?.disconnect();
    this.closing = null;
    const request = this.pending;
    this.pending = null;
    if (request && (!request.anchor || request.anchor.isConnected)) {
      this.open(request);
    }
  }
  private open(request: MenuRequest): void {
    this.anchor = request.anchor;
    this.menu()?.show({
      pageX: request.x,
      pageY: request.y,
      stopPropagation: (): void => undefined,
      preventDefault: (): void => undefined,
    });
  }
  restoreFocus(): void {
    if (this.anchor?.isConnected) {
      this.anchor.focus();
    }
    this.anchor = null;
  }
}
