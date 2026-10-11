import { ApiFailure } from '../../../../core/transport/api-failure';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Feedback } from '../../../../core/feedback/feedback';
import { CALENDAR } from '../../bindings';
import { WorkReminders } from './work-reminders';
describe('Work reminder recovery', () => {
  it('retries the same intent/current reference and reflects its confirmed offsets', async () => {
    const configure = vi
      .fn()
      .mockRejectedValueOnce(Error('Connection lost'))
      .mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CALENDAR,
          useValue: {
            work: vi.fn().mockResolvedValue({
              ref_id: 'work-current',
              due_at: '2026-11-02T05:00:00Z',
            }),
            reminders: vi.fn().mockResolvedValue([]),
            configure,
          },
        },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
    const fixture = TestBed.createComponent(WorkReminders);
    fixture.componentRef.setInput('item', {
      ref_id: 'projection-ref',
      source_kind: 'work_item',
      title: 'Deadline',
      editable: false,
      route_key: 'work_items',
      schedule: {
        kind: 'deadline',
        timezone: 'UTC',
        due_at: '2026-11-02T05:00:00Z',
      },
    });
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    await vm.save();
    const first = structuredClone(configure.mock.calls[0]);
    expect(first[0]).toBe('work-current');
    expect(vm.uncertain()).toBe(true);
    vm.offsets = ['3600'];
    await vm.save();
    expect(configure.mock.calls[1]).toEqual(first);
    expect(vm.offsets).toEqual(['900']);
    expect(vm.dirty()).toBe(false);
  });
  it('fences stale saves and uncertain cancellation until current read', async () => {
    const work = vi
      .fn()
      .mockResolvedValue({ ref_id: 'old', due_at: '2026-11-02T05:00:00Z' });
    const configure = vi
      .fn()
      .mockRejectedValueOnce(new ApiFailure(409, null, null, []))
      .mockResolvedValue([]);
    const cancel = vi.fn().mockRejectedValue(Error('Connection lost'));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CALENDAR,
          useValue: {
            work,
            configure,
            cancel,
            reminders: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
    const fixture = TestBed.createComponent(WorkReminders);
    fixture.componentRef.setInput('item', {
      ref_id: 'projection',
      source_kind: 'work_item',
      title: 'Deadline',
      editable: false,
      route_key: 'work_items',
      schedule: {
        kind: 'deadline',
        timezone: 'UTC',
        due_at: '2026-11-02T05:00:00Z',
      },
    });
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.offsets = ['3600'];
    await vm.save();
    await vm.save();
    expect(configure).toHaveBeenCalledTimes(1);
    expect(vm.offsets).toEqual(['3600']);
    work.mockResolvedValue({
      ref_id: 'current',
      due_at: '2026-11-02T05:00:00Z',
    });
    await vm.load();
    expect(vm.offsets).toEqual(['3600']);
    await vm.save();
    expect(configure.mock.calls[1][0]).toBe('current');
    await vm.cancel();
    await vm.cancel();
    expect(cancel).toHaveBeenCalledTimes(1);
    work.mockResolvedValue({ ref_id: 'current', due_at: null });
    await vm.load();
    await vm.save();
    expect(configure).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });
});
