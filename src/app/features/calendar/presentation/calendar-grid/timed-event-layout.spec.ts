import { CalendarEvent } from '../../domain/calendar-events';
import { timedEventLayout } from './timed-event-layout';

const event = (key: string, start: string, end: string): CalendarEvent => ({
  key,
  title: key,
  source: 'personal',
  kind: 'timed',
  timezone: 'UTC',
  start,
  end,
});
describe('Timed calendar target placement', () => {
  it('keeps a late-night target complete without changing its anchor or exact instants', () => {
    const late = event('late', '2026-10-15T23:58:00Z', '2026-10-15T23:59:00Z');
    const before = structuredClone(late);
    const [row] = timedEventLayout([late], '2026-10-15', 'UTC');
    expect(row.start).toBe(1438);
    expect(row.end - row.start).toBe(55);
    expect(row.end).toBeGreaterThan(1440);
    expect(row.kind === 'event' && row.event).toBe(late);
    expect(late).toEqual(before);
  });
  it('counts every event hidden by a dense cluster without changing its authorized events', () => {
    const events = ['alpha', 'beta', 'gamma', 'delta'].map((key) =>
      event(key, '2026-10-15T14:00:00Z', '2026-10-15T14:10:00Z'),
    );
    const before = structuredClone(events);
    const rows = timedEventLayout(events, '2026-10-15', 'UTC');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: 'event', lane: 0, lanes: 2 });
    expect(rows[1]).toMatchObject({
      kind: 'more',
      lane: 1,
      lanes: 2,
      count: 3,
    });
    expect(events).toEqual(before);
  });
  it('retains separate non-overlapping appointments as full-width ordinary events', () => {
    const rows = timedEventLayout(
      [
        event('early', '2026-10-15T08:00:00Z', '2026-10-15T08:10:00Z'),
        event('later', '2026-10-15T09:00:00Z', '2026-10-15T09:10:00Z'),
      ],
      '2026-10-15',
      'UTC',
    );
    expect(rows.map((row) => [row.kind, row.lane, row.lanes])).toEqual([
      ['event', 0, 1],
      ['event', 0, 1],
    ]);
  });
  it('keeps fold instants intact when wall-clock end precedes wall-clock start', () => {
    const folded = event(
      'fold',
      '2026-11-01T05:30:00Z',
      '2026-11-01T06:15:00Z',
    );
    const [row] = timedEventLayout([folded], '2026-11-01', 'America/New_York');
    expect(row.start).toBe(90);
    expect(row.end - row.start).toBe(55);
    expect(row.kind === 'event' && row.event.end).toBe('2026-11-01T06:15:00Z');
  });
});
