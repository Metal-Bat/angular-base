import { JsonObject } from '../../forms/domain/runtime-document';
import { CanvasNode } from './workflow-authoring';
import { addMapping, mappingItem, mappingSelection } from './data-mappings';
import { mappingSources } from './mapping-sources';

it('maps nested prior outputs and indexed rows with the exact pinned root schema', () => {
  const root: JsonObject = {
    type: 'object',
    properties: {
      'a/b': { type: 'object', properties: { '~flag': { type: 'boolean' } } },
      rows: {
        type: 'array',
        items: { type: 'object', properties: { enabled: { type: 'boolean' } } },
      },
    },
  };
  const flow: JsonObject = {
    steps: [
      { key: 'start', type_code: 'START' },
      { key: 'prepare', type_code: 'TRANSFORM' },
      { key: 'notify', type_code: 'NOTIFICATION' },
    ],
    transitions: [
      { source: 'start', target: 'prepare' },
      { source: 'prepare', target: 'notify' },
    ],
    bindings: [],
  };
  const mappedNodes: CanvasNode[] = [
    {
      key: 'prepare',
      title: 'Prepare',
      position: { x: 0, y: 0 },
      ports: [
        {
          key: 'result',
          direction: 'OUTPUT',
          cardinality: 'SCALAR',
          schema: root,
        },
      ],
    },
    {
      key: 'target',
      title: 'Boolean',
      position: { x: 0, y: 0 },
      ports: [
        {
          key: 'value',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: { type: 'boolean' },
        },
      ],
    },
  ];
  const completion: JsonObject[] = [
    {
      source: 'step_output',
      cardinality: 'SCALAR',
      source_step: 'prepare',
      path: 'steps.prepare.outputs.result',
      type_schema: root,
    },
  ];
  // Child calls keep their existing whole-port contract unless the graph mapper opts in.
  expect(mappingSources(completion, flow, 'notify', mappedNodes)).toHaveLength(
    1,
  );
  const sources = mappingSources(completion, flow, 'notify', mappedNodes, true);
  const flag = sources.find(
    (source) => source.binding['source_path'] === '/a~1b/~0flag',
  )!;
  const mapped = addMapping(
    flow,
    'target',
    'value',
    mappedNodes,
    flag,
    undefined,
  );
  expect((mapped['bindings'] as JsonObject[])[0]).toMatchObject({
    source_kind: 'STEP_OUTPUT',
    source_path: '/a~1b/~0flag',
    source_schema: root,
  });
  const rows = sources.find(
    (source) => source.binding['source_path'] === '/rows',
  )!;
  const item = mappingItem(rows, 0, '/enabled');
  expect(item.rootSchema).toEqual(root);
  expect(item.binding['source_path']).toBe('/rows/0/enabled');
  expect(mappingSelection(sources, item.binding)).toEqual({
    key: rows.key,
    index: 0,
    field: '/enabled',
  });
  expect(() =>
    addMapping(
      flow,
      'target',
      'value',
      mappedNodes,
      { ...flag, rootSchema: {} },
      undefined,
    ),
  ).toThrow('Source port changed');
  expect(
    mappingSources(completion, flow, 'prepare', mappedNodes, true),
  ).toHaveLength(0);
});
