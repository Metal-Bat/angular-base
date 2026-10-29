import { ApiFailure } from '../../../../core/transport/api-failure';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Locale } from '../../../../core/localization/locale';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { CalendarItem } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
import { CalendarEditor } from './calendar-editor';
const item: CalendarItem = {
  ref_id: 'revision-current',
  title: 'Appointment',
  editable: true,
  source_kind: 'manual',
  route_key: 'calendar_events',
  schedule: {
    kind: 'timed',
    timezone: 'Asia/Dubai',
    start_at: '2026-11-02T05:00:37.123Z',
    end_at: '2026-11-02T06:00:41.987Z',
  },
};
describe('Calendar command recovery and exact schedules', () => {
  const save = vi.fn();
  beforeEach(() => {
    save.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CALENDAR, useValue: { save } },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
  });
  it('edits existing instants in the saved user zone without rewriting seconds or the event zone', async () => {
    TestBed.inject(Locale).timezone.set('Asia/Tehran');
    save.mockResolvedValue(item);
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', item);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.timezone).toBe('Asia/Tehran');
    expect(vm.start).toBe('2026-11-02T08:30');
    expect(vm.end).toBe('2026-11-02T09:30');
    expect(
      fixture.nativeElement.querySelector('app-timezone-control'),
    ).toBeNull();
    vm.title = 'Title only';
    vm.reminder = 'none';
    await vm.save();
    expect(save.mock.calls[0][0].schedule).toEqual(item.schedule);
  });
  it('uses settings for new events and keeps a draft stable when preferences change', async () => {
    const locale = TestBed.inject(Locale);
    locale.timezone.set('Asia/Tokyo');
    save.mockResolvedValue(item);
    const fixture = TestBed.createComponent(CalendarEditor);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'New event';
    vm.start = '2026-11-02T09:00';
    vm.end = '2026-11-02T10:00';
    locale.timezone.set('America/New_York');
    await fixture.whenStable();
    await vm.save();
    expect(save.mock.calls[0][0].schedule).toEqual({
      kind: 'timed',
      timezone: 'Asia/Tokyo',
      start_at: '2026-11-02T00:00:00.000Z',
      end_at: '2026-11-02T01:00:00.000Z',
    });
  });
  it('retains date-only event dates and their original zone across user timezone changes', async () => {
    TestBed.inject(Locale).timezone.set('Pacific/Auckland');
    const allDay: CalendarItem = {
      ...item,
      schedule: {
        kind: 'all_day',
        timezone: 'America/New_York',
        start_date: '2026-11-02',
        end_date: '2026-11-03',
      },
    };
    save.mockResolvedValue(allDay);
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', allDay);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Date-only title edit';
    vm.reminder = 'none';
    await vm.save();
    expect(save.mock.calls[0][0].schedule).toEqual(allDay.schedule);
  });
  it('honors a deliberate DST-fold offset change while retaining the untouched endpoint exactly', async () => {
    TestBed.inject(Locale).timezone.set('America/New_York');
    const folded: CalendarItem = {
      ...item,
      schedule: {
        kind: 'timed',
        timezone: 'America/New_York',
        start_at: '2026-11-01T05:30:37.123Z',
        end_at: '2026-11-01T08:00:41.987Z',
      },
    };
    save.mockResolvedValue(folded);
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', folded);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.start).toBe('2026-11-01T01:30');
    vm.startChoice = '2026-11-01T06:30:00.000Z';
    vm.reminder = 'none';
    await vm.save();
    expect(save.mock.calls[0][0].schedule).toEqual({
      kind: 'timed',
      timezone: 'America/New_York',
      start_at: '2026-11-01T06:30:00.000Z',
      end_at: '2026-11-01T08:00:41.987Z',
    });
  });
  it('preserves seconds/fractions on a title edit and retries exactly the original command', async () => {
    save
      .mockRejectedValueOnce(Error('Connection lost'))
      .mockResolvedValue(item);
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', item);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Renamed appointment';
    vm.reminder = 'none';
    await vm.save();
    const body = structuredClone(save.mock.calls[0][0]);
    expect(body.schedule).toEqual(item.schedule);
    expect(vm.uncertain()).toBe(true);
    vm.title = 'A different intent';
    await vm.save();
    expect(save.mock.calls[1]).toEqual([body, item.ref_id]);
    expect(vm.uncertain()).toBe(false);
  });
  it('never derives saved reminder offsets from historical deliveries and ignores an old account result', async () => {
    let finish!: (value: CalendarItem) => void;
    save.mockImplementation(
      () => new Promise<CalendarItem>((resolve) => (finish = resolve)),
    );
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', item);
    fixture.componentRef.setInput('reminders', [
      { ref_id: 'old', due_at: '2024-01-01T00:00:00Z', status: 'SENT' },
    ]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    await vm.save();
    expect(save).not.toHaveBeenCalled();
    vm.reminder = 'none';
    const result = vm.save();
    await vi.waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0][0].reminder_offsets).toEqual([]);
    const emitted = vi.fn();
    vm.saved.subscribe(emitted);
    TestBed.inject(ActorState).reset();
    finish(item);
    await result;
    expect(emitted).not.toHaveBeenCalled();
    expect(vm.title).toBe('');
  });
  it('requires explicit reminder replacement even when no delivery rows exist', async () => {
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', item);
    fixture.componentRef.setInput('reminders', []);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Retained title';
    await vm.save();
    expect(save).not.toHaveBeenCalled();
    expect(vm.title).toBe('Retained title');
    expect(vm.reminder).toBe('');
    const confirm = TestBed.inject(Feedback).confirm;
    vi.mocked(confirm).mockResolvedValue(false);
    vm.reminder = '900';
    await vm.save();
    expect(confirm).toHaveBeenCalledWith(
      'Replace the existing reminder configuration?',
    );
    expect(save).not.toHaveBeenCalled();
    expect(vm.reminder).toBe('900');
  });
  it('keeps confirmed conflict edits available for repair', async () => {
    save.mockRejectedValueOnce(
      new ApiFailure(409, null, null, [], false, 'revision'),
    );
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', item);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Preserved title';
    vm.reminder = 'none';
    await vm.save();
    expect(vm.uncertain()).toBe(false);
    expect(vm.title).toBe('Preserved title');
    expect(vm.dirty()).toBe(true);
    await vm.save();
    expect(save).toHaveBeenCalledTimes(1);
  });
  it('requires a chosen group and preserves the exact uncertain command', async () => {
    save.mockRejectedValueOnce(new ApiFailure(0, null, null, [], true));
    const fixture = TestBed.createComponent(CalendarEditor);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Group appointment';
    vm.kind = 'all_day';
    vm.start = '2026-10-29';
    vm.end = '2026-10-30';
    vm.sharingGroup = true;
    await vm.save();
    expect(save).not.toHaveBeenCalled();
    vm.group = 'current-group';
    await vm.save();
    const original = structuredClone(save.mock.calls[0][0]);
    expect(original.work_group_ref_id).toBe('current-group');
    expect(vm.uncertain()).toBe(true);
    vm.group = 'changed-group';
    save.mockResolvedValueOnce(item);
    await vm.save();
    expect(save.mock.calls[1][0]).toEqual(original);
  });
  it('repairs a stale group without losing the new draft', async () => {
    save.mockRejectedValueOnce(
      new ApiFailure(409, null, null, [], false, 'revision'),
    );
    const fixture = TestBed.createComponent(CalendarEditor);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Retained group draft';
    vm.kind = 'all_day';
    vm.start = '2026-10-29';
    vm.end = '2026-10-30';
    vm.sharingGroup = true;
    vm.selectGroup('old-group');
    await vm.save();
    expect(vm.reconcileRequired()).toBe(true);
    const original = save.mock.calls[0][0];
    vm.selectGroup('fresh-group');
    expect(vm.reconcileRequired()).toBe(false);
    save.mockResolvedValueOnce(item);
    await vm.save();
    expect(save.mock.calls[1][0]).toMatchObject({
      title: original.title,
      schedule: original.schedule,
      work_group_ref_id: 'fresh-group',
    });
    expect(save.mock.calls[1][0].command_key).not.toBe(original.command_key);
  });
});
