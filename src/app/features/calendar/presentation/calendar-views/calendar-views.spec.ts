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
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('.calendar-agenda > section'),
    ).toHaveLength(1);
    vm.workflow.set(false);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelectorAll('.calendar-agenda > section'),
    ).toHaveLength(0);
    vm.workflow.set(true);
    await fixture.whenStable();
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

it('labels an incomplete empty period as partial and offers refresh without claiming no events', async () => {
  const fixture = TestBed.createComponent(CalendarViews);
  fixture.componentRef.setInput('anchor', '2026-10-08');
  fixture.componentRef.setInput('projection', {
    status: 'partial',
    stale: true,
    events: [],
  });
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  expect(root.textContent).toContain('Only some events are shown.');
  expect(root.textContent).not.toContain('No events in this range.');
  const refresh = vi.fn();
  fixture.componentInstance.refreshRequested.subscribe(refresh);
  [...root.querySelectorAll('button')]
    .find((button) => button.textContent?.trim() === 'Refresh')!
    .click();
  expect(refresh).toHaveBeenCalledOnce();
  fixture.destroy();
});
