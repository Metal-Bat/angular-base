import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { AnalyticsApi, MetricQuery } from './analytics-api';

it('aborts obsolete metric HTTP subscriptions without adding cancellation fields to the wire body', async () => {
  const response = new Subject<unknown>();
  const call = vi.fn(() => response);
  TestBed.configureTestingModule({
    providers: [{ provide: ApiClient, useValue: { call } }],
  });
  const api = TestBed.inject(AnalyticsApi);
  const body: MetricQuery = {
    metric_key: 'submitted_requests',
    start_date: '2026-10-01',
    end_date: '2026-10-15',
    timezone: 'UTC',
    dimension: 'none',
    granularity: 'day',
  };
  const abort = new AbortController();
  const pending = api.query(body, abort.signal);
  expect(response.observed).toBe(true);
  expect(call).toHaveBeenCalledExactlyOnceWith(
    'query_metrics_api_v1_analytics_query_post',
    { body },
  );
  const cancelled = expect(pending).rejects.toThrow();
  abort.abort();
  await cancelled;
  expect(response.observed).toBe(false);
  await expect(api.query(body, abort.signal)).rejects.toThrow();
  expect(call).toHaveBeenCalledTimes(1);
});
