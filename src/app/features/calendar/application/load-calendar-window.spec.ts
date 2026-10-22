import {
  CalendarItem,
  CalendarPort,
  CalendarQuery,
  CalendarSearchDenied,
} from './calendar-port';
import { loadCalendarWindow } from './load-calendar-window';
const query: Omit<CalendarQuery, 'page' | 'size'> = {
  start_date: '2026-10-01',
  end_date: '2026-11-01',
  timezone: 'UTC',
  include_work_deadlines: true,
};
const item: CalendarItem = {
  ref_id: 'appointment',
  title: 'Appointment',
  editable: true,
  source_kind: 'manual',
  route_key: 'calendar_events',
  schedule: {
    kind: 'all_day',
    timezone: 'UTC',
    start_date: '2026-10-15',
    end_date: '2026-10-16',
  },
};
const row = {
  item,
  event: {
    key: item.ref_id,
    title: item.title,
    source: 'personal' as const,
    kind: 'all_day' as const,
    start: '2026-10-15',
    end: '2026-10-16',
  },
};
describe('Bounded calendar projection', () => {
  it('deduplicates current authorized pages without changing query or references', async () => {
    const search = vi
      .fn<CalendarPort['search']>()
      .mockResolvedValueOnce({ items: [row], totalPages: 2 })
      .mockResolvedValueOnce({ items: [row], totalPages: 2 });
    const controller = new AbortController();
    expect(
      await loadCalendarWindow({ search }, query, controller.signal),
    ).toEqual({ rows: [row], complete: true });
    expect(search.mock.calls).toEqual([
      [{ ...query, page: 1, size: 100 }, controller.signal],
      [{ ...query, page: 2, size: 100 }, controller.signal],
    ]);
  });
  it('retains partial pages after truncation or outage and rejects an initial outage', async () => {
    const search = vi
      .fn<CalendarPort['search']>()
      .mockResolvedValue({ items: [row], totalPages: 21 });
    const signal = new AbortController().signal;
    expect(await loadCalendarWindow({ search }, query, signal)).toEqual({
      rows: [row],
      complete: false,
    });
    expect(search).toHaveBeenCalledTimes(20);
    search
      .mockReset()
      .mockResolvedValueOnce({ items: [row], totalPages: 2 })
      .mockRejectedValueOnce(Error('offline'));
    expect(await loadCalendarWindow({ search }, query, signal)).toEqual({
      rows: [row],
      complete: false,
    });
    search.mockReset().mockRejectedValueOnce(Error('offline'));
    await expect(loadCalendarWindow({ search }, query, signal)).rejects.toThrow(
      'offline',
    );
  });
  it('discards an interrupted projection and never fetches its following page', async () => {
    const controller = new AbortController();
    const search = vi
      .fn<CalendarPort['search']>()
      .mockImplementation(async () => {
        controller.abort();
        return { items: [row], totalPages: 2 };
      });
    await expect(
      loadCalendarWindow({ search }, query, controller.signal),
    ).rejects.toThrow();
    expect(search).toHaveBeenCalledTimes(1);
  });
});

it('discards partial private rows after read authority is revoked', async () => {
  const search = vi
    .fn<CalendarPort['search']>()
    .mockResolvedValueOnce({ items: [row], totalPages: 2 })
    .mockRejectedValueOnce(new CalendarSearchDenied());
  await expect(
    loadCalendarWindow({ search }, query, new AbortController().signal),
  ).rejects.toBeInstanceOf(CalendarSearchDenied);
});
