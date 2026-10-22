import { Locale } from '../../../../core/localization/locale';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { ANALYTICS } from '../../bindings';
import { MetricDefinition } from '../../application/analytics-port';
import { metricCatalog, readMetric } from '../../domain/metrics';
import { Dashboard } from './dashboard';

describe('Applied dashboard refresh ownership', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  it('coalesces notifications during a query without overlap or replacing draft filters', async () => {
    vi.useFakeTimers();
    const result = readMetric({
      metric_key: 'submitted_requests',
      version: 1,
      unit: 'count',
      availability: 'available',
      timezone: 'UTC',
      generated_at: '2026-10-09T08:00:00Z',
      as_of: '2026-10-09T08:00:00Z',
      total_value: 0,
      series: [],
      drilldown: null,
    });
    const query = vi.fn().mockResolvedValue(result);
    const revision = signal(0);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ANALYTICS,
          useValue: {
            catalog: (): Promise<MetricDefinition[]> =>
              Promise.resolve(metricCatalog as MetricDefinition[]),
            query,
          },
        },
        { provide: NotificationPreview, useValue: { revision } },
      ],
    });
    const dashboard = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    expect(query).toHaveBeenCalledTimes(1);
    const applied = { ...query.mock.calls[0][0] };
    let finish!: (value: typeof result) => void;
    query.mockImplementationOnce(
      () =>
        new Promise<typeof result>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = dashboard.load();
    dashboard.start = '2025-01-01';
    revision.set(1);
    TestBed.tick();
    revision.set(2);
    TestBed.tick();
    expect(query).toHaveBeenCalledTimes(2);
    finish(result);
    await pending;
    await vi.advanceTimersByTimeAsync(0);
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[2][0]).toEqual(applied);
    expect(dashboard.start).toBe('2025-01-01');
  });
  it('uses exact civil presets and serializes an inclusive custom end as exclusive', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T10:00:00Z'));
    const query = vi.fn().mockResolvedValue(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ANALYTICS,
          useValue: {
            catalog: (): Promise<MetricDefinition[]> =>
              Promise.resolve(metricCatalog as MetricDefinition[]),
            query,
          },
        },
        { provide: NotificationPreview, useValue: { revision: signal(0) } },
      ],
    });
    const vm = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    TestBed.inject(Locale).timezone.set('America/New_York');
    vm.setPreset('today');
    expect([vm.start, vm.end]).toEqual(['2026-03-08', '2026-03-09']);
    vm.setPreset('week');
    expect([vm.start, vm.end]).toEqual(['2026-03-02', '2026-03-09']);
    vm.setPreset('month');
    expect([vm.start, vm.end, vm.lastDay]).toEqual([
      '2026-02-07',
      '2026-03-09',
      '2026-03-08',
    ]);
    vm.start = '2026-11-01';
    vm.lastDay = '2026-11-02';
    await vm.load();
    expect(query.mock.calls.at(-1)?.[0]).toEqual({
      metric_key: 'submitted_requests',
      start_date: '2026-11-01',
      end_date: '2026-11-03',
      timezone: 'America/New_York',
      dimension: 'none',
      granularity: 'day',
    });
    expect(vm.period).toBe('custom');
    expect(query.mock.calls.at(-1)?.[1]).toBeInstanceOf(AbortSignal);
    TestBed.inject(ActorState).reset();
    expect(query.mock.calls.at(-1)?.[1].aborted).toBe(true);
  });
  it('does not request a guessed metric when the authorized catalog is empty', async () => {
    vi.useFakeTimers();
    const query = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ANALYTICS,
          useValue: {
            catalog: (): Promise<MetricDefinition[]> => Promise.resolve([]),
            query,
          },
        },
        { provide: NotificationPreview, useValue: { revision: signal(0) } },
      ],
    });
    const vm = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    expect(query).not.toHaveBeenCalled();
    expect(vm.state()).toBe('failed');
    expect(vm.result()).toBeNull();
    expect(vm.error()).toBe('Metrics are unavailable.');
  });
  it('separates service failure from local date validation without displaying a zero', async () => {
    vi.useFakeTimers();
    const query = vi
      .fn()
      .mockRejectedValue(new ApiFailure(503, null, null, []));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ANALYTICS,
          useValue: {
            catalog: (): Promise<MetricDefinition[]> =>
              Promise.resolve(metricCatalog as MetricDefinition[]),
            query,
          },
        },
        { provide: NotificationPreview, useValue: { revision: signal(0) } },
      ],
    });
    const dashboard = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    expect(dashboard.state()).toBe('failed');
    expect(dashboard.error()).toBe('The service is unavailable.');
    expect(dashboard.result()).toBeNull();
    dashboard.start = 'invalid-date';
    await dashboard.load();
    expect(query).toHaveBeenCalledTimes(1);
    expect(dashboard.error()).toBe(
      'Check the highlighted fields before continuing.',
    );
    expect(dashboard.result()).toBeNull();
    expect(dashboard.rangeError()).toBe(
      'Choose a date range of 1 to 366 days.',
    );
    dashboard.start = '2026-10-01';
    TestBed.inject(Locale).timezone.set('Invalid/Zone');
    await dashboard.load();
    expect(query).toHaveBeenCalledTimes(1);
    expect(dashboard.zoneError()).toBe('Choose a supported timezone.');
    expect(dashboard.rangeError()).toBe('');
    TestBed.inject(Locale).timezone.set('Pacific/Apia');
    dashboard.start = '2011-12-29';
    dashboard.end = '2012-01-02';
    await dashboard.load();
    expect(query).toHaveBeenCalledTimes(1);
    expect(dashboard.rangeError()).toContain('midnight that does not exist');
    expect(dashboard.start).toBe('2011-12-29');
    expect(dashboard.end).toBe('2012-01-02');
  });
  it('retains the confirmed period and data through refresh failure, then clears them on actor change', async () => {
    vi.useFakeTimers();
    const result = readMetric({
      metric_key: 'submitted_requests',
      version: 1,
      unit: 'count',
      availability: 'available',
      timezone: 'UTC',
      generated_at: '2026-10-09T08:00:00Z',
      as_of: '2026-10-09T08:00:00Z',
      total_value: 17,
      series: [],
      drilldown: null,
    });
    const query = vi.fn().mockResolvedValueOnce(result);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ANALYTICS,
          useValue: {
            catalog: (): Promise<MetricDefinition[]> =>
              Promise.resolve(metricCatalog as MetricDefinition[]),
            query,
          },
        },
        { provide: NotificationPreview, useValue: { revision: signal(0) } },
      ],
    });
    const dashboard = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    const confirmed = dashboard.range();
    let reject!: (reason: Error) => void;
    query.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    dashboard.start = '2026-01-01';
    const pending = dashboard.load();
    expect(dashboard.result()).toBe(result);
    expect(dashboard.stale()).toBe(true);
    reject(new Error('service unavailable'));
    await pending;
    expect(dashboard.state()).toBe('failed');
    expect(dashboard.result()).toBe(result);
    expect(dashboard.range()).toBe(confirmed);
    expect(dashboard.stale()).toBe(true);
    TestBed.inject(ActorState).reset();
    expect(dashboard.result()).toBeNull();
    expect(dashboard.range()).toBeNull();
  });
  it('polls the confirmed query without relabeling it after a preference change and stops on logout', async () => {
    vi.useFakeTimers();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const result = readMetric({
      metric_key: 'submitted_requests',
      version: 1,
      unit: 'count',
      availability: 'available',
      timezone: 'UTC',
      generated_at: '2026-10-09T08:00:00Z',
      as_of: '2026-10-09T08:00:00Z',
      total_value: 0,
      series: [],
      drilldown: null,
    });
    const query = vi.fn().mockResolvedValue(result);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ANALYTICS,
          useValue: {
            catalog: (): Promise<MetricDefinition[]> =>
              Promise.resolve(metricCatalog as MetricDefinition[]),
            query,
          },
        },
        { provide: NotificationPreview, useValue: { revision: signal(0) } },
      ],
    });
    const dashboard = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    expect(query).toHaveBeenCalledTimes(1);
    const applied = { ...query.mock.calls[0][0] };
    dashboard.start = '2025-01-01';
    TestBed.inject(Locale).timezone.set('Asia/Dubai');
    await vi.advanceTimersByTimeAsync(60000);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toEqual(applied);
    expect(dashboard.start).toBe('2025-01-01');
    expect(dashboard.timezone).toBe('Asia/Dubai');
    TestBed.inject(ActorState).reset();
    await vi.advanceTimersByTimeAsync(120000);
    expect(query).toHaveBeenCalledTimes(2);
    expect(dashboard.result()).toBeNull();
  });
});
