import { CalendarDraft } from '../../domain/calendar-draft';
import { CalendarActivation } from '../calendar-activation';
import { NgTemplateOutlet } from '@angular/common';
import { CalendarRail } from '../calendar-rail/calendar-rail';
import { CalendarToolbar } from '../calendar-toolbar/calendar-toolbar';
import { CalendarGrid } from '../calendar-grid/calendar-grid';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  CalendarEvent,
  calendarEventsByDay,
  CalendarProjection,
  eventsInWindow,
} from '../../domain/calendar-events';
import {
  calendarDays,
  CalendarView,
  calendarWindow,
  shiftDate,
  zonedDate,
} from '../../domain/calendar-dates';
@Component({
  selector: 'app-calendar-views',
  imports: [
    NgTemplateOutlet,
    CalendarGrid,
    CalendarRail,
    CalendarToolbar,
    ButtonModule,
    LocalizePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-views.html',
  styleUrl: './calendar-views.scss',
})
export class CalendarViews {
  private readonly toolbar = viewChild(CalendarToolbar);
  showAgenda(day: string): void {
    if (
      !['ready', 'partial'].includes(this.state()) ||
      !this.days().includes(day)
    ) {
      return;
    }
    this.view.set('agenda');
    this.periodChanged.emit(day);
    this.toolbar()?.focusView('agenda');
  }
  private readonly locale = inject(Locale);
  readonly anchor = input.required<string>();
  readonly timezone = input('UTC');
  readonly projection = input.required<CalendarProjection>();
  readonly view = signal<CalendarView>('month');
  readonly personal = signal(true);
  readonly workflow = signal(true);
  readonly views = ['day', 'week', 'month', 'agenda'] as const;
  readonly labels = {
    day: 'Day',
    agenda: 'Agenda',
    week: 'Week',
    month: 'Month',
  };
  readonly selected = output<CalendarEvent>();
  readonly draftRequested = output<CalendarDraft>();
  readonly activated = output<CalendarActivation>();
  readonly periodChanged = output<string>();
  readonly refreshRequested = output<void>();
  readonly periodTitle = computed(() =>
    this.view() === 'month'
      ? new Intl.DateTimeFormat(this.locale.language(), {
          calendar: this.locale.calendar(),
          numberingSystem: this.locale.numbering(),
          timeZone: 'UTC',
          month: 'long',
          year: 'numeric',
        }).format(new Date(this.anchor() + 'T12:00:00Z'))
      : this.view() === 'day'
        ? this.dateLabel(this.anchor())
        : this.dateLabel(this.window().start) +
          ' – ' +
          this.dateLabel(shiftDate(this.window().end, -1)),
  );
  navigate(direction: number): void {
    const range = this.window();
    this.periodChanged.emit(
      this.view() === 'month'
        ? direction > 0
          ? range.end
          : shiftDate(range.start, -1)
        : shiftDate(this.anchor(), direction * (this.view() === 'day' ? 1 : 7)),
    );
  }
  goToday(): void {
    this.periodChanged.emit(
      zonedDate(new Date().toISOString(), this.timezone()),
    );
  }
  private readonly revoked = signal<CalendarProjection | null>(null);
  readonly state = computed(() =>
    this.revoked() === this.projection() ? 'failed' : this.projection().status,
  );
  readonly window = computed(() =>
    calendarWindow(this.anchor(), this.view(), this.locale.calendar()),
  );
  readonly days = computed(() => calendarDays(this.window()));
  readonly agendaDays = computed(() =>
    this.days().filter((day) => this.onDay(day).length > 0),
  );
  readonly events = computed(() =>
    this.state() === 'ready' || this.state() === 'partial'
      ? eventsInWindow(
          this.projection().events,
          this.window(),
          this.timezone(),
        ).filter((event) =>
          event.source === 'personal' ? this.personal() : this.workflow(),
        )
      : [],
  );
  constructor() {
    // No persisted view exists in the frozen preference contract. Choose Day
    // for an initial phone visit; subsequent resize preserves the user's view.
    afterNextRender(() => {
      if (window.matchMedia?.('(max-width: 48rem)').matches) {
        this.view.set('day');
      }
    });
    const release = inject(ActorState).register(() => {
      this.revoked.set(this.projection());
      this.view.set('month');
      this.personal.set(true);
      this.workflow.set(true);
    });
    inject(DestroyRef).onDestroy(release);
  }
  private readonly byDay = computed(() =>
    calendarEventsByDay(this.events(), this.window(), this.timezone()),
  );
  onDay(day: string): readonly CalendarEvent[] {
    return this.byDay().get(day) ?? [];
  }
  dateLabel(day: string): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      calendar: this.locale.calendar(),
      numberingSystem: this.locale.numbering(),
      timeZone: 'UTC',
      dateStyle: 'full',
    }).format(new Date(day + 'T12:00:00Z'));
  }
  timeLabel(event: CalendarEvent): string {
    return event.kind === 'all_day'
      ? this.locale.text('All day')
      : new Intl.DateTimeFormat(this.locale.language(), {
          calendar: this.locale.calendar(),
          numberingSystem: this.locale.numbering(),
          timeZone: this.timezone(),
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(event.start));
  }
  open(event: CalendarEvent, trigger?: HTMLElement): void {
    if (this.events().includes(event)) {
      this.selected.emit(event);
      if (trigger) {
        this.activated.emit({ event, trigger });
      }
    }
  }
}
