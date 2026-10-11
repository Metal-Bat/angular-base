import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import { ActivatedRoute } from '@angular/router';
import { WorkReminders } from '../work-reminders/work-reminders';
import { Reminder } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  CalendarEvent,
  CalendarProjection,
} from '../../domain/calendar-events';
import {
  calendarWindow,
  shiftDate,
  zonedDate,
} from '../../domain/calendar-dates';
import { CalendarItem } from '../../application/calendar-port';
import { CalendarViews } from '../calendar-views/calendar-views';
import { CalendarEditor } from '../calendar-editor/calendar-editor';
@Component({
  selector: 'app-calendar-page',
  imports: [
    TemporalControl,
    FormsModule,
    InputTextModule,
    ButtonDirective,
    LocalizePipe,
    CalendarViews,
    CalendarEditor,
    WorkReminders,
  ],
  templateUrl: './calendar-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  private readonly api = inject(CALENDAR);
  private readonly actor = inject(ActorState);
  private readonly locale = inject(Locale);
  private readonly feedback = inject(Feedback);
  readonly projection = signal<CalendarProjection>({
    status: 'loading',
    stale: false,
    events: [],
  });
  readonly selected = signal<CalendarItem | null>(null);
  readonly editing = signal(false);
  private readonly editor = viewChild(CalendarEditor);
  private readonly workEditor = viewChild(WorkReminders);
  readonly reminders = signal<Reminder[]>([]);
  readonly error = signal('');
  readonly anchor = signal(
    zonedDate(new Date().toISOString(), this.locale.timezone()),
  );
  readonly zone = signal(this.locale.timezone());
  date = this.anchor();
  timezone = this.zone();
  private items: CalendarItem[] = [];
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      clearTimeout(this.timer);
      this.items = [];
      this.selected.set(null);
      this.editing.set(false);
      this.reminders.set([]);
      this.projection.set({ status: 'failed', stale: true, events: [] });
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      clearTimeout(this.timer);
      release();
    });
    const ref = inject(ActivatedRoute).snapshot.queryParamMap.get('event');
    void this.initialize(ref);
  }
  private async initialize(ref: string | null): Promise<void> {
    const epoch = this.actor.epoch;
    await this.load();
    if (ref && epoch === this.actor.epoch) {
      await this.openRef(ref);
    }
  }
  async load(): Promise<void> {
    const generation = ++this.generation;
    const date = this.date;
    const timezone = this.timezone;
    this.error.set('');
    this.projection.set({ status: 'loading', stale: false, events: [] });
    try {
      // A bounded union lets display-calendar switches use the same authorized projection.
      const windows = (['gregory', 'persian', 'islamic-civil'] as const).map(
        (calendar) => calendarWindow(date, 'month', calendar),
      );
      const month = {
        start: windows.map((window) => window.start).sort()[0],
        end: windows
          .map((window) => window.end)
          .sort()
          .at(-1)!,
      };
      const items: CalendarItem[] = [];
      const events: CalendarEvent[] = [];
      for (let page = 1; page <= 20; page++) {
        const result = await this.api.search({
          start_date: shiftDate(month.start, -7),
          end_date: shiftDate(month.end, 7),
          timezone,
          include_work_deadlines: true,
          page,
          size: 100,
        });
        if (generation !== this.generation) {
          return;
        }
        result.items.forEach((row) => {
          items.push(row.item);
          events.push(row.event);
        });
        if (page >= result.totalPages) {
          break;
        }
        if (page === 20) {
          throw Error('Calendar window is incomplete');
        }
      }
      this.items = items;
      this.anchor.set(date);
      this.zone.set(timezone);
      this.projection.set({ status: 'ready', stale: false, events });
      clearTimeout(this.timer);
      this.timer = setTimeout(
        () => this.projection.update((value) => ({ ...value, stale: true })),
        30000,
      );
    } catch {
      if (generation === this.generation) {
        this.error.set('The service is unavailable.');
        this.projection.set({ status: 'failed', stale: true, events: [] });
      }
    }
  }
  async create(): Promise<void> {
    const generation = this.generation;
    if (!(await this.canLeave()) || generation !== this.generation) {
      return;
    }
    this.selected.set(null);
    this.reminders.set([]);
    this.editing.set(true);
  }
  async open(event: CalendarEvent): Promise<void> {
    const generation = this.generation;
    if (!(await this.canLeave()) || generation !== this.generation) {
      return;
    }
    const item = this.items.find((row) => row.ref_id === event.key);
    if (!item) {
      return;
    }
    try {
      if (item.route_key === 'work_items') {
        this.selected.set(item);
        this.editing.set(true);
        return;
      }
      await this.openRef(item.ref_id);
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    }
  }
  private async openRef(ref: string): Promise<void> {
    const generation = this.generation;
    try {
      const current = await this.api.detail(ref);
      if (generation !== this.generation) {
        return;
      }
      const reminders = await this.api.reminders(current);
      if (generation !== this.generation) {
        return;
      }
      this.selected.set(current);
      this.reminders.set(reminders);
      this.editing.set(true);
    } catch {
      if (generation === this.generation) {
        this.error.set('This resource is unavailable.');
      }
    }
  }
  async reloadSelected(): Promise<void> {
    const item = this.selected();
    const generation = this.generation;
    if (
      item?.source_kind === 'manual' &&
      (await this.canLeave()) &&
      generation === this.generation
    ) {
      await this.openRef(item.ref_id);
    }
  }
  async saved(item: CalendarItem): Promise<void> {
    this.selected.set(item);
    this.editing.set(false);
    await this.load();
  }
  async remove(): Promise<void> {
    const item = this.selected();
    const generation = this.generation;
    if (
      !item?.editable ||
      !(await this.feedback.confirm('Delete this calendar event?')) ||
      generation !== this.generation
    ) {
      return;
    }
    try {
      await this.api.remove(item.ref_id);
      if (generation === this.generation) {
        this.selected.set(null);
        this.editing.set(false);
        await this.load();
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    }
  }
  async close(): Promise<void> {
    const generation = this.generation;
    if ((await this.canLeave()) && generation === this.generation) {
      this.editing.set(false);
    }
  }
  async canLeave(): Promise<boolean> {
    if (this.editor()?.busy() || this.workEditor()?.busy()) {
      return false;
    }
    return !this.editor()?.dirty() && !this.workEditor()?.dirty()
      ? true
      : this.feedback.confirm('Discard unsaved calendar changes?');
  }
}
