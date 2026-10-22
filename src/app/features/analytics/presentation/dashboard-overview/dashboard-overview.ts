import {
  metricDate,
  metricNumber,
  metricTimestamp,
  metricUnavailableReason,
} from '../metric-text';
import { shiftDate } from '../../../calendar/domain/calendar-dates';
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
import { ButtonDirective } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { Locale } from '../../../../core/localization/locale';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { ANALYTICS } from '../../bindings';
import {
  MetricDefinition,
  MetricKey,
  MetricQuery,
} from '../../application/analytics-port';
import { MetricProjection, metricTitle } from '../../domain/metrics';

type SummaryState = {
  key: MetricKey;
  state: 'loading' | 'ready' | 'failed' | 'denied' | 'unavailable';
  stale: boolean;
  reason: string;
  result: MetricProjection | null;
  period: MetricQuery | null;
};
const keys: readonly MetricKey[] = [
  'submitted_requests',
  'active_requests',
  'overdue_work',
  'terminal_duration',
];

@Component({
  selector: 'app-dashboard-overview',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOverview {
  readonly query = input.required<MetricQuery>();
  readonly definitions = input.required<readonly MetricDefinition[]>();
  readonly drilldown = output<NonNullable<MetricProjection['drilldown']>>();
  readonly widgets = signal<readonly SummaryState[]>([]);
  readonly metricTitle = metricTitle;
  readonly locale = inject(Locale);
  private readonly api = inject(ANALYTICS);
  private revision = 0;
  private active = 0;
  private queue: MetricKey[] = [];
  private abort = new AbortController();
  private request: MetricQuery | null = null;
  private revoked = false;
  private readonly timers = new Map<MetricKey, ReturnType<typeof setTimeout>>();
  constructor() {
    effect(() => {
      const request = this.query();
      const definitions = this.definitions();
      untracked(() => {
        if (!this.revoked) {
          this.load(request, definitions);
        }
      });
    });
    const release = inject(ActorState).register(() => {
      this.revoked = true;
      this.cancel();
      this.request = null;
      this.widgets.set([]);
    });
    inject(DestroyRef).onDestroy(() => {
      this.revoked = true;
      this.cancel();
      release();
    });
  }
  private cancel(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.revision++;
    this.abort.abort();
    this.abort = new AbortController();
    this.queue = [];
    this.active = 0;
  }
  private load(
    request: MetricQuery,
    definitions: readonly MetricDefinition[],
  ): void {
    this.cancel();
    this.request = structuredClone(request);
    const previous = new Map(
      this.widgets().map((widget) => [widget.key, widget]),
    );
    this.widgets.set(
      keys.map((key) => {
        const definition = definitions.find((item) => item.metric_key === key);
        const available = definition?.availability === 'available';
        if (available) {
          this.queue.push(key);
        }
        return {
          key,
          state: available ? 'loading' : 'unavailable',
          stale: true,
          reason: metricUnavailableReason(definition?.reason),
          result: available ? (previous.get(key)?.result ?? null) : null,
          period: available ? (previous.get(key)?.period ?? null) : null,
        };
      }),
    );
    this.pump();
  }
  private pump(): void {
    // Two overview reads plus the existing chart read: at most three metric reads.
    while (!this.revoked && this.active < 2 && this.queue.length) {
      const key = this.queue.shift()!;
      this.active++;
      void this.read(key, this.revision, this.abort.signal);
    }
  }
  private update(key: MetricKey, patch: Partial<SummaryState>): void {
    this.widgets.update((widgets) =>
      widgets.map((widget) =>
        widget.key === key ? { ...widget, ...patch } : widget,
      ),
    );
  }
  private async read(
    key: MetricKey,
    revision: number,
    abortSignal: AbortSignal,
  ): Promise<void> {
    const request: MetricQuery = {
      ...this.request!,
      metric_key: key,
      dimension: 'none',
    };
    try {
      const result = await this.api.query(request, abortSignal);
      if (revision === this.revision && !abortSignal.aborted) {
        this.update(key, {
          state: 'ready',
          stale: false,
          result,
          period: request,
        });
        clearTimeout(this.timers.get(key));
        this.timers.set(
          key,
          setTimeout(() => {
            if (revision === this.revision) {
              this.update(key, { stale: true });
            }
          }, 30000),
        );
      }
    } catch (error) {
      if (revision === this.revision && !abortSignal.aborted) {
        this.update(key, {
          state:
            error instanceof ApiFailure && error.httpStatus === 403
              ? 'denied'
              : 'failed',
        });
      }
    } finally {
      if (revision === this.revision && !abortSignal.aborted) {
        this.active--;
        this.pump();
      }
    }
  }
  retry(key: MetricKey): void {
    const widget = this.widgets().find((item) => item.key === key);
    if (
      this.revoked ||
      !this.request ||
      !widget ||
      !['failed', 'denied'].includes(widget.state)
    ) {
      return;
    }
    this.update(key, { state: 'loading' });
    this.queue.push(key);
    this.pump();
  }
  value(widget: SummaryState): string {
    const result = widget.result;
    if (!result || result.availability === 'unavailable') {
      return this.locale.text('Unavailable');
    }
    if (result.total_value === null) {
      return this.locale.text(
        result.unit === 'seconds' && result.sample_count === 0
          ? 'No valid samples'
          : 'Unknown',
      );
    }
    return metricNumber(this.locale, result.total_value, result.unit);
  }
  timestamp(metric: MetricProjection): string {
    return metricTimestamp(this.locale, metric);
  }
  date(value: string): string {
    return metricDate(this.locale, value);
  }
  inclusiveEnd(period: MetricQuery): string {
    return shiftDate(period.end_date, -1);
  }
  caption(key: MetricKey): string {
    return key === 'terminal_duration'
      ? 'Valid samples only'
      : key === 'submitted_requests'
        ? 'In date range'
        : 'Current state';
  }
  open(widget: SummaryState): void {
    if (
      widget.state === 'ready' &&
      !widget.stale &&
      widget.result?.availability === 'available' &&
      widget.result.drilldown
    ) {
      this.drilldown.emit(structuredClone(widget.result.drilldown));
    }
  }
}
