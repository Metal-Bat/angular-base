import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { SelectOverlayState } from './select-overlay-state';
import { Select } from 'primeng/select';

type VisibilityEvent = {
  subscribe(next: () => void): { unsubscribe(): void };
};

/** Preserve Escape when PrimeNG's pending enter callback reasserts visibility. */
export function bindSelectEscape(
  host: HTMLElement,
  shown: VisibilityEvent,
  hidden: VisibilityEvent,
  close: (restoreFocus: boolean) => void,
  startClosing?: () => void,
  entered?: VisibilityEvent,
): () => void {
  const document = host.ownerDocument;
  let pending = false;
  let alive = true;
  let ownsFocus = false;
  let listening = false;
  const popup = (): Element | null => {
    const control = host.querySelector(
      '[role="combobox"][aria-expanded="true"]',
    );
    const id = control?.getAttribute('aria-controls');
    return id
      ? (document
          .getElementById(id)
          ?.closest('.p-select-overlay, .p-multiselect-overlay') ?? null)
      : null;
  };
  const owns = (target: Node): boolean =>
    host.contains(target) || !!popup()?.contains(target);
  const pointer = (event: Event): void => {
    ownsFocus = owns(event.target as Node);
  };
  const focus = (event: Event): void => {
    if (!owns(event.target as Node)) {
      ownsFocus = false;
    }
  };
  const bodyTarget = (target: Node): boolean =>
    ownsFocus &&
    (target === document.body || target === document.documentElement);
  const popupEscape = (event: KeyboardEvent): void => {
    const target = event.target as Node | null;
    if (event.code !== 'Escape' || !target || host.contains(target)) {
      return;
    }
    const panel = popup();
    if (panel && (panel.contains(target) || bodyTarget(target))) {
      pending = true;
      startClosing?.();
      close(true);
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const stop = (): void => {
    listening = false;
    document.removeEventListener('keydown', popupEscape, true);
    document.removeEventListener('pointerdown', pointer, true);
    document.removeEventListener('focusin', focus, true);
  };
  const listen = (): void => {
    if (!listening) {
      listening = true;
      document.addEventListener('keydown', popupEscape, true);
      document.addEventListener('pointerdown', pointer, true);
      document.addEventListener('focusin', focus, true);
    }
  };
  const capture = (event: KeyboardEvent): void => {
    if (
      event.code === 'Escape' &&
      host.querySelector('[role="combobox"][aria-expanded="true"]')
    ) {
      pending = true;
      startClosing?.();
      ownsFocus = true;
      listen();
    }
  };
  host.addEventListener('keydown', capture, true);
  const opening = shown.subscribe(() => {
    if (!listening) {
      ownsFocus = true;
    }
    listen();
    if (pending && !entered) {
      queueMicrotask(() => {
        if (alive && pending) {
          close(ownsFocus);
        }
      });
    }
  });
  const settled = entered?.subscribe(() => {
    if (alive && pending) {
      close(ownsFocus);
    }
  });
  const closing = hidden.subscribe(() => {
    pending = false;
    ownsFocus = false;
    stop();
  });
  return (): void => {
    alive = false;
    host.removeEventListener('keydown', capture, true);
    stop();
    opening.unsubscribe();
    closing.unsubscribe();
    settled?.unsubscribe();
  };
}

/** Uses only the installed Select's public visibility events and hide command. */
@Directive({
  selector: 'p-select[appSelectEscape]',
  exportAs: 'appSelectEscape',
})
export class SelectEscape extends SelectOverlayState {
  constructor() {
    super();
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const select = inject(Select);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      destroy.onDestroy(
        bindSelectEscape(
          host,
          select.onShow,
          select.onHide,
          (restoreFocus) => select.hide(restoreFocus),
          () => this.closing.set(true),
          this.entered,
        ),
      );
    });
  }
}
