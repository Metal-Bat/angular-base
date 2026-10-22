import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { emptyQuery, ListQuery, QueryField } from '../../domain/list-query';
import { ListQueryEditor } from './list-query';
import { QuerySorts } from './query-sorts';

const fields: QueryField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'created_at', label: 'Created At', type: 'datetime' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'amount', label: 'Amount', type: 'number' },
];
async function setup(query: ListQuery): Promise<{
  fixture: ComponentFixture<ListQueryEditor>;
  owner: ListQueryEditor;
  child: QuerySorts;
  results: ListQuery[];
}> {
  const fixture = TestBed.createComponent(ListQueryEditor);
  fixture.componentRef.setInput('fields', fields);
  fixture.componentRef.setInput('extraFields', [
    { key: 'include_deleted', label: 'Include deleted' },
  ]);
  fixture.componentRef.setInput('query', query);
  fixture.componentInstance.collapsed = false;
  await fixture.whenStable();
  const child = fixture.debugElement.query(By.directive(QuerySorts))
    .componentInstance as QuerySorts;
  const results: ListQuery[] = [];
  fixture.componentInstance.applied.subscribe((value) => results.push(value));
  return { fixture, owner: fixture.componentInstance, child, results };
}

describe('Named ordered sort controls', () => {
  it('preserves group and multi-field order, typed filters and supported extras', async () => {
    const original: ListQuery = {
      ...emptyQuery(),
      page: 4,
      size: 50,
      filters: [
        { field_name: 'active', operation: 'equal', value: false },
        { field_name: 'amount', operation: 'equal', value: 0 },
      ],
      extras: { include_deleted: false },
      sort_orders: [
        { multi_field: ['name', 'created_at'], operation: 'desc' },
        { field_name: 'status', operation: 'asc' },
      ],
    };
    const { owner, child, results } = await setup(original);
    child.moveField(owner.sorts[0], 1, -1);
    child.moveSort(1, -1);
    owner.apply();
    expect(results).toEqual([
      {
        ...original,
        page: 1,
        sort_orders: [
          { field_name: 'status', operation: 'asc' },
          { multi_field: ['created_at', 'name'], operation: 'desc' },
        ],
      },
    ]);
    expect(original.sort_orders).toEqual([
      { multi_field: ['name', 'created_at'], operation: 'desc' },
      { field_name: 'status', operation: 'asc' },
    ]);
  });
  it('preserves local control identity across replacement and moves without sending UI IDs', async () => {
    const { owner, child, results } = await setup({
      ...emptyQuery(),
      sort_orders: [
        { multi_field: ['name', 'created_at'], operation: 'asc' },
        { field_name: 'status', operation: 'desc' },
      ],
    });
    const sort = owner.sorts[0];
    const groupId = child.id(sort);
    const ids = child.rows(sort).map((row) => row.id);
    child.setField(sort, 0, 'amount');
    expect(child.rows(sort).map((row) => row.id)).toEqual(ids);
    child.moveField(sort, 0, 1);
    expect(child.rows(sort).map((row) => row.id)).toEqual([...ids].reverse());
    child.moveSort(0, 1);
    expect(child.id(owner.sorts[1])).toBe(groupId);
    owner.apply();
    expect(results[0].sort_orders).toEqual([
      { field_name: 'status', operation: 'desc' },
      { multi_field: ['created_at', 'amount'], operation: 'asc' },
    ]);
    expect(sort).toEqual({ fields: 'created_at, amount', operation: 'asc' });
  });
  it('keeps an unavailable saved field until explicit replacement and blocks an invalid request', async () => {
    const { owner, child, results } = await setup({
      ...emptyQuery(),
      sort_orders: [
        { multi_field: ['name', 'future_field'], operation: 'desc' },
      ],
    });
    child.addField(owner.sorts[0]);
    expect(child.names(owner.sorts[0])).toEqual([
      'name',
      'future_field',
      'created_at',
    ]);
    owner.apply();
    expect(results).toEqual([]);
    expect(owner.sortErrors[0]).toBe('Choose an available field.');
    child.setField(owner.sorts[0], 1, 'status');
    owner.apply();
    expect(results[0].sort_orders).toEqual([
      { multi_field: ['name', 'status', 'created_at'], operation: 'desc' },
    ]);
  });
  it('keeps validation attached to the owning group when groups move or are removed', async () => {
    const { owner, child } = await setup({
      ...emptyQuery(),
      sort_orders: [
        { field_name: 'name', operation: 'asc' },
        { field_name: 'status', operation: 'desc' },
      ],
    });
    owner.sortErrors = { 0: 'First error', 1: 'Second error' };
    child.moveSort(1, -1);
    expect(owner.sortErrors).toEqual({ 0: 'Second error', 1: 'First error' });
    child.removeSort(0);
    expect(owner.sortErrors).toEqual({ 0: 'First error' });
    expect(owner.sorts).toEqual([{ fields: 'name', operation: 'asc' }]);
  });
  it('guards edits while loading and rejects duplicate field choices and invalid positions', async () => {
    const { fixture, owner, child } = await setup({
      ...emptyQuery(),
      sort_orders: [{ multi_field: ['name', 'created_at'], operation: 'asc' }],
    });
    const before = structuredClone(owner.sorts);
    child.setField(owner.sorts[0], 1, 'name');
    child.moveField(owner.sorts[0], 0, -1);
    child.moveSort(0, 1);
    expect(owner.sorts).toEqual(before);
    fixture.componentRef.setInput('busy', true);
    child.setField(owner.sorts[0], 0, 'status');
    child.addField(owner.sorts[0]);
    child.removeField(owner.sorts[0], 0);
    child.setDirection(owner.sorts[0], 'desc');
    child.moveField(owner.sorts[0], 0, 1);
    child.removeSort(0);
    child.addSort();
    expect(owner.sorts).toEqual(before);
  });
});
