import { connectionKey } from './workflow-authoring';
import {
  addCandidate,
  addMapping,
  candidateKey,
  mappingSources,
  patchTransition,
  removeCandidate,
  removeMapping,
} from './graph-controls';
import { JsonObject } from '../../forms/domain/runtime-document';
import { CanvasNode } from './workflow-authoring';
const graph: JsonObject = {
  steps: [
    { key: 'first', type_code: 'START' },
    { key: 'review', type_code: 'HUMAN_TASK' },
    { key: 'future', type_code: 'FINISH' },
  ],
  transitions: [
    {
      source: 'first',
      target: 'review',
      outcome: 'next',
      priority: 5,
      is_default: false,
    },
    {
      source: 'review',
      target: 'future',
      outcome: 'next',
      priority: 0,
      is_default: true,
    },
  ],
  bindings: [],
};
const nodes: CanvasNode[] = [
  {
    key: 'review',
    title: 'Review',
    position: { x: 0, y: 0 },
    ports: [
      {
        key: 'flag',
        direction: 'INPUT',
        cardinality: 'SCALAR',
        schema: { type: 'boolean' },
      },
      {
        key: 'amount',
        direction: 'INPUT',
        cardinality: 'SCALAR',
        schema: { type: 'integer' },
      },
    ],
  },
];
it('maps only authorized scalar predecessors and executable context paths', () => {
  const rows: JsonObject[] = [
    {
      path: 'request.amount',
      source: 'request',
      type_schema: { type: 'integer' },
      cardinality: 'SCALAR',
    },
    ...['first', 'future'].map((key) => ({
      path: 'steps.' + key + '.outputs.total',
      source: 'step_output',
      source_step: key,
      type_schema: { type: 'integer' },
      cardinality: 'SCALAR',
    })),
    {
      path: 'current_user.ref_id',
      source: 'current_user',
      type_schema: { type: 'string' },
      cardinality: 'SCALAR',
    },
    {
      path: 'request.list',
      source: 'request',
      type_schema: { type: 'array' },
      cardinality: 'LIST',
    },
  ];
  const sources = mappingSources(rows, graph, 'review');
  expect(sources.map((item) => item.key)).toEqual([
    'request.amount',
    'steps.first.outputs.total',
  ]);
  const mapped = addMapping(
    graph,
    'review',
    'amount',
    nodes,
    sources[0],
    undefined,
  );
  expect((mapped['bindings'] as JsonObject[])[0]).toMatchObject({
    source_kind: 'REQUEST',
    source_path: '/amount',
    source_schema: {
      type: 'object',
      properties: { amount: { type: 'integer' } },
    },
  });
  expect(mapped['transitions']).toBe(graph['transitions']);
});
it('preserves exact canonical false and zero and rejects incompatible or duplicate scalar maps', () => {
  const mapped = addMapping(graph, 'review', 'flag', nodes, null, false);
  expect((mapped['bindings'] as JsonObject[])[0]['constant_value']).toBe(false);
  expect(
    (
      addMapping(graph, 'review', 'amount', nodes, null, 0)[
        'bindings'
      ] as JsonObject[]
    )[0]['constant_value'],
  ).toBe(0);
  expect(() => addMapping(mapped, 'review', 'flag', nodes, null, true)).toThrow(
    'Remove',
  );
  expect(() => addMapping(graph, 'review', 'amount', nodes, null, '0')).toThrow(
    'Invalid',
  );
});
it('preserves transition identity and unknown properties and enforces unique default/priority', () => {
  const extended = {
    ...graph,
    transitions: [
      ...(graph['transitions'] as JsonObject[]),
      {
        source: 'review',
        target: 'first',
        outcome: 'next',
        priority: 4,
        is_default: false,
        retained: true,
      },
    ],
  };
  const updated = patchTransition(extended, 2, {
    priority: 7,
    is_default: false,
    condition: 'request.amount > 0',
  });
  expect((updated['transitions'] as JsonObject[])[2]).toMatchObject({
    retained: true,
    source: 'review',
    target: 'first',
    priority: 7,
  });
  expect(() =>
    patchTransition(extended, 2, {
      priority: 0,
      is_default: false,
      condition: null,
    }),
  ).toThrow('conflicts');
  expect(() =>
    patchTransition(extended, 2, {
      priority: 7,
      is_default: true,
      condition: null,
    }),
  ).toThrow('conflicts');
  expect(() =>
    patchTransition(extended, 2, {
      priority: 7,
      is_default: true,
      condition: 'true',
    }),
  ).toThrow('unconditional');
  expect(updated['bindings']).toBe(graph['bindings']);
});
it('adds exact selected candidate keys without duplicating existing targets', () => {
  const mapped = addCandidate(graph, 'review', 'user_ref', 'selected-current');
  expect((mapped['targets'] as JsonObject[])[0]).toEqual({
    step: 'review',
    user_ref: 'selected-current',
    priority: 0,
  });
  expect(addCandidate(mapped, 'review', 'user_ref', 'selected-current')).toBe(
    mapped,
  );
  expect(() =>
    addCandidate(graph, 'missing', 'user_ref', 'selected'),
  ).toThrow();
});
it('removes formerly authorized outputs when a draft branch can bypass their producer', () => {
  const altered = {
    ...graph,
    steps: [
      ...(graph['steps'] as JsonObject[]),
      { key: 'other', type_code: 'START' },
    ],
    transitions: [
      ...(graph['transitions'] as JsonObject[]),
      { source: 'other', target: 'review', outcome: 'next' },
    ],
  };
  expect(
    mappingSources(
      [
        {
          path: 'steps.first.outputs.total',
          source: 'step_output',
          source_step: 'first',
          type_schema: { type: 'integer' },
          cardinality: 'SCALAR',
        },
      ],
      altered,
      'review',
    ),
  ).toEqual([]);
});

