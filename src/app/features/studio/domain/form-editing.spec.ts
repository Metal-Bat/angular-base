import { JsonObject } from '../../forms/domain/runtime-document';
import {
  addPrimitive,
  authoredNode,
  outline,
  reorderAuthored,
} from './form-authoring';
import {
  fieldRequired,
  FormHistory,
  patchConstraints,
  patchNode,
  removePlacement,
  renderOf,
  schemaAt,
} from './form-editing';
import { messageRevision, translateMessage } from './form-localization';
const empty: JsonObject = {
  data_schema: { type: 'object', properties: {}, metadata: 'keep' },
  render_schema: { root: { component: 'vertical', children: [] } },
  reuse_instances: { preserved: true },
};
describe('Visual form edits', () => {
  it('gives all twenty primitive placements stable keys and preserves identity on reorder', () => {
    let documents = empty;
    for (const kind of [
      'vertical',
      'horizontal',
      'grid',
      'text',
      'textarea',
      'integer',
      'number',
      'date',
      'datetime',
      'boolean',
      'choice',
      'calculated',
      'display',
      'user',
      'group',
      'repeater',
      'table',
      'media',
      'attachment_collection',
      'action',
    ] as const) {
      documents = addPrimitive(documents, [], kind, 'field_' + kind);
    }
    const items = outline(renderOf(documents)).slice(1);
    expect(new Set(items.map((item) => item.identity)).size).toBe(20);
    const moved = reorderAuthored(renderOf(documents), [0], 1);
    expect(authoredNode(moved, [1])['node_key']).toBe(items[0].identity);
    expect(documents['reuse_instances']).toEqual({ preserved: true });
  });
  it('patches nested collection constraints and requiredness without renaming fields', () => {
    const rows = addPrimitive(empty, [], 'repeater', 'rows');
    const nested = addPrimitive(rows, [0], 'text', 'note');
    const scope = '/properties/rows/items/properties/note';
    const next = patchConstraints(
      nested,
      scope,
      { minLength: 0, maxLength: 40 },
      true,
    );
    expect(fieldRequired(next, scope)).toBe(true);
    expect(schemaAt(next, scope)['minLength']).toBe(0);
    expect(fieldRequired(nested, scope)).toBe(false);
    expect(() =>
      patchConstraints(nested, scope, { minLength: -1 }, true),
    ).toThrow();
    expect(() =>
      patchConstraints(nested, scope, { maximum: Infinity }, true),
    ).toThrow();
    expect(() =>
      patchConstraints(nested, scope, { maxItems: 257 }, true),
    ).toThrow();
    expect(next['reuse_instances']).toEqual(nested['reuse_instances']);
    expect(() =>
      patchConstraints(next, scope, { minimum: 10, maximum: 0 }, true),
    ).toThrow();
    expect(() => patchNode(next, [0, 0], { scope: '/renamed' })).toThrow();
  });
  it('removes placement while retaining canonical schema and restores bounded history', () => {
    const initial = addPrimitive(empty, [], 'boolean', 'flag');
    const next = removePlacement(initial, [0]);
    expect(next['data_schema']).toEqual(initial['data_schema']);
    expect(outline(renderOf(next))).toHaveLength(1);
    const history = new FormHistory();
    for (let index = 0; index < 25; index++) {
      history.record({ documents: { index }, selection: [] });
    }
    let restored = 0;
    while (history.take({ documents: {}, selection: [] })) {
      restored++;
    }
    expect(restored).toBe(20);
    history.clear();
    expect(history.take({ documents: next, selection: [] }, true)).toBeNull();
  });
});
describe('Author-owned catalog revisions', () => {
  it('matches the backend ASCII compact source revision and updates only a selected message', async () => {
    expect(await messageRevision('Hello')).toBe(
      '1d3a7518ed10d70ae9c71e10dbb46b51eb4e3fe940a24b91c7e96369a8fc21ed',
    );
    expect(await messageRevision('\u007f')).toBe(
      'cb92c1c2dab7af8a77a375fd9c1a616e6f131c54b5acf82f8701a351dd40ff08',
    );
    expect(
      await messageRevision('\u0641\u0627\u0631\u0633\u06cc \ud83d\ude42'),
    ).toBe('fc09e9d39d1ea9bcb1574c383e52ce2be28da2be7a151ada824b6c62e7d5ad0a');
    const result = await translateMessage(
      {
        ...empty,
        localization: {
          catalogs: { en: { untouched: { text: 'Keep', parameters: {} } } },
        },
      },
      'field.label',
      'Amount',
      'مبلغ',
    );
    const catalogs = (result['localization'] as JsonObject)[
      'catalogs'
    ] as JsonObject;
    expect((catalogs['en'] as JsonObject)['untouched']).toEqual({
      text: 'Keep',
      parameters: {},
    });
    expect(
      ((catalogs['fa'] as JsonObject)['field.label'] as JsonObject)[
        'source_revision'
      ],
    ).toBe(await messageRevision('Amount'));
    expect(result['reuse_instances']).toEqual(empty['reuse_instances']);
  });
  it('rejects blank or unsupported parameterized messages without partial writes', async () => {
    await expect(translateMessage(empty, 'key', '', 'متن')).rejects.toThrow();
    await expect(
      translateMessage(
        {
          localization: {
            catalogs: {
              en: { key: { text: '{name}', parameters: { name: 'string' } } },
            },
          },
        },
        'key',
        'Hello',
        'سلام',
      ),
    ).rejects.toThrow('Parameterized');
  });
});
