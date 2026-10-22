import { expressionValues } from './expression-values';
import { JsonObject } from '../../forms/domain/runtime-document';
it('retains literal properties and items in authorized REQUEST instance pointers', () => {
  const rows: JsonObject[] = [
    'request.items',
    'request.properties.items',
    'request.other',
  ].map((path) => ({ source: 'request', path }));
  const graph: JsonObject = {
    bindings: ['/items', '/properties/items'].map((source_path) => ({
      source_kind: 'REQUEST',
      source_path,
      source_schema: { type: 'string' },
    })),
    steps: [{ key: 'target' }],
    transitions: [],
  };
  expect(expressionValues(rows, graph, 'target')).toEqual([
    'request.items',
    'request.properties.items',
  ]);
});
it('uses authorized context paths and removes prior outputs when draft branches bypass them', () => {
  const rows: JsonObject[] = [
    {
      source: 'request',
      path: 'request.amount',
      type_schema: { type: 'string' },
      cardinality: 'SCALAR',
    },
    { source: 'client', path: 'client.locale' },
    { source: 'current_user', path: 'current_user.ref_id' },
    { source: 'process', path: 'process.priority' },
    {
      source: 'step_output',
      path: 'steps.prepare.outputs.result',
      source_step: 'prepare',
      type_schema: { type: 'string' },
      cardinality: 'SCALAR',
    },
    { source: 'request', path: 'secret.wrong' },
    { source: 'private', path: 'private.value' },
  ];
  const graph: JsonObject = {
    bindings: [
      {
        source_kind: 'REQUEST',
        source_path: '/amount',
        source_schema: {
          type: 'object',
          properties: { amount: { type: 'string' } },
        },
      },
    ],
    steps: [
      { key: 'start', type_code: 'START' },
      { key: 'prepare' },
      { key: 'target' },
    ],
    transitions: [
      { source: 'start', target: 'prepare' },
      { source: 'prepare', target: 'target' },
    ],
  };
  expect(expressionValues(rows, graph, 'target')).toEqual([
    'request.amount',
    'client.locale',
    'current_user.ref_id',
    'process.priority',
    'steps.prepare.outputs.result',
  ]);
  expect(
    expressionValues(
      rows,
      {
        ...graph,
        transitions: [
          ...(graph['transitions'] as JsonObject[]),
          { source: 'start', target: 'target' },
        ],
      },
      'target',
    ),
  ).not.toContain('steps.prepare.outputs.result');
  expect(
    expressionValues(rows, { ...graph, bindings: [] }, 'target'),
  ).not.toContain('request.amount');
  expect(expressionValues([], graph, 'target')).toEqual([]);
});
