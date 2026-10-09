import {
  dateMillis,
  DateWindow,
  exclusiveEndDate,
  instantMicroseconds,
  shiftDate,
  validateWindow,
  validateZone,
  zonedDate,
} from './calendar-dates';
export type CalendarEvent = {
  key: string;
  title: string;
  source: 'personal' | 'workflow';
} & (
  | { kind: 'all_day'; start: string; end: string }
  | { kind: 'timed'; start: string; end: string; timezone: string }
);
export type CalendarProjection = {
  status: 'loading' | 'ready' | 'failed';
  stale: boolean;
  events: readonly CalendarEvent[];
};
export function eventValid(event: CalendarEvent): boolean {
  try {
    if (!event.key || !event.title.trim()) {
      return false;
    }
    if (event.kind === 'all_day') {
      return dateMillis(event.end) > dateMillis(event.start);
    }
    validateZone(event.timezone);
    zonedDate(event.start, event.timezone);
    zonedDate(event.end, event.timezone);
    return instantMicroseconds(event.end) > instantMicroseconds(event.start);
  } catch {
    return false;
  }
}
/** Civil dates stay dates; timed events are projected in the chosen presentation zone. */
export function eventsOnDay(
  events: readonly CalendarEvent[],
  day: string,
  zone: string,
): CalendarEvent[] {
  const start = dateMillis(day);
  validateZone(zone);
  return events.filter((event) => {
    if (!eventValid(event)) {
      throw Error('Invalid calendar event');
    }
    if (event.kind === 'all_day') {
      return dateMillis(event.start) <= start && dateMillis(event.end) > start;
    }
    const first = zonedDate(event.start, zone);
    const last = exclusiveEndDate(event.end, zone);
    return first <= day && day <= last;
  });
}
export function eventsInWindow(
  events: readonly CalendarEvent[],
  window: DateWindow,
  zone: string,
): CalendarEvent[] {
  validateWindow(window);
  validateZone(zone);
  return events.filter((event) => {
    if (!eventValid(event)) {
      throw Error('Invalid calendar event');
    }
    const first =
      event.kind === 'all_day' ? event.start : zonedDate(event.start, zone);
    const last =
      event.kind === 'all_day'
        ? shiftDate(event.end, -1)
        : exclusiveEndDate(event.end, zone);
    return first < window.end && last >= window.start;
  });
}
