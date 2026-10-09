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
  imports: [TableModule, ButtonModule, LocalizePipe],
  templateUrl: './metric-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCard {
  readonly title = input.required<string>();
  readonly result = input<MetricProjection | null>(null);
  readonly state = input<'loading' | 'ready' | 'failed'>('loading');
  readonly stale = input(false);
  readonly start = input.required<string>();
  readonly end = input.required<string>();
  readonly canDrillDown = input(false);
  readonly drilldown = output<NonNullable<MetricProjection['drilldown']>>();
  private readonly revoked = signal<MetricProjection | null>(null);
  readonly available = computed(
    () =>
      this.state() === 'ready' &&
      this.result() !== null &&
      this.result() !== this.revoked(),
  );
  readonly rows = computed(() =>
    this.available()
      ? this.result()!.series.flatMap((series) =>
          series.buckets.map((bucket) => ({ ...bucket, series: series.key })),
        )
      : [],
  );
  readonly maximum = computed(() =>
    Math.max(1, ...this.rows().map((row) => row.value ?? 0)),
  );
  constructor() {
    const release = inject(ActorState).register(() =>
      this.revoked.set(this.result()),
    );
    inject(DestroyRef).onDestroy(release);
  }
  width(value: number | null): number {
    return value === null ? 0 : (value / this.maximum()) * 100;
  }
  open(): void {
    if (this.available() && this.canDrillDown() && this.result()?.drilldown) {
      this.drilldown.emit(structuredClone(this.result()!.drilldown!));
    }
  }
}
