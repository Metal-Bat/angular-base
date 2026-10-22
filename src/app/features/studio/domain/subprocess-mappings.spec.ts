import { handlers } from './node-inspector';
import { JsonObject } from '../../forms/domain/runtime-document';
import {
  childInputSchema,
  childSourceCompatible,
  setChildInput,
  setChildSource,
  subprocessSources,
} from './subprocess-pin';
const catalog: JsonObject[] = [
  {
    category: 'subprocess',
    metadata: {
      workflow_version_ref: 'child',
      interface: {
        inputs: [
          {
            name: 'payload',
            value_schema: {
              type: 'object',
              properties: {
                model_id: { type: 'string' },
                enabled: { type: 'boolean' },
              },
              required: ['model_id', 'enabled'],
            },
          },
          {
            name: 'rows',
            value_schema: { type: 'array', items: { type: 'string' } },
          },
          { name: 'note', value_schema: { type: ['string', 'null'] } },
        ],
      },
    },
  },
];
it('edits structured child constants without losing false, nested empty text, null or unrelated inputs', () => {
  const current: JsonObject = {
    workflow_version_ref: 'child',
    inputs: [
      { name: 'untouched', source_kind: 'REQUEST', source_path: '/private' },
    ],
  };
  const object = setChildInput(
    current,
    'payload',
    { model_id: '', enabled: false },
    catalog,
  );
  const array = setChildInput(object, 'rows', [''], catalog);
  const nullable = setChildInput(array, 'note', null, catalog);
  expect(
    (nullable['inputs'] as JsonObject[]).map((row) => row['constant_value']),
  ).toEqual([undefined, { model_id: '', enabled: false }, [''], null]);
  expect(() =>
    setChildInput(nullable, 'payload', { enabled: 'wrong' }, catalog),
  ).toThrow('Invalid');
});
it('clears an obsolete child input without current interface metadata so pins can be deliberately repaired', () => {
  const current: JsonObject = {
    workflow_version_ref: 'retired-child',
    inputs: [{ name: 'old', source_kind: 'REQUEST', source_path: '/old' }],
    retained: false,
  };
  expect(setChildInput(current, 'old', undefined, [])).toEqual({
    ...current,
    inputs: [],
  });
});
it('maps authorized child sources with leaf schemas and removes obsolete constant fields', () => {
  const current: JsonObject = {
    workflow_version_ref: 'child',
    inputs: [
      {
        name: 'payload',
        source_kind: 'CONSTANT',
        constant_value: { enabled: false },
        source_schema: { type: 'object' },
      },
    ],
  };
  const sources = [
    {
      key: 'request.payload',
      label: 'Request payload',
      schema: childInputSchema(current, 'payload', catalog),
      rootSchema: {
        type: 'object',
        properties: { payload: { type: 'object' } },
      },
      binding: { source_kind: 'REQUEST', source_path: '/payload' },
    },
  ];
  const result = setChildSource(
    current,
    'payload',
    'request.payload',
    catalog,
    sources,
  );
  expect(result['inputs']).toEqual([
    {
      name: 'payload',
      source_kind: 'REQUEST',
      source_path: '/payload',
      source_schema: sources[0].schema,
    },
  ]);
  expect(() =>
    setChildSource(current, 'payload', 'revoked', catalog, sources),
  ).toThrow('Reload');
  expect(() =>
    setChildSource(current, 'payload', 'wrong', catalog, [
      { ...sources[0], key: 'wrong', schema: { type: 'string' } },
    ]),
  ).toThrow('Reload');
});
it('preserves exact whole prior-output schemas and rejects unsupported nested prior-output paths', () => {
  const current: JsonObject = { workflow_version_ref: 'child', inputs: [] };
  const source = {
    key: 'step.output',
    label: 'Prior result',
    schema: childInputSchema(current, 'payload', catalog),
    binding: {
      source_kind: 'STEP_OUTPUT',
      source_step: 'first',
      source_port: 'result',
    },
  };
  expect(
    setChildSource(current, 'payload', source.key, catalog, [source])['inputs'],
  ).toEqual([
    { name: 'payload', source_schema: source.schema, ...source.binding },
  ]);
  expect(() =>
    setChildSource(current, 'payload', source.key, catalog, [
      { ...source, binding: { ...source.binding, source_path: '/nested' } },
    ]),
  ).toThrow('Reload');
});

it('uses exact child-call registry output schemas while retaining completion authorization and dominance', () => {
  const schema: JsonObject = { anyOf: [{}, { type: 'null' }] };
  const graph: JsonObject = {
    steps: [
      {
        key: 'prior',
        type_code: 'TRANSFORM',
        type_version_ref: 'type',
        config: {},
      },
      { key: 'call' },
    ],
    transitions: [{ source: 'prior', target: 'call' }],
  };
  const completion: JsonObject[] = [
    {
      path: 'steps.prior.outputs.result',
      source: 'step_output',
      source_step: 'prior',
      cardinality: 'SCALAR',
      type_schema: { type: 'string' },
    },
  ];
  const types: JsonObject[] = [
    {
      category: 'step_type',
      type_schema: handlers.find(
        (item) =>
          item.handler_key === 'transform' && item.handler_version === '2',
      )!.config_schema,
      metadata: {
        code: 'TRANSFORM',
        runtime_available: true,
        ref_id: 'type',
        handler_key: 'transform',
        handler_version: '2',
        ports: [
          { port_key: 'result', direction: 'OUTPUT', value_schema: schema },
        ],
      },
    },
  ];
  expect(subprocessSources(completion, graph, 'call', types)[0].schema).toEqual(
    schema,
  );
  expect(subprocessSources(completion, graph, 'call', [])).toEqual([]);
  expect(
    subprocessSources(completion, { ...graph, transitions: [] }, 'call', types),
  ).toEqual([]);
});

it('uses exact subprocess schema compatibility and ignores only root descriptive fields', () => {
  expect(
    childSourceCompatible({ type: 'integer', minimum: 0 }, { type: 'integer' }),
  ).toBe(false);
  expect(childSourceCompatible({ type: 'string' }, {})).toBe(false);
  expect(
    childSourceCompatible(
      {
        description: 'Source',
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'boolean' } },
      },
      {
        title: 'Target',
        properties: { b: { type: 'boolean' }, a: { type: 'string' } },
        type: 'object',
      },
    ),
  ).toBe(true);
  expect(
    childSourceCompatible(
      {
        type: 'object',
        properties: { a: { type: 'string', description: 'a' } },
      },
      { type: 'object', properties: { a: { type: 'string' } } },
    ),
  ).toBe(false);
});
