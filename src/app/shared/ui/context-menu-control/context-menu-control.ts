import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
/** Public seam for canvas adapters; vendor menu types remain in shared UI. */
@Component({
  selector: 'app-context-menu-control',
  imports: [ContextMenuModule],
  template:
    '<p-contextmenu appendTo="body" [model]="model()" [pt]="menuPt" (onHide)="restoreFocus()" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuControl {
  // aria-level is a tree attribute, not a menuitem attribute.
  readonly menuPt = { item: { 'aria-level': null } };
  readonly items = input.required<readonly ContextAction[]>();
  readonly model = computed(() => [...this.items()]);
  private readonly menu = viewChild(ContextMenu);
  private anchor: HTMLElement | null = null;
  show(event: MouseEvent): void {
    const anchor = event.currentTarget as HTMLElement | null;
    this.anchor = anchor;
    if (!event.clientX && !event.clientY && anchor?.getBoundingClientRect) {
      const rect = anchor.getBoundingClientRect();
      const view = anchor.ownerDocument.defaultView;
      this.menu()?.show({
        pageX: rect.left + (view?.scrollX ?? 0),
        pageY: rect.bottom + (view?.scrollY ?? 0),
        stopPropagation: (): void => event.stopPropagation(),
        preventDefault: (): void => event.preventDefault(),
      });
    } else {
      this.menu()?.show(event);
    }
  }
  hide(): void {
    this.menu()?.hide();
  }
  restoreFocus(): void {
    if (this.anchor?.isConnected) {
      this.anchor.focus();
    }
    this.anchor = null;
  }
}
