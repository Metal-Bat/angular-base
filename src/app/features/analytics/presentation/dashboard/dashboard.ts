import { metricUnavailableReason } from '../metric-text';
import { DashboardOverview } from '../dashboard-overview/dashboard-overview';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { TemporalControl } from '../../../../shared/ui/temporal-control/temporal-control';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { metricTitle } from '../../domain/metrics';
import { ANALYTICS } from '../../bindings';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { ListNavigation } from '../../../../core/resources/list-navigation';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import {
  shiftDate,
  validateZone,
  zonedDate,
} from '../../../calendar/domain/calendar-dates';
import {
  MetricProjection,
  metricWindow,
  MetricWindowError,
} from '../../domain/metrics';
import {
  MetricDefinition,
  MetricQuery,
} from '../../application/analytics-port';
import { MetricCard } from '../metric-card/metric-card';
@Component({
  selector: 'app-dashboard',
  imports: [
    DashboardOverview,
    RouterLink,
    ControlField,
    TemporalControl,
    FormsModule,
    ButtonDirective,
    SelectControl,
    LocalizePipe,
    MetricCard,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  readonly metricTitle = metricTitle;
  private readonly api = inject(ANALYTICS);
  private readonly locale = inject(Locale);
  private readonly router = inject(Router);
  private readonly navigation = inject(ListNavigation);
  private readonly document = inject(DOCUMENT);
  readonly catalog = signal<readonly MetricDefinition[]>([]);
  readonly result = signal<MetricProjection | null>(null);
  readonly state = signal<'loading' | 'ready' | 'failed'>('loading');
  readonly error = signal('');
  readonly rangeError = signal('');
  readonly zoneError = signal('');
  readonly summaryQuery = signal<MetricQuery | null>(null);
  period: 'today' | 'week' | 'month' | 'custom' = 'month';
  readonly range = signal<{ start: string; end: string } | null>(null);
  metric: MetricQuery['metric_key'] = 'submitted_requests';
  start = shiftDate(
    zonedDate(new Date().toISOString(), this.locale.timezone()),
    -29,
  );
  end = shiftDate(
    zonedDate(new Date().toISOString(), this.locale.timezone()),
    1,
  );
  get timezone(): string {
    return this.locale.timezone();
  }
  dimension: 'none' | 'status' = 'none';
  readonly stale = signal(false);
  private generation = 0;
  private abort = new AbortController();
  private timer?: ReturnType<typeof setTimeout>;
  private poll?: ReturnType<typeof setInterval>;
  private applied: MetricQuery | null = null;
  private inFlight = false;
  private refreshQueued = false;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      this.abort.abort();
      clearTimeout(this.timer);
      clearInterval(this.poll);
      this.applied = null;
      this.inFlight = false;
      this.refreshQueued = false;
      this.summaryQuery.set(null);
      this.catalog.set([]);
      this.result.set(null);
      this.range.set(null);
      this.state.set('failed');
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
      this.abort.abort();
      clearTimeout(this.timer);
      clearInterval(this.poll);
      release();
    });
    this.poll = setInterval(() => {
      if (
        this.applied &&
        this.state() !== 'loading' &&
        this.document.visibilityState === 'visible'
      ) {
        void this.refresh(this.applied);
      }
    }, 60000);
    const notifications = inject(NotificationPreview);
    let revision = notifications.revision();
    effect(() => {
      const next = notifications.revision();
      if (next === revision) {
        return;
      }
      revision = next;
      untracked(() => {
        if (this.applied) {
          this.refreshApplied();
        }
      });
    });
    void this.initialize();
  }
  private async initialize(): Promise<void> {
    const generation = this.generation;
    try {
      const catalog = await this.api.catalog();
      if (generation !== this.generation) {
        return;
      }
      this.catalog.set(catalog);
      if (!catalog.some((item) => item.metric_key === this.metric)) {
        const first = catalog.find((item) => item.availability === 'available');
        if (first) {
          this.metric = first.metric_key;
        }
      }
      await this.load();
    } catch {
      if (generation === this.generation) {
        this.state.set('failed');
        this.error.set('The service is unavailable.');
      }
    }
  }
  get lastDay(): string {
    try {
      return shiftDate(this.end, -1);
    } catch {
      return this.end;
    }
  }
  set lastDay(value: string) {
    this.period = 'custom';
    try {
      this.end = shiftDate(value, 1);
    } catch {
      this.end = value;
    }
  }
  setPreset(value: unknown): void {
    if (!['today', 'week', 'month', 'custom'].includes(String(value))) {
      return;
    }
    this.period = value as typeof this.period;
    if (this.period === 'custom') {
      return;
    }
    try {
      const today = zonedDate(new Date().toISOString(), this.timezone);
      this.start = shiftDate(
        today,
        this.period === 'week' ? -6 : this.period === 'month' ? -29 : 0,
      );
      this.end = shiftDate(today, 1);
    } catch {
      this.zoneError.set('Choose a supported timezone.');
      this.invalidInput();
    }
  }
  private invalidInput(): void {
    this.stale.set(this.result() !== null);
    this.state.set('failed');
    this.error.set('Check the highlighted fields before continuing.');
    this.document
      .getElementById(
        this.zoneError() ? 'metric-zone-settings' : 'metric-start',
      )
      ?.focus();
  }
  async load(): Promise<void> {
    if (this.inFlight) {
      return;
    }
    this.rangeError.set('');
    this.zoneError.set('');
    if (!this.catalog().some((item) => item.metric_key === this.metric)) {
      this.stale.set(this.result() !== null);
      this.state.set('failed');
      this.error.set('Metrics are unavailable.');
      return;
    }
    const snapshot: MetricQuery = {
      metric_key: this.metric,
      start_date: this.start,
      end_date: this.end,
      timezone: this.timezone,
      dimension: this.dimension,
      granularity: 'day',
    };
    try {
      validateZone(snapshot.timezone);
    } catch {
      this.zoneError.set('Choose a supported timezone.');
      this.invalidInput();
      return;
    }
    try {
      metricWindow(snapshot.start_date, snapshot.end_date, snapshot.timezone);
    } catch (error) {
      this.rangeError.set(
        error instanceof MetricWindowError
          ? 'This range includes a midnight that does not exist in the selected timezone. Choose different dates.'
          : 'Choose a date range of 1 to 366 days.',
      );
      this.invalidInput();
      return;
    }
    await this.refresh(snapshot);
  }
  private refreshApplied(): void {
    if (!this.applied) {
      return;
    }
    if (this.inFlight) {
      this.refreshQueued = true;
      return;
    }
    void this.refresh(this.applied);
  }
  private async refresh(snapshot: MetricQuery): Promise<void> {
    this.inFlight = true;
    this.summaryQuery.set(structuredClone(snapshot));
    const generation = ++this.generation;
    this.abort.abort();
    this.abort = new AbortController();
    clearTimeout(this.timer);
    this.stale.set(this.result() !== null);
    this.state.set('loading');
    this.error.set('');
    try {
      const result = await this.api.query(snapshot, this.abort.signal);
      if (generation !== this.generation) {
        return;
      }
      this.applied = snapshot;
      this.result.set(result);
      this.stale.set(false);
      this.timer = setTimeout(() => this.stale.set(true), 30000);
      this.range.set({ start: snapshot.start_date, end: snapshot.end_date });
      this.state.set('ready');
    } catch (error) {
      if (generation === this.generation) {
        this.state.set('failed');
        if (
          error instanceof ApiFailure &&
          [400, 422].includes(error.httpStatus)
        ) {
          for (const issue of error.issues) {
            const field = issue.pointer.split('/').at(-1);
            if (field === 'timezone') {
              this.zoneError.set('Choose a supported timezone.');
            }
            if (field === 'start_date' || field === 'end_date') {
              this.rangeError.set('Choose a date range of 1 to 366 days.');
            }
          }
          this.error.set(
            this.zoneError() || this.rangeError()
              ? 'Check the highlighted fields before continuing.'
              : 'Check the filter settings before continuing.',
          );
        } else {
          this.error.set('The service is unavailable.');
        }
      }
    } finally {
      if (generation === this.generation) {
        this.inFlight = false;
        if (this.refreshQueued) {
          this.refreshQueued = false;
          this.refreshApplied();
        }
      }
    }
  }
  unavailableReason(): string {
    return metricUnavailableReason(
      this.catalog().find(
        (item) => item.metric_key === this.result()?.metric_key,
      )?.reason,
    );
  }
  async open(value: NonNullable<MetricProjection['drilldown']>): Promise<void> {
    if (this.state() !== 'ready' || this.stale() || !this.result()?.drilldown) {
      return;
    }
    await this.openSummary(value);
  }
  async openSummary(
    value: NonNullable<MetricProjection['drilldown']>,
  ): Promise<void> {
    // The descriptor is producer-owned and is reauthorized by the existing list endpoint.
    this.navigation.set(value);
    const moved = await this.router.navigate([
      value.route_key === 'requests'
        ? '/operations/requests'
        : '/operations/tasks',
    ]);
    if (!moved) {
      this.navigation.take(value.route_key);
    }
  }
}
