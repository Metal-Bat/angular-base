import { JsonObject } from '../../forms/domain/runtime-document';
import { CanvasNode, connectionKey } from './workflow-authoring';
import {
  addMapping,
  literalErrors,
  mappingItem,
  mappingSelection,
  moveMapping,
  removeMapping,
  replaceMapping,
} from './data-mappings';
import { mappingSources } from './mapping-sources';
const schema: JsonObject = { type: 'array', items: { type: 'string' } };
const graph: JsonObject = {
  steps: [
    { key: 'start', type_code: 'START' },
    { key: 'notify', type_code: 'NOTIFICATION' },
  ],
  transitions: [{ source: 'start', target: 'notify', outcome: 'next' }],
  bindings: [],
};
const nodes: CanvasNode[] = [
  {
    key: 'notify',
    title: 'Notify',
    position: { x: 0, y: 0 },
    ports: [
      { key: 'recipients', direction: 'INPUT', cardinality: 'LIST', schema },
      {
        key: 'data',
        direction: 'INPUT',
        cardinality: 'SCALAR',
        schema: {
          type: 'object',
          properties: { enabled: { type: 'boolean' } },
          required: ['enabled'],
          additionalProperties: false,
        },
      },
    ],
  },
];
it('authors structured constants and ordered LIST chunks with exact pinned schemas', () => {
  const first = addMapping(graph, 'notify', 'recipients', nodes, null, [
    'alice',
  ]);
  const next = addMapping(first, 'notify', 'recipients', nodes, null, [
    'bob',
    'carol',
  ]);
  const object = addMapping(next, 'notify', 'data', nodes, null, {
    enabled: false,
  });
  expect(
    (object['bindings'] as JsonObject[]).map((row) => row['ordinal']),
  ).toEqual([0, 1, 0]);
  expect((object['bindings'] as JsonObject[])[1]['target_schema']).toEqual(
    schema,
  );
  expect(object['transitions']).toBe(graph['transitions']);
  expect(() =>
    addMapping(graph, 'notify', 'recipients', nodes, null, ['alice', 3]),
  ).toThrow('Invalid');
  expect(() => addMapping(graph, 'notify', 'data', nodes, null, {})).toThrow(
    'Invalid',
  );
});
it('reorders and removes LIST chunks densely without touching unrelated mappings', () => {
  let current = addMapping(graph, 'notify', 'recipients', nodes, null, [
    'alice',
  ]);
  current = addMapping(current, 'notify', 'recipients', nodes, null, ['bob']);
  current = addMapping(current, 'notify', 'data', nodes, null, {
    enabled: false,
  });
  const original = current['bindings'] as JsonObject[];
  const moved = moveMapping(
    current,
    connectionKey('data', original[1]),
    -1,
    nodes,
  );
  const rows = moved['bindings'] as JsonObject[];
  expect(rows.slice(0, 2).map((row) => row['constant_value'])).toEqual([
    ['bob'],
    ['alice'],
  ]);
  expect(rows[2]).toBe(original[2]);
  const removed = removeMapping(moved, connectionKey('data', rows[0]));
  expect(
    (removed['bindings'] as JsonObject[]).map((row) => row['ordinal']),
  ).toEqual([0, 0]);
  expect(removed['transitions']).toBe(graph['transitions']);
});
it('updates one mapping atomically, preserving its position and compatible metadata', () => {
  const current = addMapping(graph, 'notify', 'data', nodes, null, {
    enabled: false,
  });
  const row = {
    ...(current['bindings'] as JsonObject[])[0],
    retained: 'metadata',
  };
  const updated = replaceMapping(
    { ...current, bindings: [row] },
    connectionKey('data', row),
    nodes,
    null,
    { enabled: true },
  );
  expect((updated['bindings'] as JsonObject[])[0]).toEqual({
    ...row,
    constant_value: { enabled: true },
  });
  expect(() => replaceMapping(current, 'stale', nodes, null, {})).toThrow(
    'Invalid connection',
  );
});
it('offers authorized nested request fields and whole collections with escaped pointers', () => {
  const rows: JsonObject[] = [
    {
      path: 'request.profile',
      source: 'request',
      cardinality: 'SCALAR',
      type_schema: {
        type: 'object',
        properties: { 'a/b~c': { type: 'string' } },
      },
    },
    {
      path: 'request.names',
      source: 'request',
      cardinality: 'LIST',
      type_schema: schema,
    },
  ];
  const sources = mappingSources(rows, graph, 'notify');
  const nested = sources.find(
    (row) => row.binding['source_path'] === '/profile/a~1b~0c',
  );
  expect(nested?.schema).toEqual({ type: 'string' });
  const collection = sources.find((row) => row.key === '/names')!;
  expect(
    addMapping(graph, 'notify', 'recipients', nodes, collection, undefined)[
      'bindings'
    ],
  ).toMatchObject([
    {
      source_path: '/names',
      source_schema: { type: 'object', properties: { names: schema } },
    },
  ]);
});

