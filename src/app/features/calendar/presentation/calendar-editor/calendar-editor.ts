import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import {
  ApiFailure,
  knownRejection,
} from '../../../../core/transport/api-failure';
import { Feedback } from '../../../../core/feedback/feedback';
import { Reminder } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import {
  dateMillis,
  localTimeCandidates,
  localTimeToInstant,
} from '../../domain/calendar-dates';
import { CalendarInput, CalendarItem } from '../../application/calendar-port';
function localMinute(instant: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en', {
    calendar: 'gregory',
    numberingSystem: 'latn',
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(instant));
  const get = (key: string): string =>
    parts.find((part) => part.type === key)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
@Component({
  selector: 'app-calendar-editor',
  imports: [
    TemporalControl,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './calendar-editor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEditor {
  readonly item = input<CalendarItem | null>(null);
  readonly saved = output<CalendarItem>();
  readonly reloadRequested = output<void>();
  readonly reconcileRequired = signal(false);
  readonly reminders = input<Reminder[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  title = '';
  kind: 'timed' | 'all_day' = 'timed';
  timezone = inject(Locale).timezone();
  start = '';
  end = '';
  startChoice = '';
  endChoice = '';
  reminder = 'none';
  readonly uncertain = signal(false);
  private readonly feedback = inject(Feedback);
  private targetRef: string | undefined;
  private readonly api = inject(CALENDAR);
  private generation = 0;
  private pending: CalendarInput | null = null;
  private original = '';
  private signature(): string {
    return JSON.stringify([
      this.title,
      this.kind,
      this.timezone,
      this.start,
      this.end,
      this.startChoice,
      this.endChoice,
      this.reminder,
    ]);
  }
  dirty(): boolean {
    return this.uncertain() || this.signature() !== this.original;
  }
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.clear();
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      release();
    });
    effect(() => {
      const item = this.item();
      untracked(() => this.accept(item));
    });
  }
  private clear(): void {
    this.title = this.start = this.end = this.startChoice = this.endChoice = '';
    this.pending = null;
    this.uncertain.set(false);
    this.reconcileRequired.set(false);
    this.targetRef = undefined;
    this.error.set('');
    this.busy.set(false);
    this.original = this.signature();
  }
  private accept(item: CalendarItem | null): void {
    this.generation++;
    this.clear();
    this.reminder = 'none';
    if (!item || item.schedule.kind === 'deadline') {
      this.original = this.signature();
      return;
    }
    this.reminder = this.reminders().length ? '' : 'none';
    this.title = item.title;
    this.kind = item.schedule.kind;
    this.timezone = item.schedule.timezone;
    if (item.schedule.kind === 'all_day') {
      this.start = item.schedule.start_date;
      this.end = item.schedule.end_date;
    } else {
      this.start = localMinute(item.schedule.start_at, this.timezone);
      this.end = localMinute(item.schedule.end_at, this.timezone);
      this.startChoice = new Date(item.schedule.start_at).toISOString();
      this.endChoice = new Date(item.schedule.end_at).toISOString();
    }
    this.original = this.signature();
  }
  candidates(value: string): string[] {
    try {
      return this.kind === 'timed' && value
        ? localTimeCandidates(value, this.timezone)
        : [];
    } catch {
      return [];
    }
  }
  changeKind(value: unknown): void {
    if (value === 'timed' || value === 'all_day') {
      this.kind = value;
      this.start = this.end = this.startChoice = this.endChoice = '';
    }
  }
  private body(): CalendarInput {
    if (!this.title.trim()) {
      throw Error('Invalid event');
    }
    const original = this.item()?.schedule;
    const unchanged =
      original?.kind === 'timed' &&
      this.kind === 'timed' &&
      original.timezone === this.timezone &&
      localMinute(original.start_at, this.timezone) === this.start &&
      localMinute(original.end_at, this.timezone) === this.end;
    const schedule: CalendarInput['schedule'] = unchanged
      ? original
      : this.kind === 'all_day'
        ? {
            kind: 'all_day',
            timezone: this.timezone,
            start_date: this.start,
            end_date: this.end,
          }
        : {
            kind: 'timed',
            timezone: this.timezone,
            start_at: localTimeToInstant(
              this.start,
              this.timezone,
              this.startChoice,
            ),
            end_at: localTimeToInstant(this.end, this.timezone, this.endChoice),
          };
    if (
      this.kind === 'all_day' &&
      dateMillis(this.end) <= dateMillis(this.start)
    ) {
      throw Error('Invalid interval');
    }
    return {
      title: this.title.trim(),
      schedule: unchanged ? original : schedule,
      work_group_ref_id: this.item()?.work_group_ref_id ?? null,
      reminder_offsets: this.offsets(),
      command_key: crypto.randomUUID(),
    };
  }
  private offsets(): number[] {
    if (this.reminder === 'none') {
      return [];
    }
    if (!['0', '900', '3600'].includes(this.reminder)) {
      throw Error('Select replacement reminders explicitly');
    }
    return [Number(this.reminder)];
  }

  async save(): Promise<void> {
    if (
      this.busy() ||
      this.reconcileRequired() ||
      this.item()?.editable === false
    ) {
      return;
    }
    const generation = this.generation;
    this.error.set('');
    try {
      if (!this.pending) {
        const body = this.body();
        if (
          this.reminders().length &&
          !(await this.feedback.confirm(
            'Replace the existing reminder configuration?',
          ))
        ) {
          return;
        }
        if (generation !== this.generation) {
          return;
        }
        this.pending = body;
        this.targetRef = this.item()?.ref_id;
      }
    } catch {
      this.error.set('Check the highlighted fields before continuing.');
      return;
    }
    this.busy.set(true);
    try {
      const item = await this.api.save(this.pending, this.targetRef);
      if (generation !== this.generation) {
        return;
      }
      this.pending = null;
      this.uncertain.set(false);
      this.saved.emit(item);
    } catch (error) {
      if (generation === this.generation) {
        this.reconcileRequired.set(
          error instanceof ApiFailure && error.httpStatus === 409,
        );
        const uncertain = !knownRejection(error);
        if (!uncertain) {
          this.pending = null;
        }
        this.uncertain.set(uncertain);
        this.error.set(
          'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
