import {
  calendarDays,
  calendarWindow,
  dateMillis,
  exclusiveEndDate,
  localTimeCandidates,
  localTimeToInstant,
  validateWindow,
  zonedDate,
} from './calendar-dates';
import {
  CalendarEvent,
  eventsInWindow,
  eventsOnDay,
  eventValid,
} from './calendar-events';

describe('Gregorian calendar boundaries', () => {
  it('uses half-open Gregorian ranges across leap months and years', () => {
    const month = calendarWindow('2024-02-29', 'month');
    expect(month).toEqual({ start: '2024-02-01', end: '2024-03-01' });
    expect(calendarDays(month)).toHaveLength(29);
    expect(calendarWindow('2026-12-31', 'week')).toEqual({
      start: '2026-12-28',
      end: '2027-01-04',
    });
    expect(() => dateMillis('2025-02-29')).toThrow();
    expect(() =>
      validateWindow({ start: '2026-01-01', end: '2026-04-05' }),
    ).toThrow();
    expect(() =>
      validateWindow({ start: '2026-01-01', end: '2026-01-01' }),
    ).toThrow();
    expect(
      calendarDays({ start: '2026-01-01', end: '2026-04-04' }),
    ).toHaveLength(93);
  });
  it('rejects DST gaps and requires an explicit offset for folds', () => {
    expect(localTimeCandidates('2026-03-08T02:30', 'America/New_York')).toEqual(
      [],
    );
    expect(() =>
      localTimeToInstant('2026-03-08T02:30', 'America/New_York'),
    ).toThrow('does not exist');
    const fold = localTimeCandidates('2026-11-01T01:30', 'America/New_York');
    expect(fold).toEqual([
      '2026-11-01T05:30:00.000Z',
      '2026-11-01T06:30:00.000Z',
    ]);
    expect(() =>
      localTimeToInstant('2026-11-01T01:30', 'America/New_York'),
    ).toThrow('ambiguous');
    expect(
      localTimeToInstant('2026-11-01T01:30', 'America/New_York', fold[1]),
    ).toBe(fold[1]);
    expect(localTimeToInstant('2026-10-08T12:00', 'Asia/Tehran')).toBe(
      '2026-10-08T08:30:00.000Z',
    );
    expect(() =>
      localTimeCandidates('2026-10-08T12:00', 'not-a-zone'),
    ).toThrow();
  });
  it('rejects rolled dates and zone-free instants without losing microseconds', () => {
    expect(() => zonedDate('2026-02-30T12:00:00Z', 'UTC')).toThrow();
    expect(() => zonedDate('2026-10-08T12:00:00', 'UTC')).toThrow();
    expect(exclusiveEndDate('2026-10-09T00:00:00Z', 'UTC')).toBe('2026-10-08');
    expect(exclusiveEndDate('2026-10-09T00:00:00.000001Z', 'UTC')).toBe(
      '2026-10-09',
    );
  });
});

describe('Read-only calendar projections', () => {
  const allDay: CalendarEvent = Object.freeze({
    key: 'civil',
    title: 'All day',
    source: 'personal',
    kind: 'all_day',
    start: '2026-10-08',
    end: '2026-10-09',
  });
  const timed: CalendarEvent = Object.freeze({
    key: 'due',
    title: 'Deadline',
    source: 'workflow',
    kind: 'timed',
    start: '2026-10-08T22:00:00Z',
    end: '2026-10-09T00:00:00Z',
    timezone: 'UTC',
  });
  const events = Object.freeze([allDay, timed]);
  it('keeps all-day dates civil and excludes the end date', () => {
    expect(eventsOnDay(events, '2026-10-08', 'UTC')).toEqual(events);
    expect(eventsOnDay(events, '2026-10-09', 'UTC')).toEqual([]);
    expect(eventsOnDay(events, '2026-10-08', 'Asia/Tehran')).toContain(allDay);
    expect(eventsOnDay(events, '2026-10-09', 'Asia/Tehran')).toEqual([timed]);
    expect(
      eventsInWindow(events, { start: '2026-10-09', end: '2026-10-10' }, 'UTC'),
    ).toEqual([]);
    expect(events).toEqual([allDay, timed]);
  });
  it('accepts strictly increasing microsecond instants and rejects invalid input', () => {
    expect(
      eventValid({
        ...timed,
        start: '2026-10-08T00:00:00.000001Z',
        end: '2026-10-08T00:00:00.000002Z',
      }),
    ).toBe(true);
    expect(eventValid({ ...timed, end: timed.start })).toBe(false);
    expect(() =>
      eventsOnDay([{ ...allDay, end: allDay.start }], '2026-10-08', 'UTC'),
    ).toThrow();
  });
});
