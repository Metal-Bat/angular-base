import { wallParts } from '../../../../shared/domain/wall-time';
import { CalendarEvent } from '../../domain/calendar-events';

type TimedEvent = Extract<CalendarEvent, { kind: 'timed' }>;
type Placement = {
  readonly key: string;
  readonly start: number;
  readonly end: number;
  lane: number;
  lanes: number;
};
export type TimedEventRow = Placement & {
  readonly kind: 'event';
  readonly event: TimedEvent;
};
export type TimedMoreRow = Placement & {
  readonly kind: 'more';
  readonly count: number;
};
export type TimedRow = TimedEventRow | TimedMoreRow;

// 55 civil minutes occupy 2.75rem at the time grid's 3rem/hour scale.
// This reserves the real minimum target without changing an event's duration.
const minimumTargetMinutes = 55;
export function timedEventLayout(
  events: readonly CalendarEvent[],
  day: string,
  timezone: string,
): TimedRow[] {
  const minute = (instant: string): number => {
    const wall = wallParts(Date.parse(instant), timezone);
    const date = wall.slice(0, 10);
    if (date < day) {
      return 0;
    }
    if (date > day) {
      return 1440;
    }
    return Number(wall.slice(11, 13)) * 60 + Number(wall.slice(14, 16));
  };
  const rows: TimedEventRow[] = events
    .filter((event): event is TimedEvent => event.kind === 'timed')
    .map((event): TimedEventRow => {
      const start = minute(event.start);
      return {
        key: event.key,
        kind: 'event',
        event,
        start,
        end: Math.max(start + minimumTargetMinutes, minute(event.end)),
        lane: 0,
        lanes: 1,
      };
    })
    .sort(
      (a, b) =>
        a.start - b.start || b.end - a.end || a.key.localeCompare(b.key),
    );
  const result: TimedRow[] = [];
  let cluster: TimedEventRow[] = [];
  let clusterEnd = -1;
  const flush = (): void => {
    if (!cluster.length) {
      return;
    }
    const lanes = Math.max(...cluster.map((row) => row.lane + 1));
    if (lanes <= 2) {
      result.push(...cluster.map((row) => ({ ...row, lanes })));
    } else {
      // Every day column is at least 7rem wide. Two lanes retain full targets.
      result.push(
        ...cluster
          .filter((row) => row.lane === 0)
          .map((row) => ({ ...row, lanes: 2 })),
      );
      const hidden = cluster.filter((row) => row.lane > 0);
      const first = hidden[0];
      result.push({
        key: 'more:' + first.key,
        kind: 'more',
        count: hidden.length,
        start: first.start,
        end: first.start + minimumTargetMinutes,
        lane: 1,
        lanes: 2,
      });
    }
    cluster = [];
  };
  for (const row of rows) {
    if (row.start >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    const occupied = new Set(
      cluster
        .filter((other) => other.end > row.start)
        .map((other) => other.lane),
    );
    while (occupied.has(row.lane)) {
      row.lane++;
    }
    cluster.push(row);
    clusterEnd = Math.max(clusterEnd, row.end);
  }
  flush();
  return result.sort((a, b) => a.start - b.start || a.lane - b.lane);
}
