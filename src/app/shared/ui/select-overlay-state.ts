import { EventEmitter, signal } from '@angular/core';
import type { OverlayOptions } from 'primeng/api';

/** The public overlay completion events own the closing fence for both selects. */
export class SelectOverlayState {
  readonly closing = signal(false);
  readonly entered = new EventEmitter<void>();
  // PrimeNG 21 dispatches these public motion completion callbacks through options;
  // OverlayOptions' declaration still lists the earlier animation callbacks only.
  readonly overlayOptions: OverlayOptions & {
    onAfterEnter(): void;
    onAfterLeave(): void;
  } = {
    onBeforeHide: (): void => this.closing.set(true),
    onAfterEnter: (): void => this.entered.emit(),
    onAfterLeave: (): void => this.closing.set(false),
  };
}
