import { By } from '@angular/platform-browser';
import { TemporalControl } from '../temporal-control/temporal-control';
import { Locale } from '../../../core/localization/locale';
import { TestBed } from '@angular/core/testing';
import { emptyQuery, ListQuery } from '../../domain/list-query';
import { ListQueryEditor } from './list-query';

describe('List query form sections', () => {
  it('renders replacement queries and clears the filter section from the parent form', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'name', label: 'Name', type: 'text' },
    ]);
    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      filters: [{ field_name: 'name', operation: 'equal', value: 'Ada' }],
    });
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    root
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Advanced filters"]',
      )!
      .click();
    await fixture.whenStable();
    const value = (): HTMLInputElement | null =>
      root.querySelector('input[data-query-value="0"]');
    expect(value()?.value).toBe('Ada');

    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      filters: [{ field_name: 'name', operation: 'equal', value: 'Grace' }],
    });
    await fixture.whenStable();
    expect(value()?.value).toBe('Grace');

    const emitted: ListQuery[] = [];
    fixture.componentInstance.applied.subscribe((query) => emitted.push(query));
    [...root.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Clear')!
      .click();
    await fixture.whenStable();
    expect(value()).toBeNull();
    expect(emitted.at(-1)?.filters).toEqual([]);
  });

  it('shows validation from the parent and submits corrected filter values', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'count', label: 'Count', type: 'number' },
    ]);
    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      filters: [{ field_name: 'count', operation: 'between', value: [1, 9] }],
    });
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    root
      .querySelector<HTMLButtonElement>(
        'button[aria-label="Advanced filters"]',
      )!
      .click();
    await fixture.whenStable();
    const value = root.querySelector<HTMLInputElement>(
      'input[data-query-value="0"]',
    )!;
    const form = root.querySelector<HTMLFormElement>('form')!;
    const emitted: ListQuery[] = [];
    fixture.componentInstance.applied.subscribe((query) => emitted.push(query));
    value.value = '';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(emitted).toHaveLength(0);
    expect(root.querySelector('app-query-filters [role="alert"]')).toBeTruthy();
    value.value = '2';
    value.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await fixture.whenStable();
    expect(emitted.at(-1)?.filters).toEqual([
      { field_name: 'count', operation: 'between', value: [2, 9] },
    ]);
    expect(root.querySelector('app-query-filters [role="alert"]')).toBeNull();
  });
});

describe('Temporal query controls', () => {
  it('compiles Jalali range inputs to Gregorian dates and blocks invalid drafts', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    const vm = fixture.componentInstance;
    fixture.componentRef.setInput('fields', [
      { key: 'day', label: 'Date', type: 'date' },
    ]);
    vm.collapsed = false;
    vm.filters = [
      {
        field: 'day',
        operation: 'between',
        value: '2024-03-20',
        end: '2024-03-21',
      },
    ];
    await TestBed.inject(Locale).set('fa');
    await fixture.whenStable();
    const pickers = fixture.debugElement
      .queryAll(By.directive(TemporalControl))
      .map((element) => element.componentInstance as TemporalControl);
    expect(pickers).toHaveLength(2);
    expect(pickers[0].dateText()).toBe('1403-01-01');
    const emitted: ListQuery[] = [];
    vm.applied.subscribe((query) => emitted.push(query));
    pickers[0].typeDate('1403-01-03');
    pickers[1].typeDate('1403-01-04');
    await fixture.whenStable();
    vm.apply();
    expect(emitted.at(-1)?.filters[0].value).toEqual([
      '2024-03-22',
      '2024-03-23',
    ]);
    pickers[0].typeDate('1403-13-01');
    await fixture.whenStable();
    vm.apply();
    expect(emitted).toHaveLength(1);
    expect(vm.error).toBeTruthy();
    fixture.destroy();
  });
  it('uses pickers for every datetime membership value with timezone-aware serialization', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    const vm = fixture.componentInstance;
    fixture.componentRef.setInput('fields', [
      { key: 'created_at', label: 'Created At', type: 'datetime' },
    ]);
    vm.collapsed = false;
    vm.filters = [
      {
        field: 'created_at',
        operation: 'in',
        value: '2024-03-20T08:00:00Z\n2024-03-21T09:00:00Z',
        end: '',
      },
    ];
    await fixture.whenStable();
    const pickers = fixture.debugElement
      .queryAll(By.directive(TemporalControl))
      .map((element) => element.componentInstance as TemporalControl);
    expect(pickers).toHaveLength(2);
    const emitted: ListQuery[] = [];
    vm.applied.subscribe((query) => emitted.push(query));
    pickers[1].timeChanged(new Date(2000, 0, 1, 10, 30));
    await fixture.whenStable();
    vm.apply();
    expect(emitted.at(-1)?.filters[0].value).toEqual([
      '2024-03-20T08:00:00Z',
      '2024-03-21T10:30:00.000Z',
    ]);
    fixture.destroy();
  });
});
