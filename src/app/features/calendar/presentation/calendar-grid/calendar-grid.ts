import { revealCalendarDay } from './calendar-scroll';
import { CalendarDraft, calendarDraft } from '../../domain/calendar-draft';
import { CalendarActivation } from '../calendar-activation';
import { CalendarMonth } from '../calendar-month/calendar-month';
import { CalendarTimedEvent } from '../calendar-timed-event/calendar-timed-event';
import { timedEventLayout, TimedRow } from './timed-event-layout';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { wallParts } from '../../../../shared/domain/wall-time';
import {
  CalendarEvent,
  calendarEventsByDay,
} from '../../domain/calendar-events';
import {
  calendarDays,
  CalendarView,
  DateWindow,
  shiftDate,
  zonedDate,
} from '../../domain/calendar-dates';
@Component({
  selector: 'app-calendar-grid',
  imports: [CalendarMonth, CalendarTimedEvent, ButtonDirective, LocalizePipe],
  templateUrl: './calendar-grid.html',
  styleUrl: './calendar-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarGrid {
  readonly calendarDraft = calendarDraft;
  readonly anchor = input('');
  readonly window = input.required<DateWindow>();
  readonly view = input.required<CalendarView>();
  readonly timezone = input.required<string>();
  readonly events = input.required<readonly CalendarEvent[]>();
  readonly selected = output<CalendarEvent>();
  readonly draftRequested = output<CalendarDraft>();
  readonly activated = output<CalendarActivation>();
  readonly agendaRequested = output<string>();
  readonly locale = inject(Locale);
  private readonly now = signal(new Date());
  readonly horizontalOverflow = signal(false);
  readonly slotHour = signal(8);
  private readonly scroll = viewChild<ElementRef<HTMLElement>>('timeScroll');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('timeHeading');
  private readonly allDayHeading =
    viewChild<ElementRef<HTMLElement>>('allDayHeading');
  readonly headingHeight = signal(0);
  readonly pinnedHeight = signal(0);
  readonly nowMinute = computed(() => {
    const wall = wallParts(this.now().getTime(), this.timezone());
    return Number(wall.slice(11, 13)) * 60 + Number(wall.slice(14, 16));
  });
  constructor() {
    const timer = setInterval(() => this.now.set(new Date()), 60000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
    afterRenderEffect((onCleanup) => {
      const heading = this.heading()?.nativeElement;
      const allDay = this.allDayHeading()?.nativeElement;
      if (!heading) {
        return;
      }
      const measure = (): void => {
        const height = heading.getBoundingClientRect().height;
        this.headingHeight.set(height);
        this.pinnedHeight.set(
          height + (allDay?.getBoundingClientRect().height ?? 0),
        );
      };
      const observer = new ResizeObserver(measure);
      observer.observe(heading);
      if (allDay) {
        observer.observe(allDay);
      }
      measure();
      onCleanup(() => observer.disconnect());
    });
    afterRenderEffect((onCleanup) => {
      this.view();
      const range = this.window();
      this.timezone();
      const anchor =
        this.anchor() ||
        (calendarDays(range).includes(this.today())
          ? this.today()
          : range.start);
      const scroll = this.scroll()?.nativeElement;
      untracked(() => {
        const lane = scroll?.querySelector<HTMLElement>('.time-lane');
        if (scroll && lane) {
          const minute =
            anchor === this.today()
              ? Math.max(0, this.nowMinute() - 60)
              : 8 * 60;
          scroll.scrollTop = Math.max(0, (minute / 1440) * lane.clientHeight);
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
        }
      });
    });
  }
  navigateSlot(event: KeyboardEvent, hour: number): void {
    const next =
      event.key === 'ArrowDown'
        ? Math.min(23, hour + 1)
        : event.key === 'ArrowUp'
          ? Math.max(0, hour - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? 23
              : null;
    if (next !== null) {
      event.preventDefault();
      this.slotHour.set(next);
      (event.target as HTMLElement)
        .closest('.empty-slots')
        ?.querySelector<HTMLButtonElement>('[data-slot-hour="' + next + '"]')
        ?.focus();
    }
  }
  readonly days = computed(() => calendarDays(this.window()));
  readonly today = computed(() =>
    zonedDate(this.now().toISOString(), this.timezone()),
  );
  readonly weeks = computed(() => {
    const start = this.window().start;
    const offset = (new Date(start + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const first = shiftDate(start, -offset);
    const count = Math.ceil((this.days().length + offset) / 7);
    return Array.from({ length: count }, (_, week) =>
      Array.from({ length: 7 }, (_day, day) =>
        shiftDate(first, week * 7 + day),
      ),
    );
  });
  readonly weekdays = computed(() =>
    this.weeks()[0].map((day) => this.format(day, { weekday: 'short' })),
  );
  readonly hours = Array.from({ length: 24 }, (_, hour) => hour);
  format(day: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      calendar: this.locale.calendar(),
      numberingSystem: this.locale.numbering(),
      timeZone: 'UTC',
      ...options,
    }).format(new Date(day + 'T12:00:00Z'));
  }
  private readonly byDay = computed(() => {
    const weeks = this.weeks();
    return calendarEventsByDay(
      this.events(),
      {
        start: weeks[0][0],
        end: shiftDate(weeks.at(-1)!.at(-1)!, 1),
      },
      this.timezone(),
    );
  });
  onDay(day: string): readonly CalendarEvent[] {
    return this.byDay().get(day) ?? [];
  }
  allDay(day: string): CalendarEvent[] {
    return this.onDay(day).filter((event) => event.kind !== 'timed');
  }
  timeLabel(event: CalendarEvent): string {
    if (event.kind === 'all_day') {
      return this.locale.text('All day');
    }
    const formatter = new Intl.DateTimeFormat(this.locale.language(), {
      timeZone: this.timezone(),
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'shortOffset',
    });
    return (
      formatter.format(new Date(event.start)) +
      (event.kind === 'timed'
        ? ' – ' + formatter.format(new Date(event.end))
        : '')
    );
  }
  timed(day: string): TimedRow[] {
    return timedEventLayout(this.onDay(day), day, this.timezone());
  }
}
