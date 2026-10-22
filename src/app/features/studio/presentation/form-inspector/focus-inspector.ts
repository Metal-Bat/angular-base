import {
  afterRenderEffect,
  DestroyRef,
  ElementRef,
  inject,
  Signal,
  untracked,
} from '@angular/core';

function nativeCaption(active: Element): HTMLLabelElement | null {
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  ) {
    return active.labels?.[0] ?? null;
  }
  return null;
}

/** Focus the selected field after its active property surface has rendered. */
export function focusInspector(
  path: Signal<readonly number[]>,
  disabled: Signal<boolean>,
  rulesOnly: Signal<boolean>,
): void {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  // Section animation and a resized dock must not clip the keyboard focus.
  const reveal = (): void => {
    const active = host.ownerDocument.activeElement;
    const panel = host.closest('p-tabpanels') ?? host.closest('.form-tools');
    if (
      !panel ||
      !active ||
      !host.contains(active) ||
      !active.matches(':focus-visible') ||
      active.closest('.inspector-actions')
    ) {
      return;
    }
    const viewport = panel.getBoundingClientRect();
    const actions = host
      .querySelector('.inspector-actions')
      ?.getBoundingClientRect();
    const style = getComputedStyle(active);
    const focusClearance =
      Math.max(0, Number.parseFloat(style.outlineWidth) || 0) +
      Math.max(0, Number.parseFloat(style.outlineOffset) || 0);
    const top = Math.max(viewport.top, actions?.bottom ?? viewport.top);
    const available = viewport.bottom - top;
    if (available <= 0) {
      return;
    }
    const field = active.getBoundingClientRect();
    let fieldTop = field.top - focusClearance;
    const fieldBottom = field.bottom + focusClearance;
    const caption = nativeCaption(active);
    if (caption && host.contains(caption)) {
      const captionTop = caption.getBoundingClientRect().top;
      if (fieldBottom - captionTop <= available) {
        fieldTop = Math.min(fieldTop, captionTop);
      }
    }
    const bottom = fieldTop + Math.min(fieldBottom - fieldTop, available);
    if (fieldTop < top) {
      panel.scrollTop += Math.floor(fieldTop - top);
    } else if (bottom > viewport.bottom) {
      panel.scrollTop += Math.ceil(bottom - viewport.bottom);
    }
  };
  const observer =
    typeof ResizeObserver === 'function' ? new ResizeObserver(reveal) : null;
  observer?.observe(host);
  let observedPanel: Element | null = null;
  host.addEventListener('focusin', reveal);
  inject(DestroyRef).onDestroy(() => {
    observer?.disconnect();
    host.removeEventListener('focusin', reveal);
  });
  afterRenderEffect(() => {
    const panel = host.closest('p-tabpanels') ?? host.closest('.form-tools');
    if (panel && panel !== observedPanel) {
      if (observedPanel) {
        observer?.unobserve(observedPanel);
      }
      observer?.observe(panel);
      observedPanel = panel;
    }
    const rules = rulesOnly();
    if ((path().length || rules) && !untracked(disabled)) {
      if (rules) {
        if (panel) {
          panel.scrollTop = 0;
        }
        host
          .closest('.form-properties')
          ?.querySelector<HTMLElement>('h2')
          ?.focus({ preventScroll: true });
      } else {
        host
          .querySelector<HTMLInputElement>('#field-label')
          ?.focus({ preventScroll: true });
      }
    }
    reveal();
  });
}