it('removes a selected constant mapping without changing control edges or other mappings', () => {
  const first = addMapping(graph, 'review', 'flag', nodes, null, false);
  const mapped = addMapping(first, 'review', 'amount', nodes, null, 0);
  const bindings = mapped['bindings'] as JsonObject[];
  const removed = removeMapping(mapped, connectionKey('data', bindings[0]));
  expect(removed['bindings']).toEqual([bindings[1]]);
  expect(removed['transitions']).toBe(graph['transitions']);
  expect(() =>
    removeMapping(removed, connectionKey('data', bindings[0])),
  ).toThrow();
});

it('maps authorized whole object outputs without creating constants or changing control flow', () => {
  const schema = {
    type: 'object',
    properties: { amount: { type: 'integer' } },
    additionalProperties: false,
  };
  const objectNodes: CanvasNode[] = [
    {
      ...nodes[0],
      key: 'first',
      ports: [
        {
          key: 'submission',
          direction: 'OUTPUT',
          cardinality: 'SCALAR',
          schema,
        },
      ],
    },
    {
      ...nodes[0],
      ports: [
        {
          key: 'data',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: { type: 'object' },
        },
      ],
    },
  ];
  const sources = mappingSources(
    [
      {
        path: 'steps.first.outputs.submission',
        source: 'step_output',
        source_step: 'first',
        cardinality: 'SCALAR',
        type_schema: schema,
      },
    ],
    graph,
    'review',
  );
  const mapped = addMapping(
    graph,
    'review',
    'data',
    objectNodes,
    sources[0],
    undefined,
  );
  expect((mapped['bindings'] as JsonObject[])[0]).toMatchObject({
    source_kind: 'STEP_OUTPUT',
    source_step: 'first',
    source_port: 'submission',
    source_schema: schema,
  });
  expect(mapped['transitions']).toBe(graph['transitions']);
  expect(() =>
    addMapping(graph, 'review', 'data', objectNodes, null, {}),
  ).toThrow('Invalid');
  const changed = objectNodes.map((node) =>
    node.key === 'first' ? { ...node, ports: [] } : node,
  );
  expect(() =>
    addMapping(graph, 'review', 'data', changed, sources[0], undefined),
  ).toThrow('Source port');
});
it('removes only the selected candidate row with unrelated policies and targets intact', () => {
  const row = {
    step: 'review',
    user_ref: 'selected',
    priority: 4,
    condition: 'request.flag',
  };
  const other = { ...row, step: 'future' };
  const mapped = { ...graph, targets: [row, other] };
  const removed = removeCandidate(mapped, 'review', candidateKey(row));
  expect(removed['targets']).toEqual([other]);
  expect(removed['transitions']).toBe(graph['transitions']);
  expect(() => removeCandidate(mapped, 'future', candidateKey(row))).toThrow(
    'unavailable',
  );
});

it('matches current server branch condition and nonnegative priority bounds', () => {
  for (const patch of [
    { priority: -1, is_default: false, condition: null },
    { priority: 1, is_default: false, condition: 'x'.repeat(1025) },
  ]) {
    expect(() => patchTransition(graph, 0, patch)).toThrow('Invalid');
  }
});
