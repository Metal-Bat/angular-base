import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Locale } from '../../../../core/localization/locale';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { metricNumber } from '../metric-text';
import { MetricProjection } from '../../domain/metrics';
/** A bounded SVG projection of producer-owned buckets; never fills missing observations. */
@Component({
  selector: 'app-metric-chart',
  imports: [LocalizePipe],
  templateUrl: './metric-chart.html',
  styleUrl: './metric-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricChart {
  readonly metric = input.required<MetricProjection>();
  readonly title = input.required<string>();
  readonly start = input.required<string>();
  readonly end = input.required<string>();
  readonly locale = inject(Locale);
  private static sequence = 0;
  readonly chartId = 'metric-chart-' + ++MetricChart.sequence;
  readonly maximum = computed(() => {
    const highest = Math.max(
      1,
      ...this.metric().series.flatMap((series) =>
        series.buckets.map((bucket) => bucket.value ?? 0),
      ),
    );
    const magnitude = 10 ** Math.floor(Math.log10(highest));
    return Math.ceil(highest / magnitude) * magnitude;
  });
  readonly ticks = computed(() =>
    Array.from({ length: 5 }, (_, i) => (this.maximum() * i) / 4),
  );
  readonly dates = computed(() => {
    const dates = [
      ...new Set(
        this.metric().series.flatMap((series) =>
          series.buckets.map((bucket) => bucket.date),
        ),
      ),
    ].sort();
    // Sparse observations can cluster in a wide date range. Space labels by
    // their actual axis positions rather than by the number of observations.
    const labels: string[] = [];
    for (const date of dates) {
      const previous = labels.at(-1);
      if (!previous || this.x(date) - this.x(previous) >= 128) {
        labels.push(date);
      }
    }
    return labels;
  });
  readonly series = computed(() =>
    this.metric().series.map((series, index) => {
      let path = '';
      let previousKnown = false;
      for (const bucket of series.buckets) {
        if (bucket.value === null) {
          previousKnown = false;
          continue;
        }
        path +=
          (previousKnown ? ' L ' : ' M ') +
          this.x(bucket.date) +
          ' ' +
          this.y(bucket.value);
        previousKnown = true;
      }
      return {
        ...series,
        path,
        dash: ['', '8 4', '2 3', '12 3 2 3', '6 2', '1 4', '10 5', '4 6'][
          index
        ],
        index: index + 1,
      };
    }),
  );
  x(date: string): number {
    const start = Date.parse(this.start() + 'T00:00:00Z');
    const end = Date.parse(this.end() + 'T00:00:00Z');
    return (
      70 +
      ((Date.parse(date + 'T00:00:00Z') - start) /
        Math.max(86400000, end - start - 86400000)) *
        770
    );
  }
  y(value: number): number {
    return 230 - (value / this.maximum()) * 190;
  }
  valueLabel(value: number): string {
    return metricNumber(this.locale, value, this.metric().unit);
  }
  dateLabel(date: string): string {
    return new Intl.DateTimeFormat(this.locale.language(), {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
      calendar: this.locale.calendar(),
      numberingSystem: this.locale.numbering(),
    }).format(new Date(date + 'T12:00:00Z'));
  }
}
