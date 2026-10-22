import type { Popover } from 'primeng/popover';

/** Give the installed overlay a real available-height bound before it chooses its side. */
export function constrainPopover(
  popup: Popover | undefined,
  minimumHeight = 0,
): void {
  const container = popup?.container as HTMLElement | undefined;
  const target = popup?.target as HTMLElement | undefined;
  const window = container?.ownerDocument.defaultView;
  if (!container || !target || !window) {
    return;
  }
  const anchor = target.getBoundingClientRect();
  const inset = 16;
  const gap = Math.max(
    8,
    Math.abs(parseFloat(window.getComputedStyle(container).marginTop) || 0),
  );
  const below = window.innerHeight - anchor.bottom - gap - inset;
  const above = anchor.top - gap - inset;
  const viewport = window.innerHeight - 2 * inset;
  const side = Math.max(above, below);
  // A calendar must retain usable date rows when neither side has enough room.
  // In that case allow overlap with its anchor and use the viewport collision clamp.
  const available = Math.max(
    1,
    Math.min(viewport, side < minimumHeight ? viewport : side) - 2,
  );
  container.style.setProperty('--anchored-popover-height', `${available}px`);
  popup?.align();
  // Absolute positioning is relative to the document; retain its chosen anchor/side,
  // with a final collision clamp for viewport edges and fractional browser zoom.
  const styles = window.getComputedStyle(container);
  const marginLeft = parseFloat(styles.marginLeft) || 0;
  const marginTop = parseFloat(styles.marginTop) || 0;
  const left = parseFloat(container.style.left) - window.scrollX + marginLeft;
  const top = parseFloat(container.style.top) - window.scrollY + marginTop;
  const fittedLeft = Math.max(
    inset,
    Math.min(left, window.innerWidth - container.offsetWidth - inset),
  );
  const fittedTop = Math.max(
    inset,
    Math.min(top, window.innerHeight - container.offsetHeight - inset),
  );
  container.style.left = `${fittedLeft + window.scrollX - marginLeft}px`;
  container.style.top = `${fittedTop + window.scrollY - marginTop}px`;
}

/** Return keyboard focus without stealing an outside click's newly focused control. */
export function restorePopoverFocus(
  popup: Popover | undefined,
  trigger: HTMLElement | null | undefined,
): void {
  const document = trigger?.ownerDocument;
  const active = document?.activeElement ?? null;
  if (
    trigger?.isConnected &&
    !trigger.hasAttribute('disabled') &&
    (active === document?.body || popup?.container?.contains(active))
  ) {
    trigger.focus();
  }
}
