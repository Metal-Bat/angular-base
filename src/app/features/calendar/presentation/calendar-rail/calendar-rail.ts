import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  calendarDays,
  calendarWindow,
  shiftDate,
  zonedDate,
} from '../../domain/calendar-dates';

@Component({
  selector: 'app-calendar-rail',
  imports: [FormsModule, ButtonDirective, CheckboxModule, LocalizePipe],
  templateUrl: './calendar-rail.html',
  styleUrl: './calendar-rail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarRail {
  readonly anchor = input.required<string>();
  readonly timezone = input.required<string>();
  readonly personal = model(true);
  readonly workflow = model(true);
  readonly dateSelected = output<string>();
  readonly locale = inject(Locale);
  readonly month = linkedSignal(() => this.anchor());
  readonly expanded = signal(false);
  readonly narrow = signal(false);
  readonly range = computed(() =>
    calendarWindow(this.month(), 'month', this.locale.calendar()),
  );
  readonly days = computed(() => {
    const range = this.range();
    const offset = (new Date(range.start + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const start = shiftDate(range.start, -offset);
    return calendarDays({
      start,
      end: shiftDate(
        start,
        Math.ceil((calendarDays(range).length + offset) / 7) * 7,
      ),
    });
  });
  readonly weekdays = computed(() =>
    this.days()
      .slice(0, 7)
      .map((day) => this.format(day, { weekday: 'narrow' })),
  );
  readonly title = computed(() =>
    this.format(this.month(), { month: 'long', year: 'numeric' }),
  );
  readonly today = computed(() =>
    zonedDate(new Date().toISOString(), this.timezone()),
  );
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const media = window.matchMedia?.('(max-width: 64rem)');
      if (!media) {
        return;
      }
      const update = (): void => this.narrow.set(media.matches);
      update();
      media.addEventListener('change', update);
      destroy.onDestroy(() => media.removeEventListener('change', update));
    });
  }
  toggle(event: Event): void {
    event.preventDefault();
    this.expanded.update((value) => !value);
  }
  navigate(direction: number): void {
    this.month.set(
      direction > 0 ? this.range().end : shiftDate(this.range().start, -1),
    );
  }
  format(day: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      calendar: this.locale.calendar(),
      numberingSystem: this.locale.numbering(),
      timeZone: 'UTC',
      ...options,
    }).format(new Date(day + 'T12:00:00Z'));
  }
}
