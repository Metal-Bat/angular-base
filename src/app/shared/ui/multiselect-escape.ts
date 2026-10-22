import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { SelectOverlayState } from './select-overlay-state';
import { MultiSelect } from 'primeng/multiselect';
import { bindSelectEscape } from './select-escape';

/** MultiSelect exposes the same lifecycle through separately named public events. */
@Directive({
  selector: 'p-multiselect[appMultiSelectEscape]',
  exportAs: 'appMultiSelectEscape',
})
export class MultiSelectEscape extends SelectOverlayState {
  constructor() {
    super();
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const select = inject(MultiSelect);
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const release = bindSelectEscape(
        host,
        select.onPanelShow,
        select.onPanelHide,
        (restoreFocus) => select.hide(restoreFocus),
        () => this.closing.set(true),
        this.entered,
      );
      const selection = select.onChange.subscribe((event) => {
        const document = host.ownerDocument;
        const control = host.querySelector<HTMLElement>('[role="combobox"]');
        if (
          event.originalEvent &&
          document.activeElement === document.body &&
          control &&
          !control.hasAttribute('disabled')
        ) {
          control.focus({ preventScroll: true });
        }
      });
      destroy.onDestroy(() => {
        release();
        selection.unsubscribe();
      });
    });
  }
}
