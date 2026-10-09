import { emptyQuery } from '../../../shared/domain/list-query';
import {
  applyListView,
  captureListView,
  ListViewScope,
  ViewRepairRequired,
} from './saved-list-view';
const scope: ListViewScope = {
  key: 'requests',
  schemaVersion: 1,
  extras: [],
  columns: ['name', 'priority'],
  fields: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'priority', label: 'Priority', type: 'number' },
  ],
};
describe('Private saved-view query preparation', () => {
  it('captures the applied page-two query without its page, preserving sort order and canonical values', () => {
    const query = {
      ...emptyQuery(),
      page: 2,
      size: 40,
      filters: [
        { field_name: 'priority', operation: 'gte' as const, value: 0 },
      ],
      sort_orders: [
        { multi_field: ['priority', 'name'], operation: 'desc' as const },
      ],
    };
    const view = captureListView(
      'Useful view',
      query,
      ['name', 'priority'],
      scope,
    );
    query.filters[0].value = 99;
    expect(Object.hasOwn(view.query, 'page')).toBe(false);
    expect(applyListView(view, scope)).toEqual({
      ...query,
      page: 1,
      filters: [{ field_name: 'priority', operation: 'gte', value: 0 }],
    });
  });
  it('requires explicit repair rather than dropping a removed restrictive filter', () => {
    const view = captureListView(
      'Private view',
      {
        ...emptyQuery(),
        filters: [
          {
            field_name: 'name',
            operation: 'contains',
            value: 'private search text',
          },
        ],
      },
      ['name'],
      scope,
    );
    const before = structuredClone(view);
    try {
      applyListView(view, {
        ...scope,
        fields: scope.fields.filter((field) => field.key !== 'name'),
      });
      throw Error('Unexpectedly broadened view');
    } catch (error) {
      expect(error).toBeInstanceOf(ViewRepairRequired);
      expect(String(error)).not.toContain('private search text');
    }
    expect(view).toEqual(before);
  });
  it('rejects changed schema, removed columns, invalid operators and typed-value drift', () => {
    const view = captureListView('View', emptyQuery(), ['name'], scope);
    expect(() => applyListView(view, { ...scope, schemaVersion: 2 })).toThrow(
      ViewRepairRequired,
    );
    expect(() => applyListView(view, { ...scope, columns: [] })).toThrow(
      ViewRepairRequired,
    );
    expect(() =>
      captureListView(
        'View',
        {
          ...emptyQuery(),
          filters: [
            { field_name: 'priority', operation: 'contains', value: 1 },
          ],
        },
        [],
        scope,
      ),
    ).toThrow(ViewRepairRequired);
    expect(() =>
      captureListView(
        'View',
        {
          ...emptyQuery(),
          filters: [{ field_name: 'priority', operation: 'equal', value: '0' }],
        },
        [],
        scope,
      ),
    ).toThrow(ViewRepairRequired);
  });
  it('refuses to persist revision-sensitive opaque references and secret extras', () => {
    expect(() =>
      captureListView(
        'View',
        {
          ...emptyQuery(),
          filters: [
            {
              field_name: 'workflow_ref_id',
              operation: 'equal',
              value: 'stale-ref',
            },
          ],
        },
        [],
        {
          ...scope,
          fields: [
            ...scope.fields,
            { key: 'workflow_ref_id', label: 'Workflow', type: 'text' },
          ],
        },
      ),
    ).toThrow(ViewRepairRequired);
    expect(() =>
      captureListView(
        'View',
        { ...emptyQuery(), extras: { token: 'secret' } },
        [],
        { ...scope, extras: ['token'] },
      ),
    ).toThrow(ViewRepairRequired);
  });
});
