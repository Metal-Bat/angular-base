import { ApiFailure } from '../../../../core/transport/api-failure';
import { TestBed } from '@angular/core/testing';
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
        { provide: CALENDAR, useValue: { save } },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
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
  it('keeps confirmed conflict edits available for repair', async () => {
    save.mockRejectedValueOnce(
      new ApiFailure(409, null, null, [], false, 'revision'),
    );
    const fixture = TestBed.createComponent(CalendarEditor);
    fixture.componentRef.setInput('item', item);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.title = 'Preserved title';
    await vm.save();
    expect(vm.uncertain()).toBe(false);
    expect(vm.title).toBe('Preserved title');
    expect(vm.dirty()).toBe(true);
    await vm.save();
    expect(save).toHaveBeenCalledTimes(1);
  });
});
