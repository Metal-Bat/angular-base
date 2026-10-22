import { TestBed } from '@angular/core/testing';
import { CalendarEvent } from '../../domain/calendar-events';
import { CalendarGrid } from './calendar-grid';

describe('Calendar visual collision layout', () => {
  it('reserves the full interactive height before placing the next short appointment', async () => {
    const events: CalendarEvent[] = [
      {
        key: 'first',
        title: 'First',
        source: 'personal',
        kind: 'timed',
        timezone: 'UTC',
        start: '2026-10-15T10:00:00Z',
        end: '2026-10-15T10:10:00Z',
      },
      {
        key: 'second',
        title: 'Second',
        source: 'personal',
        kind: 'timed',
        timezone: 'UTC',
        start: '2026-10-15T10:50:00Z',
        end: '2026-10-15T11:00:00Z',
      },
    ];
    const original = structuredClone(events);
    const fixture = TestBed.createComponent(CalendarGrid);
    fixture.componentRef.setInput('window', {
      start: '2026-10-15',
      end: '2026-10-16',
    });
    fixture.componentRef.setInput('view', 'day');
    fixture.componentRef.setInput('timezone', 'UTC');
    fixture.componentRef.setInput('events', events);
    await fixture.whenStable();
    const rows = fixture.componentInstance.timed('2026-10-15');
    expect(rows[0].end - rows[0].start).toBeGreaterThanOrEqual(55);
    expect(rows[1].lane).not.toBe(rows[0].lane);
    expect(events).toEqual(original);
  });
});
