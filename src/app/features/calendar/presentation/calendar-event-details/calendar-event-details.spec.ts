import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { CalendarItem } from '../../application/calendar-port';
import { CalendarEvent } from '../../domain/calendar-events';
import { CalendarEventDetails } from './calendar-event-details';

it('keeps read-only events immutable, uses inclusive dates, and clears private details on actor change', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CalendarEventDetails);
  await fixture.whenStable();
  const trigger = document.createElement('button');
  document.body.append(trigger);
  const event: CalendarEvent = {
    key: 'source',
    title: 'Literal source',
    source: 'personal',
    kind: 'all_day',
    start: '2026-10-14',
    end: '2026-10-16',
  };
  const item: CalendarItem = {
    ref_id: event.key,
    title: event.title,
    editable: false,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'Asia/Tehran',
      start_date: event.start,
      end_date: event.end,
    },
  };
  const vm = fixture.componentInstance;
  const edit = vi.fn();
  const remove = vi.fn();
  vm.editRequested.subscribe(edit);
  vm.removeRequested.subscribe(remove);
  vm.show({ event, trigger }, item, 'America/New_York');
  await fixture.whenStable();
  const popup = document.querySelector('.p-popover')!;
  expect(popup.textContent).toContain(event.title);
  expect(
    [...popup.querySelectorAll('time')].map((time) => time.dateTime),
  ).toEqual(['2026-10-14', '2026-10-15']);
  vm.edit();
  vm.remove();
  expect(edit).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
  TestBed.inject(ActorState).reset();
  await fixture.whenStable();
  expect(vm.detail()).toBeNull();
  expect(document.querySelector('.p-popover')).toBeNull();
  trigger.remove();
  fixture.destroy();
});

it('opens editing only after details have closed and cancels stale pending transitions', async () => {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CalendarEventDetails);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const event: CalendarEvent = {
    key: 'owned',
    title: 'Owned event',
    source: 'personal',
    kind: 'all_day',
    start: '2026-10-14',
    end: '2026-10-16',
  };
  const item: CalendarItem = {
    ref_id: event.key,
    title: event.title,
    editable: true,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'UTC',
      start_date: event.start,
      end_date: event.end,
    },
  };
  const opened = vi.fn();
  vm.editRequested.subscribe(opened);
  vm.detail.set({ event, item, zone: 'UTC' });
  vm.edit();
  expect(opened).not.toHaveBeenCalled();
  vm.hidden();
  vm.hidden();
  expect(opened.mock.calls).toEqual([[event]]);
  vm.edit();
  vm.close();
  vm.hidden();
  expect(opened).toHaveBeenCalledTimes(1);
  vm.edit();
  fixture.componentRef.setInput('busy', true);
  vm.hidden();
  expect(opened).toHaveBeenCalledTimes(1);
  fixture.componentRef.setInput('busy', false);
  vm.edit();
  TestBed.inject(ActorState).reset();
  vm.hidden();
  expect(opened).toHaveBeenCalledTimes(1);
  expect(vm.detail()).toBeNull();
});
