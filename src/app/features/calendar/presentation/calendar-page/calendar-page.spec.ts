import { Locale } from '../../../../core/localization/locale';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { CalendarEvent } from '../../domain/calendar-events';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Feedback } from '../../../../core/feedback/feedback';
import { CalendarItem } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
import { CalendarEditor } from '../calendar-editor/calendar-editor';
import { CalendarPage } from './calendar-page';

describe('Explicit current calendar reload', () => {
  it('preserves an unsaved draft on cancel and reads current authority only after confirmation', async () => {
    const original: CalendarItem = {
      ref_id: 'old',
      title: 'Appointment',
      editable: true,
      source_kind: 'manual',
      route_key: 'calendar_events',
      schedule: {
        kind: 'all_day',
        timezone: 'UTC',
        start_date: '2026-11-02',
        end_date: '2026-11-03',
      },
    };
    const detail = vi.fn().mockResolvedValue({
      ...original,
      ref_id: 'current',
      title: 'Competing title',
    });
    const confirm = vi.fn().mockResolvedValue(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CALENDAR,
          useValue: {
            search: vi.fn().mockResolvedValue({ items: [], totalPages: 0 }),
            detail,
            reminders: vi.fn().mockResolvedValue([]),
          },
        },
        { provide: Feedback, useValue: { confirm } },
      ],
    });
    const fixture = TestBed.createComponent(CalendarPage);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.selected.set(original);
    vm.editing.set(true);
    fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(CalendarEditor))
      .componentInstance as CalendarEditor;
    editor.title = 'Unsaved title';
    await vm.reloadSelected();
    expect(detail).not.toHaveBeenCalled();
    expect(editor.title).toBe('Unsaved title');
    confirm.mockResolvedValue(true);
    await vm.reloadSelected();
    await fixture.whenStable();
    expect(detail).toHaveBeenCalledWith('old');
    expect(editor.title).toBe('Competing title');
    expect(vm.selected()?.ref_id).toBe('current');
    fixture.destroy();
  });
});

it('re-reads current delete authority and fences uncertain deletion until refresh', async () => {
  const item: CalendarItem = {
    ref_id: 'old',
    title: 'Appointment',
    editable: true,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'UTC',
      start_date: '2026-10-15',
      end_date: '2026-10-16',
    },
  };
  const event: CalendarEvent = {
    key: item.ref_id,
    title: item.title,
    source: 'personal',
    kind: 'all_day',
    start: '2026-10-15',
    end: '2026-10-16',
  };
  const detail = vi.fn().mockResolvedValue({ ...item, ref_id: 'current' });
  const remove = vi
    .fn()
    .mockRejectedValue(new ApiFailure(0, null, null, [], true));
  const search = vi
    .fn()
    .mockResolvedValue({ items: [{ item, event }], totalPages: 1 });
  const confirm = vi.fn().mockResolvedValue(false);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: CALENDAR, useValue: { search, detail, remove } },
      { provide: Feedback, useValue: { confirm } },
    ],
  });
  const fixture = TestBed.createComponent(CalendarPage);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  await vm.deleteFromDetails(event);
  expect(detail).toHaveBeenCalledExactlyOnceWith('old');
  expect(remove).not.toHaveBeenCalled();
  confirm.mockResolvedValue(true);
  await vm.deleteFromDetails(event);
  expect(remove).toHaveBeenCalledExactlyOnceWith('current');
  expect(vm.reconcileRequired()).toBe(true);
  await vm.deleteFromDetails(event);
  expect(remove).toHaveBeenCalledTimes(1);
  await vm.load();
  expect(vm.reconcileRequired()).toBe(false);
  fixture.destroy();
});

