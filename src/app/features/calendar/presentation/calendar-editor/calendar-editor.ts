import { CalendarDraft } from '../../domain/calendar-draft';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
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
import { RouterLink } from '@angular/router';
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
    ControlField,
    RouterLink,
    TemporalControl,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    SelectControl,
    LocalizePipe,
  ],
  templateUrl: './calendar-editor.html',
  styleUrl: './calendar-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarEditor {
  readonly item = input<CalendarItem | null>(null);
  readonly draft = input<CalendarDraft | null>(null);
  readonly saved = output<CalendarItem>();
  readonly cancelled = output<void>();
  readonly removeRequested = output<void>();
  readonly reloadRequested = output<void>();
  readonly reconcileRequired = signal(false);
  readonly reminders = input<Reminder[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  title = '';
  kind: 'timed' | 'all_day' = 'timed';
  private readonly locale = inject(Locale);
  timezone = this.locale.timezone();
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
      const draft = this.draft();
      untracked(() => this.accept(item, draft));
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
  private accept(item: CalendarItem | null, draft: CalendarDraft | null): void {
    this.generation++;
    this.clear();
    this.reminder = 'none';
    // Capture the user's saved zone for this draft. Later preference changes
    // must not reinterpret unfinished wall times or an uncertain command.
    this.timezone = this.locale.timezone();
    if (!item && draft) {
      this.kind = draft.kind;
      this.start = draft.start;
      this.end = draft.end;
    }
    if (!item || item.schedule.kind === 'deadline') {
      this.original = this.signature();
      return;
    }
    // Delivery history is not the event's active reminder configuration.
    this.reminder = '';
    this.title = item.title;
    this.kind = item.schedule.kind;
    if (item.schedule.kind === 'all_day') {
      // Date-only schedules retain their original civil dates and zone.
      this.timezone = item.schedule.timezone;
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
    const schedule = this.eventSchedule();
    if (
      this.kind === 'all_day' &&
      dateMillis(this.end) <= dateMillis(this.start)
    ) {
      throw Error('Invalid interval');
    }
    return {
      title: this.title.trim(),
      schedule,
      work_group_ref_id: this.item()?.work_group_ref_id ?? null,
      reminder_offsets: this.offsets(),
      command_key: crypto.randomUUID(),
    };
  }
  private eventSchedule(): CalendarInput['schedule'] {
    if (this.kind === 'all_day') {
      return {
        kind: 'all_day',
        timezone: this.timezone,
        start_date: this.start,
        end_date: this.end,
      };
    }
    const original = this.item()?.schedule;
    const sameStart =
      original?.kind === 'timed' &&
      localMinute(original.start_at, this.timezone) === this.start &&
      this.startChoice === new Date(original.start_at).toISOString();
    const sameEnd =
      original?.kind === 'timed' &&
      localMinute(original.end_at, this.timezone) === this.end &&
      this.endChoice === new Date(original.end_at).toISOString();
    if (original?.kind === 'timed' && sameStart && sameEnd) {
      return original;
    }
    return {
      kind: 'timed',
      timezone: this.timezone,
      start_at:
        sameStart && original?.kind === 'timed'
          ? original.start_at
          : localTimeToInstant(this.start, this.timezone, this.startChoice),
      end_at:
        sameEnd && original?.kind === 'timed'
          ? original.end_at
          : localTimeToInstant(this.end, this.timezone, this.endChoice),
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
          this.item() &&
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
