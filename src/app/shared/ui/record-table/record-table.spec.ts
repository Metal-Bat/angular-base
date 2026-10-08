import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { RecordTable } from './record-table';
import { emptyQuery, ListQuery, QueryField } from '../../domain/list-query';

describe('Server-backed record table', () => {
  it('offers labelled icon actions only when their capabilities are configured', async () => {
    const fixture = setup();
    const row = { name: 'Ada' };
    fixture.componentRef.setInput('rows', [row]);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Open"] .pi-eye'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="Edit"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('button[aria-label="More actions"]'),
    ).toBeNull();
    fixture.componentRef.setInput('canEdit', () => true);
    fixture.componentRef.setInput('moreActions', () => [
      { key: 'history', label: 'History', icon: 'pi pi-history' },
    ]);
    await fixture.whenStable();
    const edited: Record<string, unknown>[] = [];
    fixture.componentInstance.edited.subscribe((value) => edited.push(value));
    fixture.nativeElement.querySelector('button[aria-label="Edit"]').click();
    expect(edited).toEqual([row]);
    expect(
      fixture.nativeElement.querySelector('button[aria-label="More actions"]'),
    ).toBeTruthy();
  });
  it('resets page size to page one while preserving the applied query and blocks changes while busy', () => {
    const query: ListQuery = {
      ...emptyQuery(),
      page: 3,
      filters: [{ field_name: 'name', operation: 'contains', value: 'Ada' }],
      sort_orders: [{ field_name: 'name', operation: 'desc' }],
      extras: { include_deleted: true },
    };
    const fixture = setup(query);
    const emitted: ListQuery[] = [];
    fixture.componentInstance.queried.subscribe((value) => emitted.push(value));
    fixture.componentInstance.resize(50);
    expect(emitted).toEqual([{ ...query, page: 1, size: 50 }]);
    expect(query.page).toBe(3);
    fixture.componentRef.setInput('busy', true);
    fixture.componentInstance.resize(100);
    expect(emitted).toHaveLength(1);
  });
  const fields: QueryField[] = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'count', label: 'Count', type: 'number' },
    { key: 'active', label: 'Active', type: 'boolean' },
  ];
  function setup(query = emptyQuery()): ComponentFixture<RecordTable> {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    const fixture = TestBed.createComponent(RecordTable);
    fixture.componentRef.setInput('rows', []);
    fixture.componentRef.setInput('columns', fields);
    fixture.componentRef.setInput('fields', fields);
    fixture.componentRef.setInput('query', query);
    return fixture;
  }
  it('sends typed header filters and preserves other filters, extras and sort order', () => {
    const query: ListQuery = {
      ...emptyQuery(),
      page: 3,
      extras: { include_deleted: true },
      filters: [{ field_name: 'name', operation: 'contains', value: 'Ada' }],
      sort_orders: [{ multi_field: ['name', 'count'], operation: 'desc' }],
    };
    const fixture = setup(query);
    const emitted: ListQuery[] = [];
    fixture.componentInstance.queried.subscribe((q) => emitted.push(q));
    fixture.componentInstance.startFilter(fields[2]);
    fixture.componentInstance.draft.value = 'false';
    expect(fixture.componentInstance.applyFilter()).toBe(true);
    expect(emitted[0]).toEqual({
      ...query,
      page: 1,
      filters: [
        ...query.filters,
        { field_name: 'active', operation: 'equal', value: false },
      ],
    });
    fixture.componentInstance.startFilter(fields[1]);
    fixture.componentInstance.draft = {
      field: 'count',
      operation: 'between',
      value: '0',
      end: '8',
    };
    fixture.componentInstance.applyFilter();
    expect(emitted[1].filters.at(-1)?.value).toEqual([0, 8]);
    expect(query.page).toBe(3);
    expect(query.filters).toHaveLength(1);
  });
  it('rejects malformed filters without emitting and clears just the selected column', () => {
    const query = {
      ...emptyQuery(),
      filters: [
        { field_name: 'name', operation: 'contains' as const, value: 'Ada' },
        { field_name: 'count', operation: 'gt' as const, value: 2 },
      ],
    };
    const fixture = setup(query);
    const emitted: ListQuery[] = [];
    fixture.componentInstance.queried.subscribe((q) => emitted.push(q));
    fixture.componentInstance.startFilter(fields[1]);
    fixture.componentInstance.draft.value = 'invalid';
    expect(fixture.componentInstance.applyFilter()).toBe(false);
    expect(emitted).toHaveLength(0);
    fixture.componentInstance.applyFilter(true);
    expect(emitted[0].filters).toEqual([query.filters[0]]);
  });
  it('retains remaining compound-sort fields when changing a column direction', () => {
    const fixture = setup({
      ...emptyQuery(),
      sort_orders: [{ multi_field: ['name', 'count'], operation: 'asc' }],
    });
    const emitted: ListQuery[] = [];
    fixture.componentInstance.queried.subscribe((q) => emitted.push(q));
    fixture.componentInstance.sort('name');
    expect(emitted[0].sort_orders).toEqual([
      { field_name: 'count', operation: 'asc' },
      { field_name: 'name', operation: 'desc' },
    ]);
  });
  it('accepts valid pages and rejects fractions, out-of-range pages and busy navigation', () => {
    const fixture = setup();
    fixture.componentRef.setInput('pages', 8);
    const emitted: number[] = [];
    fixture.componentInstance.pageChanged.subscribe((page) =>
      emitted.push(page),
    );
    for (const page of ['0', '9', '2.5', 'invalid', '1', '8']) {
      fixture.componentInstance.go(page);
    }
    expect(emitted).toEqual([8]);
    fixture.componentRef.setInput('busy', true);
    fixture.componentInstance.go(2);
    expect(emitted).toEqual([8]);
  });
});
