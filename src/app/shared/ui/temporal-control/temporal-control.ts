import type { Button } from 'primeng/button';
import type { PassThroughContext } from 'primeng/api';
import type { DatePickerPassThrough } from 'primeng/types/datepicker';
import { ActorState } from '../../../core/auth/actor-state';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Locale } from '../../../core/localization/locale';
import {
  calendarIso,
  calendarMonth,
  calendarParts,
  CalendarSystem,
  calendarText,
  gregorianMillis,
  shiftCalendarDay,
} from '../../domain/calendar-value';
import { localTimeCandidates, wallParts } from '../../domain/wall-time';
import { LocalizePipe } from '../localize-pipe';
import { SelectControl } from '../select-control/select-control';
export type TemporalKind = 'date' | 'time' | 'datetime' | 'datetime-local';
function temporalKind(value: string): TemporalKind {
  if (
    value === 'date' ||
    value === 'time' ||
    value === 'datetime' ||
    value === 'datetime-local'
  ) {
    return value;
  }
  throw Error('Unsupported temporal kind');
}
@Component({
  selector: 'app-temporal-control',
  imports: [
    FormsModule,
    ButtonModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    LocalizePipe,
    SelectControl,
  ],
  templateUrl: './temporal-control.html',
  styleUrl: './temporal-control.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalControl {
  readonly locale = inject(Locale);
  readonly controlId = input.required<string>();
  readonly kind = input<TemporalKind, string>('date', {
    transform: temporalKind,
  });
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly describedBy = input<string | null>('');
  readonly ariaLabel = input('');
  readonly timezone = input<string>();
  readonly zone = computed(() => this.timezone() ?? this.locale.timezone());
  readonly value = model('');
  readonly dateText = signal('');
  readonly time = signal<Date | null>(null);
  readonly error = signal('');
  private readonly draftCalendar = signal<CalendarSystem>('gregory');
  readonly calendar = computed(() =>
    this.error() ? this.draftCalendar() : this.locale.calendar(),
  );
  private readonly injector = inject(Injector);
  readonly opened = signal(false);
  private readonly calendarTrigger =
    viewChild<ElementRef<HTMLButtonElement>>('calendarTrigger');
  readonly anchor = signal(new Date().toISOString().slice(0, 10));
  readonly selectedDate = signal('');
  readonly candidates = signal<string[]>([]);
  readonly calendars = ['gregory', 'persian', 'islamic-civil'] as const;
  readonly calendarLabels: Record<CalendarSystem, string> = {
    gregory: 'Gregorian',
    persian: 'Jalali',
    'islamic-civil': 'Islamic (civil Hijri)',
  };
  readonly timePt = computed<DatePickerPassThrough>(() => {
    this.locale.language();
    return {
      pcInputText: { root: { 'aria-describedby': this.describedBy() || null } },
      // PrimeNG 21.1.10 places spinner labels on p-button's host. Forward them to its native button.
      pcIncrementButton: {
        root: (context): Record<string, string> =>
          this.timeButtonAttributes(context, 'Increase time'),
      },
      pcDecrementButton: {
        root: (context): Record<string, string> =>
          this.timeButtonAttributes(context, 'Decrease time'),
      },
    };
  });
  private timeButtonAttributes(
    context: PassThroughContext,
    fallback: string,
  ): Record<string, string> {
    const host = (context.instance as Button).el.nativeElement as HTMLElement;
    return {
      'aria-label':
        host.getAttribute('aria-label') || this.locale.text(fallback),
    };
  }
  private emitted: string | undefined;
  readonly days = computed(() => calendarMonth(this.anchor(), this.calendar()));
  readonly leading = computed(() =>
    new Date(gregorianMillis(this.days()[0])).getUTCDay(),
  );
  readonly blanks = computed(() =>
    Array.from({ length: this.leading() }, (_, index) => index),
  );
  readonly monthTitle = computed(() =>
    new Intl.DateTimeFormat(this.locale.language(), {
      calendar: this.calendar(),
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }).format(gregorianMillis(this.anchor())),
  );
  readonly weekdays = computed(() =>
    Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(this.locale.language(), {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(Date.UTC(2026, 0, 4 + index)),
    ),
  );
  constructor() {
    const release = inject(ActorState).register(() => {
      this.dateText.set('');
      this.time.set(null);
      this.error.set('');
      this.opened.set(false);
      this.candidates.set([]);
      this.selectedDate.set('');
      this.anchor.set(new Date().toISOString().slice(0, 10));
      this.publish('');
    });
    inject(DestroyRef).onDestroy(release);
    effect(() => {
      const value = this.value();
      const calendar = this.locale.calendar();
      const kind = this.kind();
      const zone = this.zone();
      untracked(() => {
        if (value === this.emitted && this.error()) {
          return;
        }
        this.error.set('');
        this.candidates.set([]);
        if (!value) {
          this.dateText.set('');
          this.time.set(null);
          this.selectedDate.set('');
          return;
        }
        try {
          const wall =
            kind === 'datetime' ? wallParts(Date.parse(value), zone) : value;
          if (kind !== 'time') {
            const date = wall.slice(0, 10);
            this.dateText.set(calendarText(date, calendar));
            this.selectedDate.set(date);
            this.anchor.set(date);
          }
          if (kind !== 'date') {
            const clock = kind === 'time' ? value : wall.slice(11);
            this.time.set(
              new Date(
                '2000-01-01T' + (clock.length === 5 ? clock + ':00' : clock),
              ),
            );
          }
        } catch {
          this.dateText.set(value);
          this.error.set('Enter a valid date or time.');
        }
      });
    });
  }
  calendarChanged(value: string): void {
    if (!this.disabled() && this.calendars.includes(value as CalendarSystem)) {
      // Invalid text belongs to its original calendar; require correction first.
      if (this.error()) {
        return;
      }
      this.locale.calendarOverride.set(value as CalendarSystem);
    }
  }
  typeDate(value: string): void {
    if (this.disabled()) {
      return;
    }
    this.dateText.set(value);
    this.commit();
  }
  timeChanged(value: Date | null): void {
    if (this.disabled()) {
      return;
    }
    this.time.set(value);
    this.commit();
  }
  private clock(): string {
    const time = this.time();
    if (!time || !Number.isFinite(time.getTime())) {
      throw Error('Enter a valid date or time.');
    }
    return [time.getHours(), time.getMinutes(), time.getSeconds()]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');
  }
  private publish(value: string): void {
    this.emitted = value;
    this.value.set(value);
  }
  commit(): void {
    const calendar = this.calendar();
    this.draftCalendar.set(calendar);
    this.error.set('');
    this.candidates.set([]);
    try {
      if (this.kind() === 'time') {
        this.publish(this.time() ? this.clock() : '');
        return;
      }
      if (!this.dateText()) {
        this.selectedDate.set('');
        this.publish('');
        return;
      }
      const date = calendarIso(this.dateText(), calendar);
      this.selectedDate.set(date);
      this.anchor.set(date);
      if (this.kind() === 'date') {
        this.publish(date);
        return;
      }
      const clock = this.clock();
      const local = date + 'T' + clock;
      if (this.kind() === 'datetime-local') {
        this.publish(local.slice(0, 16));
        return;
      }
      const candidates = localTimeCandidates(
        local.slice(0, 16),
        this.zone(),
      ).map((value) =>
        new Date(
          Date.parse(value) + Number(clock.slice(6)) * 1000,
        ).toISOString(),
      );
      if (candidates.length === 1) {
        this.publish(candidates[0]);
        return;
      }
      this.candidates.set(candidates);
      throw Error(
        candidates.length
          ? 'Choose an offset for this ambiguous local time'
          : 'This local time does not exist',
      );
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Enter a valid date or time.',
      );
      // Invalid drafts must fail existing domain validation, never submit a stale instant.
      this.publish('invalid:' + this.dateText());
    }
  }
  chooseInstant(value: string): void {
    if (!this.disabled() && this.candidates().includes(value)) {
      this.error.set('');
      this.publish(value);
    }
  }
  showCalendar(): void {
    if (!this.disabled()) {
      this.opened.set(true);
    }
  }
  restoreDateFocus(): void {
    const trigger = this.calendarTrigger()?.nativeElement;
    if (trigger?.isConnected && !trigger.disabled) {
      trigger.focus();
    }
  }
  moveMonth(direction: number): void {
    const days = this.days();
    this.anchor.set(
      shiftCalendarDay(
        direction < 0 ? days[0] : days[days.length - 1],
        direction,
      ),
    );
  }
  dayNumber(date: string): string {
    return this.locale.number(calendarParts(date, this.calendar())[2]);
  }
  dayLabel(date: string): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      calendar: this.calendar(),
      timeZone: 'UTC',
      dateStyle: 'full',
    }).format(gregorianMillis(date));
  }
  navigateDay(event: KeyboardEvent, date: string): void {
    if (this.disabled()) {
      return;
    }
    const rtl = this.locale.language() !== 'en';
    const offsets: Record<string, number> = {
      ArrowLeft: rtl ? 1 : -1,
      ArrowRight: rtl ? -1 : 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (!(event.key in offsets)) {
      return;
    }
    event.preventDefault();
    const next = shiftCalendarDay(date, offsets[event.key]);
    this.anchor.set(next);
    const container = (event.target as HTMLElement).closest('.calendar-days');
    afterNextRender(
      () =>
        container
          ?.querySelector<HTMLButtonElement>(
            '[data-calendar-day="' + next + '"]',
          )
          ?.focus(),
      { injector: this.injector },
    );
  }
  chooseDate(date: string): void {
    if (this.disabled()) {
      return;
    }
    if (date === this.selectedDate() && !this.error() && this.value()) {
      this.opened.set(false);
      return;
    }
    this.dateText.set(calendarText(date, this.calendar()));
    if (this.kind() !== 'date' && !this.time()) {
      this.time.set(new Date(2000, 0, 1));
    }
    this.opened.set(false);
    this.commit();
  }
  clear(): void {
    if (this.disabled()) {
      return;
    }
    this.error.set('');
    this.dateText.set('');
    this.time.set(null);
    this.selectedDate.set('');
    this.candidates.set([]);
    this.publish('');
  }
}
