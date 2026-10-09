import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  CalendarEvent,
  CalendarProjection,
  eventsInWindow,
  eventsOnDay,
} from '../../domain/calendar-events';
import {
  calendarDays,
  CalendarView,
  calendarWindow,
} from '../../domain/calendar-dates';
@Component({
  selector: 'app-calendar-views',
  imports: [ButtonModule, LocalizePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar-views.html',
})
export class CalendarViews {
  private readonly locale = inject(Locale);
  readonly anchor = input.required<string>();
  readonly timezone = input('UTC');
  readonly projection = input.required<CalendarProjection>();
  readonly view = signal<CalendarView>('agenda');
  readonly views = ['agenda', 'week', 'month'] as const;
  readonly labels = { agenda: 'Agenda', week: 'Week', month: 'Month' };
  readonly selected = output<CalendarEvent>();
  private readonly revoked = signal<CalendarProjection | null>(null);
  readonly state = computed(() =>
    this.revoked() === this.projection() ? 'failed' : this.projection().status,
  );
  readonly window = computed(() => calendarWindow(this.anchor(), this.view()));
  readonly days = computed(() => calendarDays(this.window()));
  readonly events = computed(() =>
    this.state() === 'ready'
      ? eventsInWindow(this.projection().events, this.window(), this.timezone())
      : [],
  );
  constructor() {
    const release = inject(ActorState).register(() => {
      this.revoked.set(this.projection());
      this.view.set('agenda');
    });
    inject(DestroyRef).onDestroy(release);
  }
  firstColumn(): number {
    return ((new Date(this.days()[0] + 'T00:00:00Z').getUTCDay() + 6) % 7) + 1;
  }
  onDay(day: string): CalendarEvent[] {
    return eventsOnDay(this.events(), day, this.timezone());
  }
  dateLabel(day: string): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      calendar: 'gregory',
      timeZone: 'UTC',
      dateStyle: 'full',
    }).format(new Date(day + 'T12:00:00Z'));
  }
  timeLabel(event: CalendarEvent): string {
    return event.kind === 'all_day'
      ? this.locale.text('All day')
      : new Intl.DateTimeFormat(this.locale.language(), {
          calendar: 'gregory',
          timeZone: this.timezone(),
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(event.start));
  }
  open(event: CalendarEvent): void {
    if (this.events().includes(event)) {
      this.selected.emit(event);
    }
  }
}
