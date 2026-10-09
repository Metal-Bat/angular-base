import { metricWindow, readMetric } from './metrics';
const response = {
  metric_key: 'submitted_requests',
  version: 1,
  unit: 'count',
  availability: 'available',
  timezone: 'UTC',
  generated_at: '2026-10-08T08:00:00Z',
  as_of: '2026-10-08T08:00:00Z',
  total_value: 31,
  series: [
    {
      key: 'all',
      buckets: [
        {
          date: '2026-10-08',
          value: 1,
          population_count: 1,
          sample_count: 1,
          unknown_count: 0,
        },
      ],
    },
  ],
};
describe('Frozen metric presentation adapter', () => {
  it('preserves server totals independently of loaded buckets and separates null from zero', () => {
    expect(readMetric(response).total_value).toBe(31);
    expect(readMetric({ ...response, total_value: 0 }).total_value).toBe(0);
    expect(
      readMetric({
        ...response,
        metric_key: 'terminal_duration',
        unit: 'seconds',
        total_value: null,
      }).total_value,
    ).toBeNull();
    expect(
      readMetric({
        ...response,
        availability: 'unavailable',
        total_value: null,
        series: [],
      }).availability,
    ).toBe('unavailable');
  });
  it('rejects unsupported units, nonfinite values, duplicate dates and arbitrary drilldown destinations', () => {
    expect(() => readMetric({ ...response, unit: 'USD' })).toThrow();
    expect(() => readMetric({ ...response, total_value: Infinity })).toThrow();
    expect(() =>
      readMetric({
        ...response,
        drilldown: { route_key: 'https://unsafe', query: {} },
      }),
    ).toThrow();
    const bucket = response.series[0].buckets[0];
    expect(() =>
      readMetric({
        ...response,
        series: [{ key: 'all', buckets: [bucket, bucket] }],
      }),
    ).toThrow();
  });
  it('clones returned restrictions without deriving a total or discarding a filter', () => {
    const query = {
      page: 1,
      size: 20,
      filters: [{ field_name: 'status', operation: 'eq', value: 'RUNNING' }],
    };
    const metric = readMetric({
      ...response,
      drilldown: { route_key: 'requests', query },
    });
    expect(metric.drilldown?.query).toEqual(query);
    expect(metric.drilldown?.query).not.toBe(query);
  });
  it('enforces exclusive dates and the C10-specific 366-day bound', () => {
    metricWindow('2024-01-01', '2025-01-01', 'America/New_York');
    expect(() => metricWindow('2024-01-01', '2025-01-02', 'UTC')).toThrow();
    expect(() => metricWindow('2026-10-08', '2026-10-08', 'UTC')).toThrow();
    expect(() => metricWindow('2026-10-08', '2026-10-09', 'invalid')).toThrow();
  });
});
