import {
  compileQuery,
  emptyQuery,
  FilterDraft,
  queryBody,
  QueryField,
} from './list-query';
const fields: QueryField[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'count', label: 'Count', type: 'number' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'changed_at', label: 'Changed', type: 'datetime', nullable: true },
];
const filter = (
  field: string,
  operation: FilterDraft['operation'],
  value: string,
  end = '',
): FilterDraft => ({ field, operation, value, end });
describe('Backend list query contract', () => {
  it('serializes typed filters, nulls and ordered multi-field sorts', () => {
    const q = compileQuery(
      fields,
      [
        filter('count', 'between', '2', '8'),
        filter('active', 'in', 'true\nfalse'),
        filter('changed_at', 'isNull', ''),
      ],
      [
        { fields: 'name, changed_at', operation: 'desc' },
        { fields: 'count', operation: 'asc' },
      ],
      50,
      { include_deleted: true },
      ['include_deleted'],
    );
    expect(queryBody(q, [], ['include_deleted'])).toEqual({
      page: 1,
      size: 50,
      include_deleted: true,
      filters: [
        { field_name: 'count', operation: 'between', value: [2, 8] },
        { field_name: 'active', operation: 'in', value: [true, false] },
        { field_name: 'changed_at', operation: 'isNull', value: null },
      ],
      sort_orders: [
        { multi_field: ['name', 'changed_at'], operation: 'desc' },
        { field_name: 'count', operation: 'asc' },
      ],
    });
  });
  it.each([
    filter('active', 'contains', 'true'),
    filter('unknown', 'equal', 'x'),
    filter('count', 'equal', 'oops'),
    filter('active', 'equal', 'yes'),
    filter('name', 'in', ''),
    filter('count', 'between', '1', ''),
    filter('changed_at', 'equal', '2026-10-04T12:00:00'),
  ])('rejects invalid typed filter %j', (draft) =>
    expect(() => compileQuery(fields, [draft], [], 20, {}, [])).toThrow(),
  );
  it('rejects unavailable extras, duplicate sort fields and page sizes', () => {
    expect(() =>
      queryBody({ ...emptyQuery(), extras: { is_active: true } }),
    ).toThrow();
    expect(() =>
      compileQuery(
        fields,
        [],
        [{ fields: 'name,name', operation: 'asc' }],
        20,
        {},
        [],
      ),
    ).toThrow();
    expect(() => compileQuery(fields, [], [], 101, {}, [])).toThrow();
  });
  it('freezes the applied snapshot and fixed partition without mutating either', () => {
    const q = emptyQuery();
    q.filters = [{ field_name: 'name', operation: 'contains', value: 'Ali' }];
    const body = queryBody(q, [
      { field_name: 'active', operation: 'equal', value: false },
    ]);
    q.filters[0].value = 'Changed';
    expect(body['filters']).toEqual([
      { field_name: 'active', operation: 'equal', value: false },
      { field_name: 'name', operation: 'contains', value: 'Ali' },
    ]);
  });
});
