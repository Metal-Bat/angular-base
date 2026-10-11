import { ApiFailure } from '../../../../core/transport/api-failure';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { NotificationPreview } from '../../../../core/notifications/notification-preview';
import { ANALYTICS } from '../../bindings';
import { readMetric } from '../../domain/metrics';
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
          useValue: { catalog: (): Promise<[]> => Promise.resolve([]), query },
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
          useValue: { catalog: (): Promise<[]> => Promise.resolve([]), query },
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
  });
  it('polls the applied query, preserves draft input and stops on logout', async () => {
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
          useValue: { catalog: (): Promise<[]> => Promise.resolve([]), query },
        },
        { provide: NotificationPreview, useValue: { revision: signal(0) } },
      ],
    });
    const dashboard = TestBed.runInInjectionContext(() => new Dashboard());
    await vi.advanceTimersByTimeAsync(0);
    expect(query).toHaveBeenCalledTimes(1);
    const applied = { ...query.mock.calls[0][0] };
    dashboard.start = '2025-01-01';
    dashboard.timezone = 'Asia/Dubai';
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
