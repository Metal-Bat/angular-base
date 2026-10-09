import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { readMetric } from '../../domain/metrics';
import { MetricCard } from './metric-card';
describe('Metric card lifecycle', () => {
  it('keeps zero distinct from unknown, fences revoked output, and clones drilldown restrictions', async () => {
    const fixture = TestBed.createComponent(MetricCard);
    const result = readMetric({
      metric_key: 'submitted_requests',
      version: 1,
      unit: 'count',
      availability: 'available',
      timezone: 'UTC',
      generated_at: '2026-10-08T08:00:00Z',
      as_of: '2026-10-08T08:00:00Z',
      total_value: 0,
      series: [],
      drilldown: {
        route_key: 'requests',
        query: {
          filters: [
            { field_name: 'status', operation: 'eq', value: 'RUNNING' },
          ],
        },
      },
    });
    for (const [key, value] of Object.entries({
      title: 'Total',
      start: '2026-10-08',
      end: '2026-10-09',
      state: 'ready',
      result,
      canDrillDown: true,
    })) {
      fixture.componentRef.setInput(key, value);
    }
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const output = vi.fn();
    vm.drilldown.subscribe(output);
    vm.open();
    expect(output).toHaveBeenCalledExactlyOnceWith(result.drilldown);
    expect(output.mock.calls[0][0]).not.toBe(result.drilldown);
    expect(fixture.nativeElement.textContent).toContain('0');
    fixture.componentRef.setInput('result', { ...result, total_value: null });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Unknown');
    TestBed.inject(ActorState).reset();
    vm.open();
    expect(output).toHaveBeenCalledTimes(1);
    expect(vm.rows()).toEqual([]);
    expect(vm.available()).toBe(false);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(
      'Metrics are unavailable.',
    );
  });
});
