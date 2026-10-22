import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Locale } from '../../../core/localization/locale';
import { ActorState } from '../../../core/auth/actor-state';
import { TemporalControl } from './temporal-control';
function clock(hour: number, minute = 0, second = 0): Date {
  return new Date(2000, 0, 1, hour, minute, second);
}
async function setup(
  kind: 'date' | 'time' | 'datetime' | 'datetime-local' = 'date',
  value = '',
): Promise<ComponentFixture<TemporalControl>> {
  const fixture = TestBed.createComponent(TemporalControl);
  fixture.componentRef.setInput('controlId', 'temporal');
  fixture.componentRef.setInput('kind', kind);
  fixture.componentRef.setInput('value', value);
  await fixture.whenStable();
  return fixture;
}
describe('Shared temporal control', () => {
  it('reuses calendar cells across different months and updates their date selection', async () => {
    const fixture = await setup('date', '2024-03-20');
    const vm = fixture.componentInstance;
    vm.showCalendar();
    await fixture.whenStable();
    const buttons = (): HTMLButtonElement[] =>
      Array.from(document.querySelectorAll('.calendar-days button'));
    const march = buttons();
    expect(march).toHaveLength(31);
    vm.moveMonth(1);
    vm.moveMonth(1);
    await fixture.whenStable();
    const may = buttons();
    expect(may).toHaveLength(31);
    may.forEach((button, index) => expect(button).toBe(march[index]));
    expect(may[0].dataset['calendarDay']).toBe('2024-05-01');
    vm.moveMonth(-1);
    await fixture.whenStable();
    const april = buttons();
    expect(april).toHaveLength(30);
    april.forEach((button, index) => expect(button).toBe(march[index]));
    expect(april[0].dataset['calendarDay']).toBe('2024-04-01');
    april[12].click();
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-04-13');
    fixture.destroy();
  });
  it('follows language defaults and lets the user override the calendar without changing the value', async () => {
    const fixture = await setup('date', '2024-03-20');
    const vm = fixture.componentInstance;
    const locale = TestBed.inject(Locale);
    const emitted: string[] = [];
    vm.value.subscribe((value) => emitted.push(value));
    await locale.set('fa');
    await fixture.whenStable();
    expect(vm.dateText()).toBe('1403-01-01');
    expect(locale.calendar()).toBe('persian');
    vm.calendarChanged('islamic-civil');
    await fixture.whenStable();
    expect(vm.dateText()).toBe('1445-09-10');
    expect(vm.value()).toBe('2024-03-20');
    expect(emitted).toEqual([]);
    TestBed.inject(ActorState).reset();
    expect(locale.calendarOverride()).toBeNull();
    fixture.destroy();
  });
  it('uses Hijri for Arabic and preserves unsaved input through language changes', async () => {
    const fixture = await setup('date');
    const vm = fixture.componentInstance;
    await TestBed.inject(Locale).set('ar');
    await fixture.whenStable();
    expect(vm.locale.calendar()).toBe('islamic-civil');
    vm.typeDate('1445-09-01');
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-03-11');
    await vm.locale.set('en');
    await fixture.whenStable();
    expect(vm.dateText()).toBe('2024-03-11');
    fixture.destroy();
  });
  it('retains invalid text, prevents stale valid submissions and recovers on correction', async () => {
    const fixture = await setup('date', '2024-03-20');
    const vm = fixture.componentInstance;
    vm.typeDate('2024-02-30');
    await fixture.whenStable();
    expect(vm.dateText()).toBe('2024-02-30');
    expect(vm.error()).toBeTruthy();
    expect(vm.value()).toBe('invalid:2024-02-30');
    await vm.locale.set('fa');
    await fixture.whenStable();
    expect(vm.calendar()).toBe('gregory');
    expect(vm.dateText()).toBe('2024-02-30');
    await vm.locale.set('en');
    await fixture.whenStable();
    vm.typeDate('2024-02-29');
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-02-29');
    expect(vm.error()).toBe('');
    fixture.destroy();
  });
  it('serializes a selected local datetime in the configured timezone as a UTC instant', async () => {
    const fixture = await setup('datetime', '2024-03-20T08:00:00.123456Z');
    const vm = fixture.componentInstance;
    fixture.componentRef.setInput('timezone', 'Asia/Tehran');
    await fixture.whenStable();
    expect(vm.time()?.getHours()).toBe(11);
    expect(vm.value()).toBe('2024-03-20T08:00:00.123456Z');
    vm.timeChanged(clock(12, 30, 15));
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-03-20T09:00:15.000Z');
    fixture.destroy();
  });
  it('rejects DST gaps and requires an explicit offset choice during a fold', async () => {
    const fixture = await setup('datetime');
    const vm = fixture.componentInstance;
    fixture.componentRef.setInput('timezone', 'America/New_York');
    await fixture.whenStable();
    vm.timeChanged(clock(2, 30));
    vm.typeDate('2024-03-10');
    await fixture.whenStable();
    expect(vm.error()).toBe('This local time does not exist');
    vm.timeChanged(clock(1, 30));
    vm.typeDate('2024-11-03');
    await fixture.whenStable();
    expect(vm.candidates()).toEqual([
      '2024-11-03T05:30:00.000Z',
      '2024-11-03T06:30:00.000Z',
    ]);
    vm.chooseInstant(vm.candidates()[1]);
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-11-03T06:30:00.000Z');
    expect(vm.error()).toBe('');
    fixture.destroy();
  });
  it('emits time-only and calendar-event local minutes without inferring a timezone', async () => {
    const fixture = await setup('time', '08:00:00');
    const vm = fixture.componentInstance;
    vm.timeChanged(clock(0, 15, 30));
    await fixture.whenStable();
    expect(vm.value()).toBe('00:15:30');
    fixture.componentRef.setInput('kind', 'datetime-local');
    fixture.componentRef.setInput('value', '2024-03-20T08:00');
    await fixture.whenStable();
    vm.timeChanged(clock(9, 30));
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-03-20T09:30');
    fixture.destroy();
  });
  it('provides labelled themed controls and fences disabled edits, clearing and date selection', async () => {
    const fixture = await setup('date', '2024-03-20');
    const vm = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#temporal')).toBeTruthy();
    expect(root.querySelector('button[aria-label="Choose date"]')).toBeTruthy();
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    vm.typeDate('2025-01-01');
    vm.chooseDate('2025-01-01');
    vm.clear();
    vm.calendarChanged('persian');
    vm.showCalendar();
    expect(vm.value()).toBe('2024-03-20');
    expect(vm.opened()).toBe(false);
    fixture.componentRef.setInput('disabled', false);
    await fixture.whenStable();
    vm.chooseDate('2024-03-21');
    await fixture.whenStable();
    expect(vm.value()).toBe('2024-03-21');
    vm.clear();
    await fixture.whenStable();
    expect(vm.value()).toBe('');
    fixture.destroy();
  });
});

it('preserves existing clocks and gives typed/picked dates the same midnight default', async () => {
  const fixture = await setup('datetime-local');
  const vm = fixture.componentInstance;
  vm.typeDate('2026-10-15');
  await fixture.whenStable();
  expect(vm.value()).toBe('2026-10-15T00:00');
  expect(vm.error()).toBe('');
  vm.timeChanged(clock(11, 30));
  vm.typeDate('2026-10-16');
  await fixture.whenStable();
  expect(vm.value()).toBe('2026-10-16T11:30');
  fixture.destroy();
});
