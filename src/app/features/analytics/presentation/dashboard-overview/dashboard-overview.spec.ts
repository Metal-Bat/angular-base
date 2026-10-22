import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { ApiFailure } from '../../../../core/transport/api-failure';
import {
  MetricDefinition,
  MetricQuery,
} from '../../application/analytics-port';
import { ANALYTICS } from '../../bindings';
import {
  metricCatalog,
  MetricProjection,
  readMetric,
} from '../../domain/metrics';
import { DashboardOverview } from './dashboard-overview';

const request: MetricQuery = {
  metric_key: 'submitted_requests',
  start_date: '2026-10-01',
  end_date: '2026-10-15',
  timezone: 'UTC',
  dimension: 'none',
  granularity: 'day',
};
const definitions = metricCatalog as MetricDefinition[];
function projection(
  body: MetricQuery,
  value: number | null = 0,
): MetricProjection {
  return readMetric({
    metric_key: body.metric_key,
    version: 1,
    unit: body.metric_key === 'terminal_duration' ? 'seconds' : 'count',
    availability: 'available',
    timezone: body.timezone,
    generated_at: '2026-10-14T08:00:00Z',
    as_of: '2026-10-14T08:00:00Z',
    total_value: value,
    population_count: 0,
    sample_count: 0,
    unknown_count: 0,
    series: [],
    drilldown: {
      route_key: 'requests',
      query: { page: 1, size: 20, filters: [], sort_orders: [] },
    },
  });
}
async function setup(
  query: (body: MetricQuery, signal?: AbortSignal) => Promise<MetricProjection>,
): Promise<{
  fixture: ComponentFixture<DashboardOverview>;
  vm: DashboardOverview;
}> {
  TestBed.configureTestingModule({
    providers: [{ provide: ANALYTICS, useValue: { query } }],
  });
  const fixture = TestBed.createComponent(DashboardOverview);
  fixture.componentRef.setInput('query', request);
  fixture.componentRef.setInput('definitions', definitions);
  await fixture.whenStable();
  return { fixture, vm: fixture.componentInstance };
}

describe('Authorized dashboard overview', () => {
  afterEach(() => vi.useRealTimers());
  it('bounds overview concurrency to two and aborts obsolete reads before starting another period', async () => {
    const reads: {
      body: MetricQuery;
      signal?: AbortSignal;
      finish: (value: MetricProjection) => void;
    }[] = [];
    const { fixture, vm } = await setup(
      (body, signal) =>
        new Promise((finish) => reads.push({ body, signal, finish })),
    );
    expect(reads).toHaveLength(2);
    reads[0].finish(projection(reads[0].body));
    await vi.waitFor(() => expect(reads).toHaveLength(3));
    const next = { ...request, start_date: '2026-10-07' };
    fixture.componentRef.setInput('query', next);
    await fixture.whenStable();
    expect(reads).toHaveLength(5);
    expect(reads.slice(0, 3).every((read) => read.signal?.aborted)).toBe(true);
    reads[1].finish(projection(reads[1].body, 99));
    reads[2].finish(projection(reads[2].body, 99));
    await fixture.whenStable();
    expect(
      vm.widgets().some((widget) => widget.result?.total_value === 99),
    ).toBe(false);
    expect(
      reads.slice(3).every((read) => read.body.start_date === next.start_date),
    ).toBe(true);
    fixture.destroy();
    expect(reads.slice(3).every((read) => read.signal?.aborted)).toBe(true);
  });
  it('retains confirmed data on failure, retries one metric and expires drill-down', async () => {
    let failing = false;
    const query = vi.fn(async (body: MetricQuery) => {
      if (failing && body.metric_key === 'submitted_requests') {
        throw new ApiFailure(503, null, null, []);
      }
      return projection(body, 7);
    });
    const { fixture, vm } = await setup(query);
    await vi.waitFor(() =>
      expect(vm.widgets().every((widget) => widget.state === 'ready')).toBe(
        true,
      ),
    );
    fixture.detectChanges();
    expect(
      fixture.nativeElement
        .querySelector('time[datetime="2026-10-14"]')
        .textContent.trim(),
    ).toBe('Oct 14, 2026');
    failing = true;
    fixture.componentRef.setInput('query', {
      ...request,
      start_date: '2026-10-07',
    });
    await fixture.whenStable();
    await vi.waitFor(() => expect(vm.widgets()[0].state).toBe('failed'));
    expect(vm.widgets()[0].result?.total_value).toBe(7);
    expect(vm.widgets()[0].period?.start_date).toBe(request.start_date);
    expect(vm.widgets()[0].stale).toBe(true);
    const count = query.mock.calls.length;
    failing = false;
    vm.retry('submitted_requests');
    await vi.waitFor(() => expect(vm.widgets()[0].state).toBe('ready'));
    expect(query).toHaveBeenCalledTimes(count + 1);
    expect(vm.widgets()[0].period?.start_date).toBe('2026-10-07');
    const emitted = vi.fn();
    vm.drilldown.subscribe(emitted);
    vm.open(vm.widgets()[0]);
    expect(emitted).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();
    fixture.componentRef.setInput('query', { ...request });
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(30000);
    expect(vm.widgets().every((widget) => widget.stale)).toBe(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Results may be out of date.',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Open matching records',
    );
    vm.open(vm.widgets()[0]);
    expect(emitted).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('distinguishes zero, no samples and unavailable without querying absent metrics', async () => {
    const query = vi.fn(async (body: MetricQuery) =>
      projection(body, body.metric_key === 'terminal_duration' ? null : 0),
    );
    const { fixture, vm } = await setup(query);
    await vi.waitFor(() =>
      expect(vm.widgets().every((widget) => widget.state === 'ready')).toBe(
        true,
      ),
    );
    expect(vm.value(vm.widgets()[0])).toBe('0');
    expect(vm.value(vm.widgets()[3])).toBe('No valid samples');
    query.mockClear();
    fixture.componentRef.setInput(
      'definitions',
      definitions.filter(
        (definition) => definition.metric_key === 'submitted_requests',
      ),
    );
    await fixture.whenStable();
    await vi.waitFor(() => expect(query).toHaveBeenCalledTimes(1));
    expect(
      vm
        .widgets()
        .slice(1)
        .every(
          (widget) => widget.state === 'unavailable' && widget.result === null,
        ),
    ).toBe(true);
    TestBed.inject(ActorState).reset();
    expect(vm.widgets()).toEqual([]);
    fixture.componentRef.setInput('query', { ...request });
    await fixture.whenStable();
    expect(query).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
});
