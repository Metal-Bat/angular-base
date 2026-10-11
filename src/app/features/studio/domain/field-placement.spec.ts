import { placeField, placementFields } from './field-placement';
import { JsonObject } from '../../forms/domain/runtime-document';
import { removePlacement } from './form-editing';
import { authoredNode } from './form-authoring';
const document: JsonObject = {
  data_schema: {
    type: 'object',
    properties: {
      flag: { type: 'boolean', default: false },
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: { amount: { type: 'integer', minimum: 0 } },
        },
      },
    },
  },
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        { component: 'boolean', scope: '/properties/flag', node_key: 'flag' },
        {
          component: 'repeater',
          scope: '/properties/rows',
          node_key: 'rows',
          children: [],
        },
      ],
    },
  },
  reuse_instances: { retained: true },
};
describe('Existing field placements', () => {
  it('reuses collection presentation and child configuration with distinct placement identities', () => {
    const configured = structuredClone(document);
    const original = authoredNode(
      configured['render_schema'] as JsonObject,
      [1],
    ) as Record<
      string,
      import('../../forms/domain/runtime-document').JsonValue
    >;
    original['options'] = { min_items: 0, allow_reorder: true };
    original['children'] = [
      {
        component: 'integer',
        node_key: 'note',
        scope: '/properties/rows/items/properties/amount',
        messages: { label: { key: 'amount', arguments: {} } },
      },
    ];
    const next = placeField(configured, [], '/properties/rows');
    const placed = authoredNode(next['render_schema'] as JsonObject, [2]);
    expect(placed['component']).toBe('repeater');
    expect(placed['scope']).toBe('/properties/rows');
    expect(placed['options']).toEqual(original['options']);
    expect(placed['node_key']).not.toBe(original['node_key']);
    const child = (placed['children'] as JsonObject[])[0];
    expect(child['node_key']).not.toBe('note');
    expect(child['messages']).toEqual(
      (original['children'] as JsonObject[])[0]['messages'],
    );
    expect(next['data_schema']).toEqual(configured['data_schema']);
    expect(next['reuse_instances']).toEqual(configured['reuse_instances']);
  });
  it('preserves choice sources, media restrictions and localized bindings instead of inferring text', () => {
    const configured: JsonObject = {
      data_schema: {
        type: 'object',
        properties: {
          choice: { type: 'string' },
          file: { type: 'string' },
          attachments: { type: 'array', items: { type: 'string' } },
        },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'choice',
              node_key: 'choice',
              scope: '/properties/choice',
              source: { kind: 'domain', selector: 'users' },
              messages: { label: { key: 'choice_label', arguments: {} } },
            },
            {
              component: 'media',
              node_key: 'file',
              scope: '/properties/file',
              options: {
                allowed_mime_types: ['text/plain'],
                max_item_bytes: 1024,
              },
            },
            {
              component: 'attachment_collection',
              node_key: 'files',
              scope: '/properties/attachments',
              options: { allow_duplicates: false },
            },
          ],
        },
      },
      localization: { preserved: true },
    };
    for (const field of ['choice', 'file', 'attachments']) {
      const next = placeField(configured, [], '/properties/' + field);
      const existing = (configured['render_schema'] as JsonObject)[
        'root'
      ] as JsonObject;
      const original = (existing['children'] as JsonObject[]).find(
        (node) => node['scope'] === '/properties/' + field,
      )!;
      const placed = authoredNode(next['render_schema'] as JsonObject, [3]);
      expect({ ...placed, node_key: original['node_key'] }).toEqual(original);
      expect(placed['node_key']).not.toBe(original['node_key']);
      expect(next['data_schema']).toEqual(configured['data_schema']);
      expect(next['localization']).toEqual(configured['localization']);
    }
  });
  it('restores object collections and rejects ambiguous unplaced arrays', () => {
    const removed = removePlacement(document, [1]);
    const next = placeField(removed, [], '/properties/rows');
    expect(
      authoredNode(next['render_schema'] as JsonObject, [1]),
    ).toMatchObject({
      component: 'repeater',
      scope: '/properties/rows',
      children: [],
    });
    expect(next['data_schema']).toEqual(document['data_schema']);
    expect(
      placementFields(
        {
          ...removed,
          data_schema: {
            type: 'object',
            properties: {
              unknown: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        [],
      ),
    ).toEqual([]);
  });
  it('restores removed presentation without recreating the canonical field', () => {
    const removed = removePlacement(document, [0]);
    const next = placeField(removed, [], '/properties/flag');
    expect(next['data_schema']).toEqual(document['data_schema']);
    expect(next['reuse_instances']).toEqual(document['reuse_instances']);
    expect(
      authoredNode(next['render_schema'] as JsonObject, [1]),
    ).toMatchObject({
      component: 'boolean',
      scope: '/properties/flag',
      node_key: 'field_1',
    });
    expect(document['render_schema']).not.toEqual(removed['render_schema']);
  });
  it('uses the current collection context and rejects crossed bindings atomically', () => {
    expect(placementFields(document, [1]).map((field) => field.scope)).toEqual([
      '/properties/rows/items/properties/amount',
    ]);
    expect(() => placeField(document, [1], '/properties/flag')).toThrow(
      'collection context',
    );
    const next = placeField(
      document,
      [1],
      '/properties/rows/items/properties/amount',
    );
    expect(next['data_schema']).toEqual(document['data_schema']);
    expect(placementFields(document, [0])).toEqual([]);
  });
});
