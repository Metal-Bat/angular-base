import { emptyWorkspace } from './authoring';
import { connectionKey } from './workflow-authoring';
import { workspaceGraphEdit } from './workspace-graph-edit';

it('retains manual geometry and focus identity when only branch metadata changes', () => {
  const edge = {
    source: 'a',
    target: 'b',
    outcome: 'approve',
    priority: 1,
    condition: 'request.flag',
  };
  const oldKey = connectionKey('transition', edge);
  const workspace = {
    ...emptyWorkspace(),
    graph: { steps: [], transitions: [edge] },
    routing: { [oldKey]: [{ x: 100, y: 200 }] },
  };
  const changed = { ...edge, priority: 7 };
  const graph = { ...workspace.graph, transitions: [changed] };
  const next = workspaceGraphEdit(workspace, graph);
  const key = connectionKey('transition', changed);
  expect(next.workspace.graph).toEqual(graph);
  expect(next.workspace.routing).toEqual({ [key]: [{ x: 100, y: 200 }] });
  expect(next.identities[oldKey]).toBe(key);
  expect(workspace.routing).toEqual({ [oldKey]: [{ x: 100, y: 200 }] });
  expect(
    workspaceGraphEdit(workspace, {
      ...graph,
      transitions: [{ ...changed, target: 'other' }],
    }).identities,
  ).toEqual({});
});

it('keeps authored data routes with their source when LIST order changes or a sibling is removed', () => {
  const first = {
    step: 'b',
    target_port: 'items',
    ordinal: 0,
    source_kind: 'STEP_OUTPUT',
    source_step: 'a',
    source_port: 'items',
  };
  const second = { ...first, ordinal: 1, source_step: 'c' };
  const workspace = {
    ...emptyWorkspace(),
    graph: { steps: [], bindings: [first, second] },
    routing: {
      [connectionKey('binding', first)]: [{ x: 10, y: 20 }],
      [connectionKey('binding', second)]: [{ x: 30, y: 40 }],
    },
  };
  const moved = [
    { ...second, ordinal: 0 },
    { ...first, ordinal: 1 },
  ];
  const next = workspaceGraphEdit(workspace, {
    ...workspace.graph,
    bindings: moved,
  });
  expect(next.workspace.routing[connectionKey('binding', moved[0])]).toEqual([
    { x: 30, y: 40 },
  ]);
  expect(next.workspace.routing[connectionKey('binding', moved[1])]).toEqual([
    { x: 10, y: 20 },
  ]);
  const removed = workspaceGraphEdit(workspace, {
    ...workspace.graph,
    bindings: [moved[0]],
  });
  expect(removed.workspace.routing).toEqual({
    [connectionKey('binding', moved[0])]: [{ x: 30, y: 40 }],
  });
});
