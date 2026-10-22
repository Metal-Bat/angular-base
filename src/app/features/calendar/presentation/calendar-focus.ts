import { DOCUMENT } from '@angular/common';
import { afterNextRender, inject, Injectable, Injector } from '@angular/core';

/** Focus belongs to this Calendar page, including its retained grid and editor. */
@Injectable()
export class CalendarFocus {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private opener: HTMLElement | null = null;
  capture(opener: Element | null = this.document.activeElement): void {
    this.opener = opener instanceof HTMLElement ? opener : null;
  }
  editor(work = false): void {
    afterNextRender(
      () =>
        this.document
          .querySelector<HTMLElement>(
            work ? 'app-work-reminders h2' : '#event-title',
          )
          ?.focus(),
      { injector: this.injector },
    );
  }
  restore(): void {
    afterNextRender(
      () => {
        const target = this.opener?.isConnected
          ? this.opener
          : this.document.querySelector<HTMLElement>('[data-create-event]');
        target?.focus();
      },
      { injector: this.injector },
    );
  }
}
