import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { ApiFailure } from '../../../core/transport/api-failure';
import { CalendarSearchDenied } from '../application/calendar-port';
import { CalendarApi, calendarEvent } from './calendar-api';
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

it('cancels obsolete HTTP reads and classifies lost calendar authority without changing the wire query', async () => {
  const response = new Subject<unknown>();
  const call = vi.fn(() => response);
  TestBed.configureTestingModule({
    providers: [{ provide: ApiClient, useValue: { call } }],
  });
  const api = TestBed.inject(CalendarApi);
  const body = {
    start_date: '2026-10-01',
    end_date: '2026-11-01',
    timezone: 'UTC',
    include_work_deadlines: true,
    page: 1,
    size: 100,
  };
  const controller = new AbortController();
  const pending = api.search(body, controller.signal);
  expect(response.observed).toBe(true);
  expect(call).toHaveBeenCalledExactlyOnceWith(
    'search_api_v1_calendar_events_search_post',
    { body },
  );
  const cancelled = expect(pending).rejects.toThrow();
  controller.abort();
  await cancelled;
  expect(response.observed).toBe(false);
  await expect(api.search(body, controller.signal)).rejects.toThrow();
  expect(call).toHaveBeenCalledTimes(1);
  const denied = expect(api.search(body)).rejects.toBeInstanceOf(
    CalendarSearchDenied,
  );
  response.error(new ApiFailure(403, 'denied', null, []));
  await denied;
});

it('rejects mismatched source routes and any projection that offers editing a workflow deadline', () => {
  const work = {
    ref_id: 'work',
    title: 'Deadline',
    source_kind: 'work_item',
    route_key: 'work_items',
    editable: false,
    schedule: {
      kind: 'deadline',
      due_at: '2026-10-15T12:00:00Z',
      timezone: 'UTC',
    },
  };
  expect(calendarEvent(work).item.editable).toBe(false);
  expect(() => calendarEvent({ ...work, editable: true })).toThrow(
    'Invalid calendar source authority',
  );
  expect(() =>
    calendarEvent({ ...work, route_key: 'calendar_events' }),
  ).toThrow('Invalid calendar source authority');
  expect(() =>
    calendarEvent({
      ...work,
      source_kind: 'manual',
      route_key: 'calendar_events',
    }),
  ).toThrow('Invalid calendar source authority');
});

it('uses the private current-membership selector and fences a late response by actor', async () => {
  const { HttpResponse } = await import('@angular/common/http');
  const { ActorState } = await import('../../../core/auth/actor-state');
  const responses = new Subject<unknown>();
  const call = vi.fn(() => responses);
  TestBed.configureTestingModule({
    providers: [{ provide: ApiClient, useValue: { call } }],
  });
  const api = TestBed.inject(CalendarApi);
  const abort = new AbortController().signal;
  const pending = api.groups('Finance', 2, abort);
  expect(call).toHaveBeenCalledWith(
    'select_calendar_groups_api_v1_calendar_work_groups_select_post',
    {
      body: { page: 2, size: 10, search: 'Finance' },
      query: { response_format: 'page' },
    },
    abort,
  );
  responses.next(
    new HttpResponse({
      body: {
        success: true,
        result: {
          items: [{ key: 'current-group', value: 'Finance' }],
          page: 2,
          size: 10,
          total: 11,
          total_pages: 2,
        },
      },
    }),
  );
  expect((await pending).items).toEqual([
    { key: 'current-group', value: 'Finance' },
  ]);
  const late = api.groups('', 1, abort).catch((error: unknown) => error);
  TestBed.inject(ActorState).reset();
  responses.next(
    new HttpResponse({
      body: {
        success: true,
        result: {
          items: [{ key: 'private-old', value: 'Old membership' }],
          page: 1,
          size: 10,
          total: 1,
          total_pages: 1,
        },
      },
    }),
  );
  expect(await late).toBeInstanceOf(Error);
});
