import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
/** Gives editor hosts the measured space below the real shell chrome. */
@Directive({ selector: '[appEditorViewport]' })
export class EditorViewport {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      let frame = 0;
      const measure = (): void => {
        frame = 0;
        const parent = host.parentElement;
        const gutter = parent
          ? parseFloat(getComputedStyle(parent).paddingBottom) || 0
          : 0;
        const top = host.getBoundingClientRect().top;
        host.style.setProperty(
          '--editor-available-height',
          Math.max(0, window.innerHeight - top - gutter) + 'px',
        );
      };
      const schedule = (): void => {
        if (!frame) {
          frame = requestAnimationFrame(measure);
        }
      };
      const observer = new ResizeObserver(schedule);
      for (const element of document.querySelectorAll(
        '.workspace-header, app-workspace-breadcrumbs .breadcrumb',
      )) {
        observer.observe(element);
      }
      window.addEventListener('resize', schedule);
      measure();
      void host.ownerDocument.fonts?.ready.then(() => {
        if (!destroy.destroyed) {
          schedule();
        }
      });
      destroy.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', schedule);
      });
    });
  }
}
