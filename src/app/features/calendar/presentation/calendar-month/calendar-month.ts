import { revealCalendarDay } from '../calendar-grid/calendar-scroll';
import { Locale } from '../../../../core/localization/locale';
import { CalendarDraft, calendarDraft } from '../../domain/calendar-draft';
import { CalendarActivation } from '../calendar-activation';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ButtonDirective } from 'primeng/button';
import type { CalendarGrid } from '../calendar-grid/calendar-grid';
import { CalendarEvent } from '../../domain/calendar-events';
@Component({
  selector: 'app-calendar-month',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './calendar-month.html',
  styleUrl: './calendar-month.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarMonth {
  private readonly scroll = viewChild<ElementRef<HTMLElement>>('monthScroll');
  readonly horizontalOverflow = signal(false);
  constructor() {
    afterRenderEffect((onCleanup) => {
      const view = this.view();
      const anchor = view.anchor() || view.today();
      view.window();
      const scroll = this.scroll()?.nativeElement;
      if (scroll) {
        untracked(() => {
          const reveal = (): void => {
            this.horizontalOverflow.set(
              scroll.scrollWidth > scroll.clientWidth + 1,
            );
            revealCalendarDay(scroll, anchor);
          };
          reveal();
          const observer = new ResizeObserver(reveal);
          observer.observe(scroll);
          onCleanup(() => observer.disconnect());
        });
      }
    });
  }
  readonly locale = inject(Locale);
  readonly expandedDays = signal<ReadonlySet<string>>(new Set());
  toggle(day: string): void {
    this.expandedDays.update((current) => {
      const next = new Set(current);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }
  visible(day: string): readonly CalendarEvent[] {
    const events = this.view().onDay(day);
    return this.expandedDays().has(day) ? events : events.slice(0, 3);
  }

  readonly calendarDraft = calendarDraft;
  readonly view =
    input.required<
      Pick<
        CalendarGrid,
        | 'anchor'
        | 'weekdays'
        | 'weeks'
        | 'window'
        | 'today'
        | 'onDay'
        | 'format'
        | 'timeLabel'
        | 'timezone'
      >
    >();
  readonly selected = output<CalendarEvent>();
  readonly draftRequested = output<CalendarDraft>();
  readonly activated = output<CalendarActivation>();
}
