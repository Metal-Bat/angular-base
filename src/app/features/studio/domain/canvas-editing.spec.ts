import { emptyWorkspace, Workspace } from './authoring';
import { canvasEdges, CanvasNode, connectionKey } from './workflow-authoring';
import type { JsonObject } from '../../forms/domain/runtime-document';
import {
  alignSteps,
  duplicateSteps,
  moveSelection,
  reconnect,
  removeConnection,
  removeSteps,
} from './canvas-editing';
const workspace: Workspace = {
  ...emptyWorkspace(),
  positions: { one: { x: 10, y: 20 }, two: { x: 30, y: 40 } },
  graph: {
    steps: [
      {
        key: 'one',
        type_code: 'transform',
        type_version_ref: 'pin',
        config: { zero: 0, flag: false },
      },
      {
        key: 'two',
        type_code: 'transform',
        type_version_ref: 'pin',
        config: {},
      },
    ],
    transitions: [
      {
        source: 'one',
        target: 'two',
        outcome: 'next',
        priority: 4,
        is_default: false,
        condition: 'request.flag',
      },
    ],
    bindings: [
      {
        step: 'two',
        source_kind: 'STEP_OUTPUT',
        source_step: 'one',
        source_port: 'out',
        target_port: 'in',
        ordinal: 0,
      },
    ],
    targets: [{ step: 'two', user_ref_id: 'same-external-pin' }],
  },
};
const nodes: CanvasNode[] = ['one', 'two', 'three'].map((key) => ({
  key,
  title: key,
  position: { x: 0, y: 0 },
  ports: [
    { key: 'out', direction: 'OUTPUT', schema: { type: 'string' } },
    { key: 'in', direction: 'INPUT', schema: { type: 'string' } },
  ],
}));
describe('Canvas identities and bounded edits', () => {
  const listFixture = (): { document: Workspace; ports: CanvasNode[] } => {
    const schema = { type: 'array', items: { type: 'string' } };
    const ports = ['one', 'two', 'three', 'four'].map((key) => ({
      key,
      title: key,
      position: { x: 0, y: 0 },
      ports: ['INPUT', 'OUTPUT'].map((direction) => ({
        key: direction === 'INPUT' ? 'in' : 'out',
        direction,
        schema,
        cardinality: 'LIST',
      })),
    }));
    const bindings = ['one', 'three'].map((source_step, ordinal) => ({
      step: 'two',
      target_port: 'in',
      target_schema: schema,
      source_kind: 'STEP_OUTPUT',
      source_step,
      source_port: 'out',
      source_schema: schema,
      ordinal,
    }));
    const document: Workspace = {
      ...emptyWorkspace(),
      graph: {
        steps: ports.map(({ key }) => ({ key })),
        transitions: [],
        bindings,
      },
      routing: Object.fromEntries(
        bindings.map((binding) => [
          connectionKey('binding', binding),
          [{ x: binding.ordinal * 10, y: 50 }],
        ]),
      ),
    };
    return { document, ports };
  };
  it('compacts only a removed LIST input and preserves the surviving connection route', () => {
    const { document, ports } = listFixture();
    const edges = canvasEdges(document.graph);
    const result = removeConnection(document, edges[0].id, ports);
    const bindings = result.graph['bindings'] as JsonObject[];
    expect(bindings).toHaveLength(1);
    expect(bindings[0]).toMatchObject({ source_step: 'three', ordinal: 0 });
    expect(result.routing[connectionKey('binding', bindings[0])]).toEqual([
      { x: 10, y: 50 },
    ]);
    expect(document.graph['bindings']).toHaveLength(2);
  });
  it('keeps a reconnected LIST value in the same order and retains both authored routes', () => {
    const { document, ports } = listFixture();
    const result = reconnect(
      document,
      canvasEdges(document.graph)[0].id,
      'data:four:out:out',
      'data:two:in:in',
      ports,
    );
    const bindings = result.graph['bindings'] as JsonObject[];
    expect(
      bindings.find((binding) => binding['source_step'] === 'four'),
    ).toMatchObject({ ordinal: 0 });
    expect(
      bindings.find((binding) => binding['source_step'] === 'three'),
    ).toMatchObject({ ordinal: 1 });
    for (const binding of bindings) {
      expect(result.routing[connectionKey('binding', binding)]).toEqual([
        { x: Number(binding['ordinal']) * 10, y: 50 },
      ]);
    }
  });
  it('keeps partial clones and removed source steps from leaving LIST ordinal gaps', () => {
    const { document, ports } = listFixture();
    const removed = removeSteps(document, ['one'], ports);
    expect((removed.graph['bindings'] as JsonObject[])[0]).toMatchObject({
      source_step: 'three',
      ordinal: 0,
    });
    const cloned = duplicateSteps(document, ['two', 'three']);
    expect(
      (cloned.workspace.graph['bindings'] as JsonObject[]).at(-1),
    ).toMatchObject({
      step: cloned.keys[0],
      source_step: cloned.keys[1],
      ordinal: 0,
    });
  });
  it('removes only selected steps and their attached references without bypassing an approval', () => {
    const before = structuredClone(workspace);
    const result = removeSteps(workspace, ['two']);
    expect(result.graph['steps']).toEqual(
      (workspace.graph['steps'] as unknown[]).slice(0, 1),
    );
    expect(result.graph['transitions']).toEqual([]);
    expect(result.graph['bindings']).toEqual([]);
    expect(result.graph['targets']).toEqual([]);
    expect(result.positions['two']).toBeUndefined();
    expect(workspace).toEqual(before);
    expect(() => removeSteps(workspace, ['missing'])).toThrow();
  });
  it('aligns only selected visual positions while preserving every graph field', () => {
    const positioned = nodes
      .slice(0, 2)
      .map((node) => ({ ...node, position: workspace.positions[node.key] }));
    const result = alignSteps(workspace, positioned, ['one', 'two'], 'x');
    expect(result.positions).toEqual({
      one: { x: 10, y: 20 },
      two: { x: 10, y: 40 },
    });
    expect(result.graph).toEqual(workspace.graph);
    expect(result.routing).toEqual(workspace.routing);
  });
  it('retains an owned manual route when an endpoint is reassigned', () => {
    const edge = canvasEdges(workspace.graph)[0];
    const routed = {
      ...workspace,
      routing: { [edge.id]: [{ x: 100, y: 200 }] },
    };
    const result = reconnect(
      routed,
      edge.id,
      'control:one:out',
      'control:one:in',
      nodes,
    );
    const changed = canvasEdges(result.graph).find(
      (item) => item.kind === 'control',
    )!;
    expect(result.routing[changed.id]).toEqual([{ x: 100, y: 200 }]);
    expect(result.routing[edge.id]).toBeUndefined();
    expect(routed.routing[edge.id]).toEqual([{ x: 100, y: 200 }]);
  });
  it('duplicates internal control/data links with new keys while preserving pins and edge kinds', () => {
    const { workspace: result, keys } = duplicateSteps(workspace, [
      'one',
      'two',
    ]);
    expect(keys).toEqual(['one_copy_1', 'two_copy_1']);
    expect(canvasEdges(result.graph).map((edge) => edge.kind)).toEqual([
      'control',
      'control',
      'data',
      'data',
    ]);
    expect(
      (result.graph['steps'] as Record<string, unknown>[])[2],
    ).toMatchObject({
      type_version_ref: 'pin',
      config: { zero: 0, flag: false },
    });
    expect(
      (result.graph['bindings'] as Record<string, unknown>[])[1],
    ).toMatchObject({ step: keys[1], source_step: keys[0], ordinal: 0 });
    expect(workspace.graph['steps']).toHaveLength(2);
    expect(duplicateSteps(result, ['one']).keys).toEqual(['one_copy_2']);
  });
  it('never duplicates an incoming external step-output binding implicitly', () => {
    const result = duplicateSteps(workspace, ['two']).workspace;
    expect(result.graph['bindings']).toHaveLength(1);
    expect(result.graph['transitions']).toHaveLength(1);
  });
  it('reconnects within one edge kind and preserves condition/priority', () => {
    const edge = canvasEdges(workspace.graph)[0];
    const result = reconnect(
      workspace,
      edge.id,
      'control:one:out',
      'control:three:in',
      nodes,
    );
    expect(
      (result.graph['transitions'] as Record<string, unknown>[])[0],
    ).toMatchObject({
      target: 'three',
      priority: 4,
      is_default: false,
      condition: 'request.flag',
    });
    expect(() =>
      reconnect(
        workspace,
        edge.id,
        'data:one:out:out',
        'data:two:in:in',
        nodes,
      ),
    ).toThrow();
    expect(removeConnection(workspace, edge.id).graph['bindings']).toEqual(
      workspace.graph['bindings'],
    );
  });
  it('moves selection atomically without mutating the original and rejects coordinate overflow', () => {
    expect(
      moveSelection(workspace, ['one', 'two'], { x: 20, y: 0 }).positions,
    ).toEqual({ one: { x: 30, y: 20 }, two: { x: 50, y: 40 } });
    expect(workspace.positions['one'].x).toBe(10);
    expect(() =>
      moveSelection(workspace, ['one'], { x: Infinity, y: 0 }),
    ).toThrow();
    expect(() =>
      moveSelection(workspace, ['one'], { x: 1000000, y: 0 }),
    ).toThrow();
  });
});
