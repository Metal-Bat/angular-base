import { emptyWorkspace, Workspace } from './authoring';
import { canvasEdges, CanvasNode } from './workflow-authoring';
import {
  duplicateSteps,
  moveSelection,
  reconnect,
  removeConnection,
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
    ).toMatchObject({ step: keys[1], source_step: keys[0], ordinal: 1 });
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