it('keeps the most recently selected event when earlier detail reads finish late', async () => {
  const makeItem = (ref_id: string): CalendarItem => ({
    ref_id,
    title: ref_id,
    editable: true,
    source_kind: 'manual',
    route_key: 'calendar_events',
    schedule: {
      kind: 'all_day',
      timezone: 'UTC',
      start_date: '2026-10-15',
      end_date: '2026-10-16',
    },
  });
  const first = makeItem('First selection');
  const second = makeItem('Second selection');
  let finish!: (item: CalendarItem) => void;
  const detail = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<CalendarItem>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(second);
  const asEvent = (item: CalendarItem): CalendarEvent => ({
    key: item.ref_id,
    title: item.title,
    source: 'personal',
    kind: 'all_day',
    start: '2026-10-15',
    end: '2026-10-16',
  });
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: CALENDAR,
        useValue: {
          search: vi.fn().mockResolvedValue({
            items: [first, second].map((item) => ({
              item,
              event: asEvent(item),
            })),
            totalPages: 1,
          }),
          detail,
          reminders: vi.fn().mockResolvedValue([]),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(CalendarPage);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const older = vm.open(asEvent(first));
  await Promise.resolve();
  const latest = vm.open(asEvent(second));
  await latest;
  finish(first);
  await older;
  expect(vm.selected()?.ref_id).toBe(second.ref_id);
  fixture.destroy();
});

it('opens a new event query on the same page and preserves a draft when navigation is declined', async () => {
  const params = new BehaviorSubject(convertToParamMap({ event: 'first' }));
  const detail = vi
    .fn()
    .mockImplementation(async (ref_id: string): Promise<CalendarItem> => ({
      ref_id,
      title: ref_id,
      editable: true,
      source_kind: 'manual',
      route_key: 'calendar_events',
      schedule: {
        kind: 'all_day',
        timezone: 'UTC',
        start_date: '2026-10-15',
        end_date: '2026-10-16',
      },
    }));
  const confirm = vi.fn().mockResolvedValue(false);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { queryParamMap: params } },
      { provide: Feedback, useValue: { confirm } },
      {
        provide: CALENDAR,
        useValue: {
          search: vi.fn().mockResolvedValue({ items: [], totalPages: 0 }),
          detail,
          reminders: vi.fn().mockResolvedValue([]),
        },
      },
    ],
  });
  // This test owns route/draft coordination; real Calendar views are exercised
  // by their tests and the paired browser suite. Keep the actual editor/guard.
  TestBed.overrideComponent(CalendarPage, {
    set: {
      imports: [CalendarEditor],
      template: `@if (editing()) { <app-calendar-editor [item]="selected()" [draft]="draft()" /> }`,
    },
  });
  const fixture = TestBed.createComponent(CalendarPage);
  await fixture.whenStable();
  expect(fixture.componentInstance.selected()?.ref_id).toBe('first');
  params.next(convertToParamMap({ event: 'second' }));
  await fixture.whenStable();
  await vi.waitFor(() =>
    expect(fixture.componentInstance.selected()?.ref_id).toBe('second'),
  );
  await fixture.whenStable();
  const editor = fixture.debugElement.query(By.directive(CalendarEditor))
    .componentInstance as CalendarEditor;
  editor.title = 'Keep my unsaved title';
  params.next(convertToParamMap({ event: 'third' }));
  await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
  await fixture.whenStable();
  expect(detail.mock.calls.map((call) => call[0])).toEqual(['first', 'second']);
  expect(editor.title).toBe('Keep my unsaved title');
  expect(fixture.componentInstance.selected()?.ref_id).toBe('second');
  fixture.destroy();
});

it('uses the saved user timezone for initial load, period navigation and refresh', async () => {
  const search = vi.fn().mockResolvedValue({ items: [], totalPages: 0 });
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: CALENDAR, useValue: { search } }],
  });
  const locale = TestBed.inject(Locale);
  locale.timezone.set('Asia/Tokyo');
  const fixture = TestBed.createComponent(CalendarPage);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  expect(vm.zone()).toBe('Asia/Tokyo');
  expect(search.mock.lastCall?.[0].timezone).toBe('Asia/Tokyo');
  await vm.changePeriod('2026-11-04');
  expect(vm.anchor()).toBe('2026-11-04');
  expect(search.mock.lastCall?.[0].timezone).toBe('Asia/Tokyo');
  const calls = search.mock.calls.length;
  await vm.changePeriod('');
  expect(search).toHaveBeenCalledTimes(calls);
  locale.timezone.set('America/New_York');
  await vm.load(vm.anchor());
  expect(vm.zone()).toBe('America/New_York');
  expect(search.mock.lastCall?.[0].timezone).toBe('America/New_York');
  expect(
    fixture.nativeElement.querySelector('app-timezone-control'),
  ).toBeNull();
  fixture.destroy();
});
