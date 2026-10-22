import {
  calendarMonth,
  CalendarSystem,
} from '../../../shared/domain/calendar-value';
import { wallParts } from '../../../shared/domain/wall-time';
export {
  localTimeCandidates,
  localTimeToInstant,
} from '../../../shared/domain/wall-time';
/** Gregorian presentation helpers; no C09 endpoint or wire DTO is assumed. */
export type CalendarView = 'day' | 'agenda' | 'week' | 'month';
export type DateWindow = { start: string; end: string };
export function dateMillis(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw Error('Invalid Gregorian date');
  }
  const time = Date.parse(value + 'T00:00:00Z');
  if (
    !Number.isFinite(time) ||
    new Date(time).toISOString().slice(0, 10) !== value
  ) {
    throw Error('Invalid Gregorian date');
  }
  return time;
}
export function shiftDate(value: string, days: number): string {
  if (!Number.isInteger(days)) {
    throw Error('Invalid day offset');
  }
  return new Date(dateMillis(value) + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function validateWindow(window: DateWindow): void {
  const duration = dateMillis(window.end) - dateMillis(window.start);
  if (duration <= 0 || duration > 93 * 86400000) {
    throw Error('Calendar range must be between one and 93 days');
  }
}
export function calendarWindow(
  anchor: string,
  view: CalendarView,
  calendar: CalendarSystem = 'gregory',
): DateWindow {
  const day = new Date(dateMillis(anchor));
  if (view === 'day') {
    return { start: anchor, end: shiftDate(anchor, 1) };
  }
  if (view === 'month') {
    const days = calendarMonth(anchor, calendar);
    return { start: days[0], end: shiftDate(days[days.length - 1], 1) };
  }
  const start =
    view === 'week' ? shiftDate(anchor, -((day.getUTCDay() + 6) % 7)) : anchor;
  return { start, end: shiftDate(start, 7) };
}
export function calendarDays(window: DateWindow): string[] {
  validateWindow(window);
  const count = (dateMillis(window.end) - dateMillis(window.start)) / 86400000;
  return Array.from({ length: count }, (_, index) =>
    shiftDate(window.start, index),
  );
}
export function validateZone(zone: string): void {
  new Intl.DateTimeFormat('en', { timeZone: zone }).format(0);
}
export function zonedDate(instant: string, zone: string): string {
  validateZone(zone);
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      instant,
    ) ||
    !Number.isFinite(Date.parse(instant))
  ) {
    throw Error('A timed event needs an instant with a timezone');
  }
  dateMillis(instant.slice(0, 10));
  const fields = new Intl.DateTimeFormat('en', {
    timeZone: zone,
    calendar: 'gregory',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (key: string): string =>
    fields.find((field) => field.type === key)!.value;
  return `${get('year').padStart(4, '0')}-${get('month')}-${get('day')}`;
}

export function instantMicroseconds(instant: string): bigint {
  zonedDate(instant, 'UTC');
  const fraction = instant.match(/\.(\d+)/)?.[1] ?? '';
  return (
    BigInt(Date.parse(instant)) * 1000n +
    BigInt(fraction.padEnd(6, '0').slice(3, 6))
  );
}
export function exclusiveEndDate(instant: string, zone: string): string {
  const day = zonedDate(instant, zone);
  const wall = wallParts(Date.parse(instant), zone);
  return wall.endsWith('T00:00:00') &&
    instantMicroseconds(instant) % 1000000n === 0n
    ? shiftDate(day, -1)
    : day;
}
