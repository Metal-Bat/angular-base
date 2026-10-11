/** Calendars affect presentation only. Wire values stay Gregorian ISO. */
export type CalendarSystem = 'gregory' | 'persian' | 'islamic-civil';
const dayMillis = 86400000;
const formatters = new Map<CalendarSystem, Intl.DateTimeFormat>();
function formatter(calendar: CalendarSystem): Intl.DateTimeFormat {
  let result = formatters.get(calendar);
  if (!result) {
    result = new Intl.DateTimeFormat('en', {
      calendar,
      numberingSystem: 'latn',
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (result.resolvedOptions().calendar !== calendar) {
      throw Error('Calendar is unavailable.');
    }
    formatters.set(calendar, result);
  }
  return result;
}
export function gregorianMillis(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) {
    throw Error('Enter a valid date.');
  }
  const millis = Date.parse(value + 'T00:00:00Z');
  if (
    !Number.isFinite(millis) ||
    new Date(millis).toISOString().slice(0, 10) !== value
  ) {
    throw Error('Enter a valid date.');
  }
  return millis;
}
export function calendarParts(iso: string, calendar: CalendarSystem): number[] {
  const parts = formatter(calendar).formatToParts(gregorianMillis(iso));
  return ['year', 'month', 'day'].map((key) =>
    Number(parts.find((p) => p.type === key)!.value),
  );
}
export function calendarText(iso: string, calendar: CalendarSystem): string {
  return calendarParts(iso, calendar)
    .map((part, index) => String(part).padStart(index ? 2 : 4, '0'))
    .join('-');
}
export function latinDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= '۰' ? 0x6f0 : 0x660)),
  );
}
/** Bounded inverse of ICU's calendar conversion, including leap-date validation. */
export function calendarIso(value: string, calendar: CalendarSystem): string {
  const normalized = latinDigits(value.trim());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw Error('Enter a valid date.');
  }
  if (calendar === 'gregory') {
    gregorianMillis(normalized);
    return normalized;
  }
  const target = normalized.split('-').map(Number);
  if (target[0] < 1) {
    throw Error('Enter a valid date.');
  }
  let low = Math.floor(Date.parse('0622-01-01T00:00:00Z') / dayMillis);
  let high = Math.floor(Date.parse('9999-12-31T00:00:00Z') / dayMillis);
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const iso = new Date(mid * dayMillis).toISOString().slice(0, 10);
    const current = calendarParts(iso, calendar);
    const difference =
      current[0] - target[0] ||
      current[1] - target[1] ||
      current[2] - target[2];
    if (!difference) {
      return iso;
    }
    if (difference < 0) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  throw Error('Enter a valid date.');
}
export function shiftCalendarDay(iso: string, days: number): string {
  return new Date(gregorianMillis(iso) + days * dayMillis)
    .toISOString()
    .slice(0, 10);
}
export function calendarMonth(iso: string, calendar: CalendarSystem): string[] {
  const [year, month, day] = calendarParts(iso, calendar);
  const first = shiftCalendarDay(iso, 1 - day);
  const result: string[] = [];
  for (let index = 0; index < 32; index++) {
    const value = shiftCalendarDay(first, index);
    const parts = calendarParts(value, calendar);
    if (parts[0] !== year || parts[1] !== month) {
      break;
    }
    result.push(value);
  }
  return result;
}
