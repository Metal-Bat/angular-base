import { By } from '@angular/platform-browser';
import { TemporalControl } from '../temporal-control/temporal-control';
import { Locale } from '../../../core/localization/locale';
import { TestBed } from '@angular/core/testing';
import { emptyQuery, ListQuery } from '../../domain/list-query';
import { QueryFilters } from './query-filters';
import { ListQueryEditor } from './list-query';

describe('List query form sections', () => {
  it('reports the whole filter editing session to its refresh owner', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', []);
    await fixture.whenStable();
    const editing = vi.fn();
    fixture.componentInstance.editing.subscribe(editing);
    const toggle = fixture.nativeElement.querySelector(
      'button[aria-label="Advanced filters"]',
    ) as HTMLButtonElement;
    toggle.click();
    await fixture.whenStable();
    expect(editing).toHaveBeenLastCalledWith(true);
    toggle.click();
    await fixture.whenStable();
    expect(editing.mock.calls).toEqual([[true], [false]]);
  });
  it('keeps an unfinished condition when polling returns the same applied query on another page', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'name', label: 'Name', type: 'text' },
    ]);
    fixture.componentRef.setInput('query', emptyQuery());
    await fixture.whenStable();
    fixture.componentInstance.addFilter();
    fixture.componentInstance.filters[0].value = 'Unfinished';
    const condition = fixture.componentInstance.filters[0];
    fixture.componentRef.setInput('query', { ...emptyQuery(), page: 2 });
    await fixture.whenStable();
    expect(fixture.componentInstance.filters[0]).toBe(condition);
    expect(condition.value).toBe('Unfinished');
    fixture.componentInstance.cancel();
    expect(fixture.componentInstance.filters).toEqual([]);
  });
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

  it('keeps condition control identity and its error after removing an earlier condition', async () => {
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'name', label: 'Name', type: 'text' },
    ]);
    fixture.componentRef.setInput('query', {
      ...emptyQuery(),
      size: 50,
      filters: [
        { field_name: 'name', operation: 'contains', value: 'Yes' },
        { field_name: 'name', operation: 'notEqual', value: 'No' },
      ],
    });
    const vm = fixture.componentInstance;
    vm.collapsed = false;
    await fixture.whenStable();
    const child = fixture.debugElement.query(By.directive(QueryFilters))
      .componentInstance as QueryFilters;
    const surviving = vm.filters[1];
    const id = child.id(surviving);
    vm.filterErrors = { 1: 'Keep this error' };
    child.remove(0);
    await fixture.whenStable();
    expect(child.id(vm.filters[0])).toBe(id);
    expect(vm.filterErrors).toEqual({ 0: 'Keep this error' });
    expect(
      fixture.nativeElement.querySelector('#' + id + '-field'),
    ).toBeTruthy();
    vm.cancel();
    expect(vm.filters.map((row) => row.value)).toEqual(['Yes', 'No']);
    expect(vm.filterErrors).toEqual({});
    const emitted: ListQuery[] = [];
    vm.applied.subscribe((query) => emitted.push(query));
    vm.reset();
    expect(emitted).toEqual([{ ...emptyQuery(), size: 50 }]);
  });
  it('round-trips agent filters and summarizes exact numbers and literal text', async () => {
    const query: ListQuery = {
      ...emptyQuery(),
      filters: [
        { field_name: 'status', operation: 'equal', value: 'PUBLISHED' },
        { field_name: 'name', operation: 'contains', value: 'purchase' },
        { field_name: 'number', operation: 'gte', value: 2 },
      ],
      sort_orders: [
        { field_name: 'created_at', operation: 'desc' },
        { field_name: 'name', operation: 'asc' },
      ],
    };
    const fixture = TestBed.createComponent(ListQueryEditor);
    fixture.componentRef.setInput('fields', [
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'number', label: 'Version', type: 'number' },
      { key: 'created_at', label: 'Created At', type: 'datetime' },
    ]);
    fixture.componentRef.setInput('query', query);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const emitted: ListQuery[] = [];
    vm.applied.subscribe((value) => emitted.push(value));
    vm.apply();
    expect(emitted).toEqual([query]);
    expect(vm.appliedSummary()).toEqual([
      'Status Equals PUBLISHED',
      'Name Contains purchase',
      'Version At least 2',
      'Sort 1: Created At · Descending',
      'Sort 2: Name · Ascending',
    ]);
    fixture.componentRef.setInput('query', {
      ...query,
      filters: [
        { field_name: 'number', operation: 'equal', value: 1.23456789 },
        { field_name: 'name', operation: 'equal', value: 'Yes' },
      ],
    });
    await fixture.whenStable();
    expect(vm.appliedSummary().slice(0, 2)).toEqual([
      'Version Equals 1.23456789',
      'Name Equals Yes',
    ]);
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
