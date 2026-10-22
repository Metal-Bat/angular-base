import { gregorianMillis as dateMillis } from './calendar-value';
// Cache only ICU formatters, never actor values, candidate instants or form drafts.
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(zone: string): Intl.DateTimeFormat {
  const existing = formatters.get(zone);
  if (existing) {
    return existing;
  }
  const result = new Intl.DateTimeFormat('en', {
    timeZone: zone,
    calendar: 'gregory',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  if (formatters.size >= 32) {
    formatters.delete(formatters.keys().next().value!);
  }
  formatters.set(zone, result);
  return result;
}
function validateZone(zone: string): void {
  formatter(zone);
}
export function wallParts(time: number, zone: string): string {
  const parts = formatter(zone).formatToParts(time);
  const get = (key: string): string =>
    parts.find((field) => field.type === key)!.value;
  const date = `${get('year').padStart(4, '0')}-${get('month')}-${get('day')}`;
  return `${date}T${get('hour')}:${get('minute')}:${get('second')}`;
}
/** Return all real instants for a local minute; zero means a DST gap, two a fold. */
export function localTimeCandidates(local: string, zone: string): string[] {
  validateZone(zone);
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(local)) {
    throw Error('Invalid local time');
  }
  dateMillis(local.slice(0, 10));
  const nominal = Date.parse(local + ':00Z');
  const offsets = new Set<number>();
  for (let hour = -36; hour <= 36; hour += 6) {
    const probe = nominal + hour * 3600000;
    offsets.add(Date.parse(wallParts(probe, zone) + 'Z') - probe);
  }
  return [
    ...new Set(
      [...offsets]
        .map((offset) => nominal - offset)
        .filter((time) => wallParts(time, zone) === local + ':00'),
    ),
  ]
    .sort((a, b) => a - b)
    .map((time) => new Date(time).toISOString());
}
export function localTimeToInstant(
  local: string,
  zone: string,
  choice?: string,
): string {
  const candidates = localTimeCandidates(local, zone);
  if (!candidates.length) {
    throw Error('This local time does not exist');
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  if (choice && candidates.includes(choice)) {
    return choice;
  }
  throw Error('Choose an offset for this ambiguous local time');
}
