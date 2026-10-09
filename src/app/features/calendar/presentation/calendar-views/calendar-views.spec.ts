import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { CalendarProjection } from '../../domain/calendar-events';
import { CalendarViews } from './calendar-views';
describe('Calendar presentation lifecycle', () => {
  it('distinguishes failed, loading and empty data, and clears old actor projections', async () => {
    const fixture = TestBed.createComponent(CalendarViews);
    fixture.componentRef.setInput('anchor', '2026-10-08');
    const projection: CalendarProjection = {
      status: 'ready',
      stale: false,
      events: [
        {
          key: 'due',
          title: 'Read-only deadline',
          source: 'workflow',
          kind: 'all_day',
          start: '2026-10-08',
          end: '2026-10-09',
        },
      ],
    };
    fixture.componentRef.setInput('projection', projection);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const selected = vi.fn();
    vm.selected.subscribe(selected);
    for (const view of vm.views) {
      vm.view.set(view);
      expect(vm.events()).toEqual(projection.events);
    }
    vm.open(projection.events[0]);
    expect(selected).toHaveBeenCalledExactlyOnceWith(projection.events[0]);
    TestBed.inject(ActorState).reset();
    expect(vm.events()).toEqual([]);
    expect(vm.state()).toBe('failed');
    vm.open(projection.events[0]);
    expect(selected).toHaveBeenCalledTimes(1);
    for (const status of ['loading', 'failed', 'ready'] as const) {
      fixture.componentRef.setInput('projection', {
        status,
        stale: false,
        events: [],
      });
      await fixture.whenStable();
      const text = fixture.nativeElement.textContent as string;
      expect(text.includes('No events in this range.')).toBe(
        status === 'ready',
      );
      expect(text.includes('Calendar is unavailable.')).toBe(
        status === 'failed',
      );
    }
  });
});
