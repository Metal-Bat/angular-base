import { subprocessSources } from './subprocess-pin';
import { expressionValues } from './expression-values';
import {
  interfaceExpressionCompletions,
  interfaceMappingSources,
  workflowMappingSources,
} from './interface-sources';
import { JsonObject } from '../../forms/domain/runtime-document';
const graph: JsonObject = {
  interface: {
    inputs: [
      { name: 'note', value_schema: { type: 'string' } },
      {
        name: 'payload',
        required: false,
        value_schema: {
          type: 'object',
          properties: { 'a/b': { type: 'integer' } },
          additionalProperties: false,
        },
      },
    ],
    outcomes: { done: 'finish' },
  },
  steps: [
    { key: 'start', type_code: 'START' },
    { key: 'prepare' },
    { key: 'finish', type_code: 'FINISH' },
  ],
  transitions: [
    { source: 'start', target: 'prepare' },
    { source: 'prepare', target: 'finish' },
  ],
};
it('maps declared child inputs and nested paths without a request type', () => {
  const sources = interfaceMappingSources(graph, 'prepare');
  expect(sources.map((row) => row.key)).toEqual([
    '/note',
    '/payload',
    '/payload/a~1b',
  ]);
  expect(sources[0]).toMatchObject({
    schema: { type: 'string' },
    binding: { source_kind: 'REQUEST', source_path: '/note' },
    rootSchema: {
      type: 'object',
      properties: { note: { type: 'string' } },
      required: ['note'],
    },
  });
  expect(sources[2]).toMatchObject({
    schema: { type: 'integer' },
    binding: { source_path: '/payload/a~1b' },
    rootSchema: { properties: { payload: { additionalProperties: false } } },
  });
  expect(sources[2].rootSchema).not.toHaveProperty('required');
});
it('keeps parent form fields outside the isolated child context and preserves authorized process values', () => {
  const rows: JsonObject[] = [
    {
      source: 'request',
      path: 'request.parent_only',
      type_schema: { type: 'string' },
      cardinality: 'SCALAR',
    },
    {
      source: 'process',
      path: 'process.status',
      type_schema: { type: 'string' },
      cardinality: 'SCALAR',
    },
  ];
  expect(
    workflowMappingSources(rows, graph, 'prepare', undefined).map(
      (row) => row.key,
    ),
  ).toEqual(['/note', '/payload', '/payload/a~1b', 'process.status']);
  expect(
    workflowMappingSources(
      rows,
      { ...graph, interface: null },
      'prepare',
      undefined,
    ).map((row) => row.key),
  ).toEqual(['/parent_only', 'process.status']);
  expect(
    workflowMappingSources(
      rows,
      { ...graph, interface: { inputs: 'malformed' } },
      'prepare',
      undefined,
    ).map((row) => row.key),
  ).toEqual(['process.status']);
});
it('rebases local schema refs while retaining literal ref-shaped values and resource IDs', () => {
  const schema = {
    type: 'object',
    $defs: { Text: { type: 'string' } },
    properties: { note: { $ref: '#/$defs/Text' } },
    default: { $ref: '#/literal' },
    examples: [{ $ref: '#/example' }],
  };
  const custom = {
    ...graph,
    interface: {
      inputs: [{ name: 'item', value_schema: schema }],
      outcomes: { done: 'finish' },
    },
  };
  const source = interfaceMappingSources(custom, 'prepare')[0];
  expect(source.rootSchema).toMatchObject({
    properties: {
      item: {
        properties: { note: { $ref: '#/properties/item/$defs/Text' } },
        default: { $ref: '#/literal' },
        examples: [{ $ref: '#/example' }],
      },
    },
  });
  expect(schema.properties.note.$ref).toBe('#/$defs/Text');
  const withId = {
    ...custom,
    interface: {
      inputs: [
        {
          name: 'item',
          value_schema: { ...schema, $id: 'https://owned.invalid/schema' },
        },
      ],
      outcomes: { done: 'finish' },
    },
  };
  expect(
    interfaceMappingSources(withId, 'prepare')[0].rootSchema,
  ).toMatchObject({
    properties: { item: { properties: { note: { $ref: '#/$defs/Text' } } } },
  });
});

it('uses declared inputs for nested child calls and typed condition completion without parent form metadata', () => {
  const sources = subprocessSources([], graph, 'prepare', []);
  expect(sources.find((source) => source.key === '/note')?.schema).toEqual({
    type: 'string',
  });
  const bound: JsonObject = {
    ...graph,
    bindings: [
      {
        source_kind: 'REQUEST',
        source_path: '/note',
        source_schema: {
          type: 'object',
          properties: { note: { type: 'string' } },
        },
      },
    ],
  };
  const rows = interfaceExpressionCompletions([], bound, 'prepare');
  expect(expressionValues(rows, bound, 'prepare')).toEqual(['request.note']);
  expect(rows.some((row) => row['path'] === 'request.parent_only')).toBe(false);
});
