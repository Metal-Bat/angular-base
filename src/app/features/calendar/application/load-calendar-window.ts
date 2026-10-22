import {
  calendarWindow,
  shiftDate,
  validateWindow,
} from '../domain/calendar-dates';
import {
  CalendarPort,
  CalendarQuery,
  CalendarSearchDenied,
} from './calendar-port';

/** One bounded authorized projection; never promotes a truncated page set to complete. */
export async function loadCalendarWindow(
  api: Pick<CalendarPort, 'search'>,
  query: Omit<CalendarQuery, 'page' | 'size'>,
  signal: AbortSignal,
): Promise<{
  rows: Awaited<ReturnType<CalendarPort['search']>>['items'];
  complete: boolean;
}> {
  const rows = new Map<
    string,
    Awaited<ReturnType<CalendarPort['search']>>['items'][number]
  >();
  for (let page = 1; page <= 20; page++) {
    signal.throwIfAborted();
    try {
      const result = await api.search({ ...query, page, size: 100 }, signal);
      signal.throwIfAborted();
      if (!Number.isInteger(result.totalPages) || result.totalPages < 0) {
        throw Error('Invalid calendar pagination');
      }
      result.items.forEach((row) => {
        if (!rows.has(row.event.key)) {
          rows.set(row.event.key, row);
        }
      });
      if (page >= result.totalPages) {
        return { rows: [...rows.values()], complete: true };
      }
    } catch (error) {
      signal.throwIfAborted();
      if (!rows.size || error instanceof CalendarSearchDenied) {
        throw error;
      }
      return { rows: [...rows.values()], complete: false };
    }
  }
  return { rows: [...rows.values()], complete: false };
}

/** Include every supported display month and its boundary week, within one bounded query. */
export function calendarProjectionQuery(
  date: string,
  timezone: string,
): Omit<CalendarQuery, 'page' | 'size'> {
  const windows = (['gregory', 'persian', 'islamic-civil'] as const).map(
    (calendar) => calendarWindow(date, 'month', calendar),
  );
  const start = windows.map((window) => window.start).sort()[0];
  const end = windows
    .map((window) => window.end)
    .sort()
    .at(-1)!;
  const range = { start: shiftDate(start, -7), end: shiftDate(end, 7) };
  validateWindow(range);
  return {
    start_date: range.start,
    end_date: range.end,
    timezone,
    include_work_deadlines: true,
  };
}
