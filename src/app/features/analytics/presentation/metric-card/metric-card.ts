import { Locale } from '../../../../core/localization/locale';
import { metricDate, metricNumber, metricTimestamp } from '../metric-text';
import { shiftDate } from '../../../calendar/domain/calendar-dates';
import { MetricChart } from '../metric-chart/metric-chart';
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
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ActorState } from '../../../../core/auth/actor-state';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { MetricProjection } from '../../domain/metrics';
@Component({
  selector: 'app-metric-card',
  imports: [MetricChart, TableModule, ButtonModule, LocalizePipe],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCard {
  private readonly locale = inject(Locale);
  timestamp(metric: MetricProjection): string {
    return metricTimestamp(this.locale, metric);
  }
  number(value: number, unit: MetricProjection['unit'] = 'count'): string {
    return metricNumber(this.locale, value, unit);
  }
  date(value: string): string {
    return metricDate(this.locale, value);
  }
  readonly title = input.required<string>();
  readonly unavailableReason = input('');
  readonly result = input<MetricProjection | null>(null);
  readonly state = input<'loading' | 'ready' | 'failed'>('loading');
  readonly stale = input(false);
  readonly start = input.required<string>();
  readonly end = input.required<string>();
  readonly inclusiveEnd = computed(() => shiftDate(this.end(), -1));
  readonly canDrillDown = input(false);
  readonly drilldown = output<NonNullable<MetricProjection['drilldown']>>();
  private readonly revoked = signal<MetricProjection | null>(null);
  readonly available = computed(
    () => this.result() !== null && this.result() !== this.revoked(),
  );
  readonly rows = computed(() =>
    this.available()
      ? this.result()!.series.flatMap((series) =>
          series.buckets.map((bucket) => ({
            ...bucket,
            series: series.key === 'total' ? 'Total' : series.key,
          })),
        )
      : [],
  );
  constructor() {
    const release = inject(ActorState).register(() =>
      this.revoked.set(this.result()),
    );
    inject(DestroyRef).onDestroy(release);
  }
  open(): void {
    if (
      this.available() &&
      this.state() === 'ready' &&
      !this.stale() &&
      this.canDrillDown() &&
      this.result()?.drilldown
    ) {
      this.drilldown.emit(structuredClone(this.result()!.drilldown!));
    }
  }
}
