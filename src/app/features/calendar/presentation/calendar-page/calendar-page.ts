import { LocalizedDateTimePipe } from '../../../../shared/ui/localized-datetime-pipe';
import { CalendarFocus } from '../calendar-focus';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CalendarDraft } from '../../domain/calendar-draft';
import { knownRejection } from '../../../../core/transport/api-failure';
import { CalendarActivation } from '../calendar-activation';
import { CalendarEventDetails } from '../calendar-event-details/calendar-event-details';
import {
  calendarProjectionQuery,
  loadCalendarWindow,
} from '../../application/load-calendar-window';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
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
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import {
  CalendarEvent,
  CalendarProjection,
} from '../../domain/calendar-events';
import { zonedDate } from '../../domain/calendar-dates';
import { CalendarItem } from '../../application/calendar-port';
import { CalendarViews } from '../calendar-views/calendar-views';
import { CalendarEditor } from '../calendar-editor/calendar-editor';
@Component({
  selector: 'app-calendar-page',
  providers: [CalendarFocus],
  imports: [
    LocalizedDateTimePipe,
    ControlField,
    TemporalControl,
    RouterLink,
    ButtonDirective,
    LocalizePipe,
    CalendarViews,
    CalendarEventDetails,
    CalendarEditor,
    WorkReminders,
  ],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPage {
  private readonly focus = inject(CalendarFocus);
  private readonly api = inject(CALENDAR);
  private readonly actor = inject(ActorState);
  private readonly locale = inject(Locale);
  private readonly feedback = inject(Feedback);
  readonly projection = signal<CalendarProjection>({
    status: 'loading',
    stale: false,
    events: [],
  });
  readonly selectionBusy = signal(false);
  private selectionGeneration = 0;
  private routeGeneration = 0;
  readonly selected = signal<CalendarItem | null>(null);
  readonly editing = signal(false);
  readonly draft = signal<CalendarDraft | null>(null);
  readonly deleting = signal(false);
  readonly reconcileRequired = signal(false);
  private readonly details = viewChild(CalendarEventDetails);
  private readonly editor = viewChild(CalendarEditor);
  private readonly workEditor = viewChild(WorkReminders);
  readonly reminders = signal<Reminder[]>([]);
  readonly error = signal('');
  readonly anchor = signal(
    zonedDate(new Date().toISOString(), this.locale.timezone()),
  );
  readonly zone = signal(this.locale.timezone());
  date = this.anchor();
  private items: CalendarItem[] = [];
  private generation = 0;
  private searchController?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.selectionGeneration++;
      this.routeGeneration++;
      this.selectionBusy.set(false);
      this.searchController?.abort();
      clearTimeout(this.timer);
      this.items = [];
      this.selected.set(null);
      this.draft.set(null);
      this.editing.set(false);
      this.reminders.set([]);
      this.projection.set({ status: 'failed', stale: true, events: [] });
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      this.selectionGeneration++;
      this.routeGeneration++;
      this.selectionBusy.set(false);
      this.searchController?.abort();
      clearTimeout(this.timer);
      release();
    });
    const initialLoad = this.load();
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        void this.selectFromRoute(params.get('event'), initialLoad);
      });
  }
  private async selectFromRoute(
    ref: string | null,
    initialLoad: Promise<void>,
  ): Promise<void> {
    const route = ++this.routeGeneration;
    const epoch = this.actor.epoch;
    if (!ref && route === 1) {
      return;
    }
    await initialLoad;
    if (
      !(await this.canLeave()) ||
      route !== this.routeGeneration ||
      epoch !== this.actor.epoch
    ) {
      return;
    }
    this.selectionGeneration++;
    this.selectionBusy.set(false);
    if (ref) {
      await this.openRef(ref);
    } else {
      this.editing.set(false);
      this.selected.set(null);
      this.draft.set(null);
      this.reminders.set([]);
    }
  }
  async load(date = this.date): Promise<void> {
    const timezone = this.locale.timezone();
    this.selectionGeneration++;
    this.selectionBusy.set(false);
    const generation = ++this.generation;
    this.searchController?.abort();
    this.details()?.close();
    const controller = new AbortController();
    this.searchController = controller;
    clearTimeout(this.timer);
    this.error.set('');
    this.projection.set({ status: 'loading', stale: false, events: [] });
    try {
      const result = await loadCalendarWindow(
        this.api,
        calendarProjectionQuery(date, timezone),
        controller.signal,
      );
      if (generation !== this.generation) {
        return;
      }
      if (result.complete) {
        this.reconcileRequired.set(false);
      }
      this.items = result.rows.map((row) => row.item);
      this.anchor.set(date);
      this.zone.set(timezone);
      this.projection.set({
        status: result.complete ? 'ready' : 'partial',
        stale: !result.complete,
        events: result.rows.map((row) => row.event),
      });
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
  async changePeriod(date: string): Promise<void> {
    if (!date) {
      return;
    }
    const generation = this.generation;
    if (!(await this.canLeave()) || generation !== this.generation) {
      return;
    }
    this.editing.set(false);
    this.selected.set(null);
    this.reminders.set([]);
    this.date = date;
    await this.load();
  }
  async create(draft: CalendarDraft | null = null): Promise<void> {
    const generation = this.generation;
    if (!(await this.canLeave()) || generation !== this.generation) {
      return;
    }
    this.selectionGeneration++;
    this.selectionBusy.set(false);
    this.focus.capture();
    this.selected.set(null);
    this.draft.set(draft);
    this.reminders.set([]);
    this.editing.set(true);
    this.focus.editor();
  }
  showDetails(activation: CalendarActivation): void {
    const item = this.items.find((row) => row.ref_id === activation.event.key);
    if (item && !this.editing() && !this.deleting()) {
      this.focus.capture(activation.trigger);
      this.details()?.show(activation, item, this.zone());
    }
  }
  async deleteFromDetails(event: Pick<CalendarEvent, 'key'>): Promise<boolean> {
    const item = this.items.find((row) => row.ref_id === event.key);
    if (
      !item?.editable ||
      item.source_kind !== 'manual' ||
      this.deleting() ||
      this.reconcileRequired()
    ) {
      return false;
    }
    const generation = this.generation;
    this.deleting.set(true);
    let dispatched = false;
    try {
      const current = await this.api.detail(item.ref_id);
      if (
        generation !== this.generation ||
        !current.editable ||
        current.source_kind !== 'manual'
      ) {
        return false;
      }
      if (
        !(await this.feedback.confirm('Delete this calendar event?')) ||
        generation !== this.generation
      ) {
        return false;
      }
      dispatched = true;
      await this.api.remove(current.ref_id);
      if (generation === this.generation) {
        this.details()?.close();
        await this.load();
        return true;
      }
    } catch (error) {
      if (generation === this.generation) {
        this.reconcileRequired.set(dispatched && !knownRejection(error));
        this.error.set(
          dispatched
            ? 'The command could not be confirmed. Refresh current state before retrying.'
            : 'This resource is unavailable.',
        );
        this.details()?.close();
      }
    } finally {
      this.deleting.set(false);
    }
    return false;
  }
  async open(event: CalendarEvent): Promise<void> {
    const generation = this.generation;
    if (!(await this.canLeave()) || generation !== this.generation) {
      return;
    }
    this.focus.capture();
    const item = this.items.find((row) => row.ref_id === event.key);
    if (!item) {
      return;
    }
    try {
      if (item.route_key === 'work_items') {
        this.selectionGeneration++;
        this.selectionBusy.set(false);
        this.reminders.set([]);
        this.selected.set(item);
        this.editing.set(true);
        this.focus.editor(true);
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
    const selection = ++this.selectionGeneration;
    this.selectionBusy.set(true);
    if (this.selected()?.ref_id !== ref) {
      this.selected.set(null);
      this.editing.set(false);
      this.draft.set(null);
      this.reminders.set([]);
    }
    try {
      const current = await this.api.detail(ref);
      if (
        generation !== this.generation ||
        selection !== this.selectionGeneration
      ) {
        return;
      }
      const reminders = await this.api.reminders(current);
      if (
        generation !== this.generation ||
        selection !== this.selectionGeneration
      ) {
        return;
      }
      this.selected.set(current);
      this.reminders.set(reminders);
      this.editing.set(true);
      this.focus.editor();
    } catch {
      if (
        generation === this.generation &&
        selection === this.selectionGeneration
      ) {
        this.error.set('This resource is unavailable.');
      }
    } finally {
      if (selection === this.selectionGeneration) {
        this.selectionBusy.set(false);
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
    this.focus.restore();
  }
  async remove(): Promise<void> {
    const item = this.selected();
    if (item && (await this.deleteFromDetails({ key: item.ref_id }))) {
      this.selected.set(null);
      this.editing.set(false);
      this.focus.restore();
    }
  }
  async close(): Promise<void> {
    const generation = this.generation;
    if ((await this.canLeave()) && generation === this.generation) {
      this.selectionGeneration++;
      this.selectionBusy.set(false);
      this.editing.set(false);
      this.focus.restore();
    }
  }
  async canLeave(): Promise<boolean> {
    if (this.deleting() || this.editor()?.busy() || this.workEditor()?.busy()) {
      return false;
    }
    return !this.editor()?.dirty() && !this.workEditor()?.dirty()
      ? true
      : this.feedback.confirm('Discard unsaved calendar changes?');
  }
}
