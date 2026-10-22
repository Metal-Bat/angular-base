import { emptyWorkspace } from './authoring';
import { connectionKey } from './workflow-authoring';
import {
  appendRegisteredStep,
  placeControlStep,
  StepAction,
} from './workflow-step-actions';
const branch = {
  source: 'review',
  target: 'finish',
  outcome: 'approve',
  priority: 7,
  is_default: false,
  condition: 'request.flag',
  extension: 'preserved',
};
const identity = connectionKey('transition', branch);
const workspace = {
  ...emptyWorkspace(),
  graph: {
    steps: [
      {
        key: 'review',
        type_code: 'HUMAN_TASK',
        type_version_ref: 'human-pin',
        config: {},
      },
      {
        key: 'finish',
        type_code: 'FINISH',
        type_version_ref: 'finish-pin',
        config: {},
      },
    ],
    transitions: [branch],
    bindings: [
      {
        source_kind: 'STEP_OUTPUT',
        source_step: 'review',
        step: 'finish',
        source_port: 'result',
        target_port: 'value',
        ordinal: 0,
      },
    ],
    targets: [{ step: 'review', user_ref: 'authorized-user' }],
  },
  routing: { [identity]: [{ x: 200, y: 100 }], other: [{ x: 700, y: 300 }] },
};
const entry = {
  category: 'step_type',
  key: 'TIMER:1',
  metadata: { code: 'TIMER', ref_id: 'timer-pin', handler_key: 'timer' },
};
const action: StepAction = {
  mode: 'insert',
  source: 'review',
  edge: identity,
  title: 'Review',
  target: 'Finish',
  targetKey: 'finish',
};

it('inserts a pinned step atomically and preserves branch policy, mappings and approvals', () => {
  const before = structuredClone(workspace);
  const result = placeControlStep(workspace, action, entry, 'next', {
    x: 300,
    y: 200,
  });
  expect(result.workspace.graph['transitions']).toEqual([
    { ...branch, target: result.key },
    {
      source: result.key,
      target: 'finish',
      outcome: 'next',
      priority: 0,
      is_default: true,
    },
  ]);
  expect(result.workspace.graph['steps']).toEqual([
    ...workspace.graph.steps,
    {
      key: result.key,
      type_code: 'TIMER',
      type_version_ref: 'timer-pin',
      config: {},
    },
  ]);
  expect(result.workspace.graph['bindings']).toEqual(workspace.graph.bindings);
  expect(result.workspace.graph['targets']).toEqual(workspace.graph.targets);
  expect(result.workspace.routing).toEqual({ other: [{ x: 700, y: 300 }] });
  expect(workspace).toEqual(before);
});
it('adds only a new declared branch and rejects occupied outcomes, stale connections and terminal insertion', () => {
  const next: StepAction = { ...action, mode: 'next', edge: '' };
  expect(() =>
    placeControlStep(workspace, next, entry, 'approve', { x: 300, y: 200 }),
  ).toThrow('already has a connection');
  const result = placeControlStep(workspace, next, entry, 'return', {
    x: 300,
    y: 200,
  });
  expect((result.workspace.graph['transitions'] as unknown[])[0]).toEqual(
    branch,
  );
  expect(() =>
    placeControlStep(workspace, { ...action, edge: 'stale' }, entry, 'next', {
      x: 0,
      y: 0,
    }),
  ).toThrow('no longer exists');
  expect(() =>
    placeControlStep(
      workspace,
      action,
      { ...entry, metadata: { ...entry.metadata, handler_key: 'finish' } },
      'next',
      { x: 0, y: 0 },
    ),
  ).toThrow('can continue');
  expect(() =>
    appendRegisteredStep(workspace, { ...entry, metadata: {} }, 'new'),
  ).toThrow('registered');
});
