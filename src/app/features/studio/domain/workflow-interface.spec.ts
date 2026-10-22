import { JsonObject } from '../../forms/domain/runtime-document';
import { handlers } from './node-inspector';
import {
  interfaceErrors,
  interfaceOutput,
  interfaceSources,
} from './workflow-interface';
const handler = handlers.find((row) => row.handler_key === 'transform')!;
const schema = {
  type: 'object',
  properties: { result: { type: 'string', minLength: 2 } },
  required: ['result'],
};
const catalog: JsonObject[] = [
  {
    type_schema: handler.config_schema,
    metadata: {
      ref_id: 'registered',
      code: 'TRANSFORM',
      handler_key: handler.handler_key,
      handler_version: handler.handler_version,
      ports: [
        { direction: 'OUTPUT', port_key: 'result', value_schema: schema },
      ],
    },
  },
];
const graph: JsonObject = {
  steps: [
    { key: 'start', type_code: 'START' },
    {
      key: 'prepare',
      type_code: 'TRANSFORM',
      type_version_ref: 'registered',
      config: {},
    },
    { key: 'finish', type_code: 'FINISH' },
  ],
  transitions: [
    { source: 'start', target: 'prepare' },
    { source: 'prepare', target: 'finish' },
  ],
};
const value: JsonObject = {
  inputs: [],
  outputs: [{ name: 'result' }],
  category: 'general',
  outcomes: { done: 'finish' },
  help_messages: { en: 'Retained' },
  required_capabilities: ['retained'],
};
it('copies exact registered output schemas while preserving interface metadata', () => {
  const sources = interfaceSources(graph, catalog);
  const next = interfaceOutput(value, 0, sources[0]);
  expect(interfaceErrors(next, graph, catalog)).toEqual([]);
  expect(next['help_messages']).toEqual(value['help_messages']);
  expect(next['required_capabilities']).toEqual(['retained']);
  expect((next['outputs'] as JsonObject[])[0]).toEqual({
    name: 'result',
    source_step: 'prepare',
    source_port: 'result',
    value_schema: schema,
  });
  expect((next['outputs'] as JsonObject[])[0]['value_schema']).not.toBe(schema);
  expect(value['outputs']).toEqual([{ name: 'result' }]);
});
it('rejects bypass branches, unavailable ports and schema constraint mismatches', () => {
  const next = interfaceOutput(value, 0, interfaceSources(graph, catalog)[0]);
  const bypass = {
    ...graph,
    transitions: [
      ...(graph['transitions'] as JsonObject[]),
      { source: 'start', target: 'finish' },
    ],
  };
  expect(interfaceErrors(next, bypass, catalog)).toContain(
    'Each output must use a registered port that runs before every declared Finish step.',
  );
  expect(interfaceErrors(next, graph, [])).not.toEqual([]);
  const changed = {
    ...next,
    outputs: [
      {
        ...(next['outputs'] as JsonObject[])[0],
        value_schema: { ...schema, required: [] },
      },
    ],
  };
  expect(interfaceErrors(changed, graph, catalog)).not.toEqual([]);
});
it('rejects reserved outcomes, duplicate finish use, invalid names and nontext assignment', () => {
  expect(
    interfaceErrors(
      { ...value, outputs: [], outcomes: { failure: 'finish' } },
      graph,
      catalog,
    ),
  ).not.toEqual([]);
  expect(
    interfaceErrors(
      { ...value, outputs: [], outcomes: { done: 'finish', other: 'finish' } },
      graph,
      catalog,
    ),
  ).not.toEqual([]);
  expect(
    interfaceErrors(
      {
        ...value,
        outputs: [],
        inputs: [
          {
            name: '1bad',
            assignment: 'user',
            value_schema: { type: 'integer' },
          },
        ],
      },
      graph,
      catalog,
    ),
  ).toHaveLength(2);
});
it('does not offer stale, unavailable or unreviewed registered types', () => {
  expect(interfaceSources(graph, [])).toEqual([]);
  const unavailable = [
    {
      ...catalog[0],
      metadata: {
        ...(catalog[0]['metadata'] as JsonObject),
        runtime_available: false,
      },
    },
  ];
  expect(interfaceSources(graph, unavailable)).toEqual([]);
});
