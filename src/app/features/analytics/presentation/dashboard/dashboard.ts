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
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { ListNavigation } from '../../../../core/resources/list-navigation';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { shiftDate, zonedDate } from '../../../calendar/domain/calendar-dates';
import { MetricProjection, metricWindow } from '../../domain/metrics';
import {
  MetricDefinition,
  MetricQuery,
} from '../../application/analytics-port';
import { MetricCard } from '../metric-card/metric-card';
@Component({
  selector: 'app-dashboard',
  imports: [
    TemporalControl,
    FormsModule,
    InputTextModule,
    ButtonDirective,
    SelectControl,
    LocalizePipe,
    MetricCard,
  ],
  templateUrl: './dashboard.html',
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
  readonly range = signal<{ start: string; end: string } | null>(null);
  metric: MetricQuery['metric_key'] = 'submitted_requests';
  start = shiftDate(
    zonedDate(new Date().toISOString(), this.locale.timezone()),
    -30,
  );
  end = shiftDate(
    zonedDate(new Date().toISOString(), this.locale.timezone()),
    1,
  );
  timezone = this.locale.timezone();
  dimension: 'none' | 'status' = 'none';
  readonly stale = signal(false);
  private generation = 0;
  private timer?: ReturnType<typeof setTimeout>;
  private poll?: ReturnType<typeof setInterval>;
  private applied: MetricQuery | null = null;
  private inFlight = false;
  private refreshQueued = false;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.generation++;
      clearTimeout(this.timer);
      clearInterval(this.poll);
      this.applied = null;
      this.inFlight = false;
      this.refreshQueued = false;
      this.catalog.set([]);
      this.result.set(null);
      this.range.set(null);
      this.state.set('failed');
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy(() => {
      this.generation++;
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
      await this.load();
    } catch {
      if (generation === this.generation) {
        this.state.set('failed');
        this.error.set('The service is unavailable.');
      }
    }
  }
  async load(): Promise<void> {
    if (this.inFlight) {
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
      metricWindow(snapshot.start_date, snapshot.end_date, snapshot.timezone);
    } catch {
      this.result.set(null);
      this.state.set('failed');
      this.error.set('Check the highlighted fields before continuing.');
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
    const generation = ++this.generation;
    clearTimeout(this.timer);
    this.stale.set(false);
    this.state.set('loading');
    this.error.set('');
    this.result.set(null);
    try {
      const result = await this.api.query(snapshot);
      if (generation !== this.generation) {
        return;
      }
      this.applied = snapshot;
      this.result.set(result);
      this.timer = setTimeout(() => this.stale.set(true), 30000);
      this.range.set({ start: snapshot.start_date, end: snapshot.end_date });
      this.state.set('ready');
    } catch (error) {
      if (generation === this.generation) {
        this.state.set('failed');
        this.error.set(
          error instanceof ApiFailure && [400, 422].includes(error.httpStatus)
            ? 'Check the highlighted fields before continuing.'
            : 'The service is unavailable.',
        );
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
  async open(value: NonNullable<MetricProjection['drilldown']>): Promise<void> {
    if (this.state() !== 'ready' || !this.result()?.drilldown) {
      return;
    }
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
