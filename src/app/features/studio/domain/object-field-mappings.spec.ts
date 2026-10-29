import { JsonObject } from '../../../shared/domain/json-value';
import { CanvasNode, connectionKey } from './workflow-authoring';
import { addObjectField, objectDestination } from './object-field-mappings';
import { boundInputSchema } from './mapping-fields';
import {
  addMapping,
  moveMapping,
  removeMapping,
  replaceMapping,
} from './data-mappings';
const port = {
  key: 'data',
  direction: 'INPUT',
  cardinality: 'SCALAR',
  schema: { type: 'object' },
};
const nodes: CanvasNode[] = [
  {
    key: 'assemble',
    title: 'Assemble',
    position: { x: 0, y: 0 },
    ports: [port],
  },
];
const graph: JsonObject = { steps: [], bindings: [] };
it('declares multiple sources and explicit false, zero, arrays and null without changing old LIST semantics', () => {
  let current = graph;
  for (const [name, value, type] of [
    ['count', 0, 'integer'],
    ['enabled', false, 'boolean'],
    ['items', [], 'array'],
    ['note', null, 'null'],
  ] as const) {
    current = addObjectField(
      current,
      'assemble',
      port,
      nodes,
      null,
      value === null ? null : Array.isArray(value) ? [] : value,
      '',
      name,
      { type },
    );
  }
  const rows = current['bindings'] as JsonObject[];
  expect(rows.map(objectDestination)).toEqual([
    '/count',
    '/enabled',
    '/items',
    '/note',
  ]);
  expect(rows.map((row) => row['constant_value'])).toEqual([
    0,
    false,
    [],
    null,
  ]);
  expect(
    rows.every(
      (row) =>
        JSON.stringify(row['target_schema']) ===
        JSON.stringify(rows[0]['target_schema']),
    ),
  ).toBe(true);
  expect(boundInputSchema(current, 'assemble', 'data')).toEqual(
    rows[0]['target_schema'],
  );
  const reordered = moveMapping(
    current,
    connectionKey('data', rows[3]),
    -1,
    nodes,
  );
  const changed = reordered['bindings'] as JsonObject[];
  expect(changed.map((row) => row['ordinal'])).toEqual([0, 1, 2, 3]);
  const updated = replaceMapping(
    current,
    connectionKey('data', rows[0]),
    nodes,
    null,
    2,
  );
  expect((updated['bindings'] as JsonObject[])[0]).toMatchObject({
    constant_value: 2,
    ordinal: 0,
    target_projection: { path: '/count' },
  });
  expect(() =>
    replaceMapping(current, connectionKey('data', rows[0]), nodes, null, false),
  ).toThrow();
  expect(
    (
      removeMapping(current, connectionKey('data', rows[1]))[
        'bindings'
      ] as JsonObject[]
    ).map((row) => row['ordinal']),
  ).toEqual([0, 1, 2]);
  expect(() =>
    addMapping(current, 'assemble', 'data', nodes, null, {}),
  ).toThrow();
});
it('rejects conflicting destinations and whole-input mixing atomically, and escapes names', () => {
  const original = JSON.stringify(graph);
  const current = addObjectField(
    graph,
    'assemble',
    port,
    nodes,
    null,
    '',
    '',
    'a/b~c',
    { type: 'string' },
  );
  expect(objectDestination((current['bindings'] as JsonObject[])[0])).toBe(
    '/a~1b~0c',
  );
  expect(() =>
    addObjectField(current, 'assemble', port, nodes, null, '', '/a~1b~0c', '', {
      type: 'string',
    }),
  ).toThrow();
  expect(() =>
    addObjectField(graph, 'assemble', port, nodes, null, '', '', '__proto__', {
      type: 'string',
    }),
  ).toThrow();
  const whole = addMapping(graph, 'assemble', 'data', nodes, null, {});
  expect(() =>
    addObjectField(whole, 'assemble', port, nodes, null, '', '', 'name', {
      type: 'string',
    }),
  ).toThrow();
  expect(JSON.stringify(graph)).toBe(original);
});
it('maps a declared nested destination with exact source and pinned target declarations', () => {
  const root = {
    type: 'object',
    properties: {
      person: { type: 'object', properties: { name: { type: 'string' } } },
    },
  };
  const fixed = { ...port, schema: root };
  const fixedNodes = [{ ...nodes[0], ports: [fixed] }];
  const source = {
    key: 'request-name',
    label: 'Applicant name',
    schema: { type: 'string' },
    binding: { source_kind: 'REQUEST', source_path: '/name' },
  };
  const current = addObjectField(
    graph,
    'assemble',
    fixed,
    fixedNodes,
    source,
    undefined,
    '/person/name',
    '',
    source.schema,
  );
  expect((current['bindings'] as JsonObject[])[0]).toMatchObject({
    target_schema: root,
    source_schema: { type: 'object', properties: { name: { type: 'string' } } },
    target_projection: { path: '/person/name' },
  });
});
