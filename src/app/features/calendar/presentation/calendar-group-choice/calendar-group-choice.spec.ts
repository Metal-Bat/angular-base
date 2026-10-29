import { By } from '@angular/platform-browser';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { CalendarGroupPage } from '../../application/calendar-port';
import { CALENDAR } from '../../bindings';
import { CalendarGroupChoice } from './calendar-group-choice';
const page: CalendarGroupPage = {
  items: [{ key: 'current-group', value: 'Finance' }],
  page: 1,
  total: 11,
  totalPages: 2,
};
describe('Current Calendar group membership picker', () => {
  it('loads named memberships on demand, retains selection and uses the applied query for paging', async () => {
    const groups = vi.fn().mockResolvedValue(page);
    TestBed.configureTestingModule({
      providers: [{ provide: CALENDAR, useValue: { groups } }],
    });
    const fixture = TestBed.createComponent(CalendarGroupChoice);
    const vm = fixture.componentInstance;
    const picked = vi.fn();
    vm.picked.subscribe(picked);
    await fixture.whenStable();
    expect(groups).not.toHaveBeenCalled();
    fixture.debugElement
      .query(By.directive(SelectControl))
      .componentInstance.choose('group');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Finance');
    vm.choose('foreign-group');
    expect(picked).not.toHaveBeenCalled();
    fixture.debugElement
      .queryAll(By.directive(SelectControl))[1]
      .componentInstance.choose('current-group');
    expect(picked).toHaveBeenLastCalledWith('current-group');
    fixture.componentRef.setInput('value', 'current-group');
    await fixture.whenStable();
    vm.search = 'Finance';
    await vm.load(1, true);
    vm.search = 'unfinished new text';
    await vm.load(2);
    expect(groups).toHaveBeenLastCalledWith(
      'Finance',
      2,
      expect.any(AbortSignal),
    );
    expect(vm.value()).toBe('current-group');
    vm.scope('personal');
    expect(picked).toHaveBeenLastCalledWith(null);
  });
  it('discards late membership responses and private selection on actor cleanup', async () => {
    let finish!: (value: CalendarGroupPage) => void;
    const pending = new Promise<CalendarGroupPage>((resolve) => {
      finish = resolve;
    });
    const groups = vi.fn().mockReturnValue(pending);
    TestBed.configureTestingModule({
      providers: [{ provide: CALENDAR, useValue: { groups } }],
    });
    const fixture = TestBed.createComponent(CalendarGroupChoice);
    fixture.componentRef.setInput('value', 'old-group');
    await fixture.whenStable();
    TestBed.inject(ActorState).reset();
    finish(page);
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBeNull();
    expect(fixture.componentInstance.active()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('Finance');
    expect(groups).toHaveBeenCalledTimes(1);
  });
  it('clears revoked search results and keeps the selected reference for explicit correction', async () => {
    const groups = vi
      .fn()
      .mockResolvedValueOnce(page)
      .mockRejectedValueOnce(Error('Revoked'));
    TestBed.configureTestingModule({
      providers: [{ provide: CALENDAR, useValue: { groups } }],
    });
    const fixture = TestBed.createComponent(CalendarGroupChoice);
    fixture.componentRef.setInput('value', 'current-group');
    await fixture.whenStable();
    await fixture.componentInstance.load();
    await fixture.whenStable();
    expect(fixture.componentInstance.page()).toBeNull();
    expect(fixture.componentInstance.value()).toBe('current-group');
    expect(fixture.nativeElement.textContent).toContain(
      'Previously selected group',
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });
});
