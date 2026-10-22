import { inspectionQuery, scopeRowCount } from './form-inspection';
import { JsonObject } from '../../forms/domain/runtime-document';

const documents: JsonObject = {
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        { component: 'choice', scope: '/properties/items' },
        {
          component: 'choice',
          scope:
            '/properties/lines/items/properties/tags/items/properties/value',
        },
        { component: 'text', navigation: { route: 'configured' } },
      ],
    },
  },
};
const input = { search: '', page: '1', rows: [] };
describe('Selected-field inspection queries', () => {
  it('derives the pointer and retains the exact synthetic answer owner, including false and zero', () => {
    const data = { flag: false, amount: 0, items: null };
    const query = inspectionQuery('options', documents, [0], data, input);
    expect(query).toEqual({
      node_pointer: '/root/children/0',
      data,
      page: 1,
      size: 20,
      search: null,
      row_indices: [],
      selected_keys: [],
      generation: 0,
    });
    expect(query['data']).toBe(data);
    expect(scopeRowCount('/properties/items')).toBe(0);
    expect(scopeRowCount('/properties/itemset')).toBe(0);
  });
  it('requires explicit valid row positions and preserves localized input semantics', () => {
    expect(() =>
      inspectionQuery('options', documents, [1], {}, input),
    ).toThrow();
    const query = inspectionQuery(
      'options',
      documents,
      [1],
      {},
      {
        search: 'Invoice',
        page: '۲',
        rows: ['۱', '۲۵۶'],
      },
    );
    expect(query).toMatchObject({
      page: 2,
      search: 'Invoice',
      row_indices: [0, 255],
    });
    for (const row of ['', '0', '-1', '257', '1.5', '9007199254740993']) {
      expect(() =>
        inspectionQuery(
          'options',
          documents,
          [1],
          {},
          {
            ...input,
            rows: [row, '1'],
          },
        ),
      ).toThrow();
    }
  });
  it('rejects invalid pages, excessive queries and unsupported selected kinds', () => {
    for (const page of ['', '0', '-1', '1.5', '1e309', '9007199254740993']) {
      expect(() =>
        inspectionQuery('options', documents, [0], {}, { ...input, page }),
      ).toThrow();
    }
    expect(() =>
      inspectionQuery(
        'options',
        documents,
        [0],
        {},
        { ...input, search: 'x'.repeat(101) },
      ),
    ).toThrow();
    expect(() =>
      inspectionQuery('options', documents, [2], {}, input),
    ).toThrow();
  });
  it('previews a configured navigation using current answers without executing it or adding option-only keys', () => {
    expect(
      inspectionQuery('navigation', documents, [2], { flag: false }, input),
    ).toEqual({
      node_pointer: '/root/children/2',
      data: { flag: false },
    });
    expect(() =>
      inspectionQuery('navigation', documents, [0], {}, input),
    ).toThrow();
  });
});