it('selects a nested collection member without changing its source root or zero index', () => {
  const source = mappingSources(
    [
      {
        path: 'request.rows',
        source: 'request',
        cardinality: 'LIST',
        type_schema: {
          type: 'array',
          items: { type: 'object', properties: { note: { type: 'string' } } },
        },
      },
    ],
    graph,
    'notify',
  )[0];
  const item = mappingItem(source, 0, '/note');
  expect(item.schema).toEqual({ type: 'string' });
  expect(item.binding['source_path']).toBe('/rows/0/note');
  expect(item.rootSchema).toMatchObject({
    properties: { rows: { type: 'array', items: { type: 'object' } } },
  });
  expect(mappingSelection([source], item.binding)).toEqual({
    key: source.key,
    index: 0,
    field: '/note',
  });
  for (const invalid of [-1, 0.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => mappingItem(source, invalid)).toThrow('index');
  }
  expect(() => mappingItem(source, 0, '/missing')).toThrow('field');
});

it('preserves explicit null for unconstrained and nullable inputs', () => {
  const open = [
    {
      ...nodes[0],
      ports: [
        { key: 'value', direction: 'INPUT', cardinality: 'SCALAR', schema: {} },
      ],
    },
  ];
  expect(
    addMapping(graph, 'notify', 'value', open, null, null)['bindings'],
  ).toMatchObject([{ constant_value: null, target_schema: {} }]);
  const nullable = [
    {
      ...nodes[0],
      ports: [
        {
          key: 'value',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: { type: ['string', 'null'] },
        },
      ],
    },
  ];
  expect(
    addMapping(graph, 'notify', 'value', nullable, null, null)['bindings'],
  ).toMatchObject([{ constant_value: null }]);
});

it('distinguishes a dotted field name from a nested path without producer dot-path ambiguity', () => {
  const profileSchema = {
    type: 'object',
    properties: {
      'a.b': { type: 'string' },
      a: { type: 'object', properties: { b: { type: 'string' } } },
    },
  };
  const found = mappingSources(
    [
      {
        path: 'request.profile',
        source: 'request',
        cardinality: 'SCALAR',
        type_schema: profileSchema,
      },
      {
        path: 'request.profile.a.b',
        source: 'request',
        cardinality: 'SCALAR',
        type_schema: { type: 'string' },
      },
    ],
    graph,
    'notify',
  );
  expect(
    found
      .filter((row) => row.schema['type'] === 'string')
      .map((row) => row.binding['source_path']),
  ).toEqual(['/profile/a.b', '/profile/a/b']);
  expect(new Set(found.map((row) => row.key)).size).toBe(found.length);
  expect(found.map((row) => row.label)).toContain('request.profile › a.b');
  expect(found.map((row) => row.label)).toContain('request.profile › a › b');
});

it('keeps explicit empty text distinct from missing values and honors string constraints', () => {
  const textNodes = [
    {
      ...nodes[0],
      ports: [
        {
          key: 'text',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: { type: 'string' },
        },
      ],
    },
  ];
  expect(
    addMapping(graph, 'notify', 'text', textNodes, null, '')['bindings'],
  ).toMatchObject([{ constant_value: '' }]);
  expect(() =>
    addMapping(graph, 'notify', 'text', textNodes, null, undefined),
  ).toThrow('Invalid');
  const constraints: JsonObject[] = [
    { type: 'string', minLength: 1 },
    { type: 'string', enum: ['required'] },
    { type: 'integer' },
  ];
  for (const constraint of constraints) {
    const restricted = [
      {
        ...textNodes[0],
        ports: [{ ...textNodes[0].ports[0], schema: constraint }],
      },
    ];
    expect(() =>
      addMapping(graph, 'notify', 'text', restricted, null, ''),
    ).toThrow('Invalid');
  }
});

it('rejects unsafe integer literals instead of silently persisting rounded values', () => {
  const integer = { type: ['string', 'integer'] };
  expect(literalErrors(integer, Number.MAX_SAFE_INTEGER + 1)).toHaveProperty(
    'value',
  );
  expect(literalErrors(integer, '9007199254740993')).toEqual({});
  expect(literalErrors(integer, 0)).toEqual({});
});

it('preserves nested empty literals while validating required presence and item constraints', () => {
  const object: JsonObject = {
    type: 'object',
    properties: { text: { type: 'string' } },
    required: ['text'],
  };
  expect(literalErrors(object, { text: '' })).toEqual({});
  expect(literalErrors(object, {})).toHaveProperty('value.text');
  expect(
    literalErrors({ type: 'array', items: { type: 'string' } }, ['']),
  ).toEqual({});
  expect(
    literalErrors({ type: 'array', items: { type: 'string', minLength: 1 } }, [
      '',
    ]),
  ).toHaveProperty('value.0');
});

it('refreshes an unprojected mapping target after an explicit registered port configuration change', () => {
  const original = addMapping(graph, 'notify', 'data', nodes, null, {
    enabled: false,
  });
  const row = (original['bindings'] as JsonObject[])[0];
  const configured = nodes.map((node) => ({
    ...node,
    ports: node.ports.map((port) =>
      port.key === 'data'
        ? {
            ...port,
            schema: {
              ...port.schema,
              description: 'New registered declaration',
            },
          }
        : port,
    ),
  }));
  const updated = replaceMapping(
    original,
    connectionKey('data', row),
    configured,
    null,
    { enabled: true },
  );
  expect((updated['bindings'] as JsonObject[])[0]['target_schema']).toEqual(
    configured[0].ports[1].schema,
  );
});
