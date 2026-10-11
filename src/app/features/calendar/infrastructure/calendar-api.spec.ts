import { calendarEvent } from './calendar-api';
import { eventsInWindow, eventsOnDay } from '../domain/calendar-events';
describe('Authoritative calendar projection', () => {
  const deadline = {
    ref_id: 'work-current',
    title: 'Review',
    editable: false,
    source_kind: 'work_item',
    route_key: 'work_items',
    schedule: {
      kind: 'deadline',
      timezone: 'UTC',
      due_at: '2026-10-09T00:00:00Z',
    },
  };
  it('keeps a deadline as a point and includes it only on its actual civil day', () => {
    const { event } = calendarEvent(deadline);
    expect(event.kind).toBe('deadline');
    expect(eventsOnDay([event], '2026-10-08', 'UTC')).toEqual([]);
    expect(eventsOnDay([event], '2026-10-09', 'UTC')).toEqual([event]);
    expect(
      eventsInWindow(
        [event],
        { start: '2026-10-08', end: '2026-10-09' },
        'UTC',
      ),
    ).toEqual([]);
    expect(
      eventsInWindow(
        [event],
        { start: '2026-10-09', end: '2026-10-10' },
        'UTC',
      ),
    ).toEqual([event]);
  });
  it('rejects zero-duration timed events while retaining exclusive date-only ends', () => {
    expect(() =>
      calendarEvent({
        ...deadline,
        schedule: {
          kind: 'timed',
          timezone: 'UTC',
          start_at: '2026-10-09T00:00:00Z',
          end_at: '2026-10-09T00:00:00Z',
        },
      }),
    ).toThrow();
    const { event } = calendarEvent({
      ...deadline,
      source_kind: 'manual',
      route_key: 'calendar_events',
      schedule: {
        kind: 'all_day',
        timezone: 'Asia/Tehran',
        start_date: '2026-10-09',
        end_date: '2026-10-10',
      },
    });
    expect(eventsOnDay([event], '2026-10-09', 'UTC')).toEqual([event]);
    expect(eventsOnDay([event], '2026-10-10', 'Asia/Tehran')).toEqual([]);
  });
});
