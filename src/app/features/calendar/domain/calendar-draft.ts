import { shiftDate } from './calendar-dates';
/** Unsaved local input. Only the editor resolves DST and emits the existing command DTO. */
export type CalendarDraft = {
  kind: 'all_day' | 'timed';
  start: string;
  end: string;
  timezone: string;
};
export function calendarDraft(
  day: string,
  timezone: string,
  hour?: number,
): CalendarDraft {
  const next = shiftDate(day, 1);
  if (hour === undefined) {
    return { kind: 'all_day', start: day, end: next, timezone };
  }
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw Error('Invalid calendar hour');
  }
  return {
    kind: 'timed',
    timezone,
    start: day + 'T' + String(hour).padStart(2, '0') + ':00',
    end:
      (hour === 23
        ? next + 'T00'
        : day + 'T' + String(hour + 1).padStart(2, '0')) + ':00',
  };
}
