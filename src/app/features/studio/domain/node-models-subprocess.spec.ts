import { nodeModels } from './node-models';
import { emptyWorkspace } from './authoring';
import { handlers } from './node-inspector';
const handler = handlers.find((row) => row.handler_key === 'subprocess')!;
const catalog = [
  {
    type_schema: handler.config_schema,
    metadata: {
      ref_id: 'call-type',
      code: 'SUBPROCESS',
      handler_key: 'subprocess',
      handler_version: '1',
    },
  },
];
const workspace = {
  ...emptyWorkspace(),
  graph: {
    steps: [
      {
        key: 'call',
        type_code: 'SUBPROCESS',
        type_version_ref: 'call-type',
        config: {},
        subprocess: { workflow_version_ref: 'child-v1', inputs: [] },
      },
    ],
    transitions: [{ source: 'call', target: 'finish', outcome: 'approved' }],
  },
};
it('offers actual pinned child business outcomes and technical failure for guided route authoring', () => {
  const before = structuredClone(workspace);
  const nodes = nodeModels(workspace, catalog, [
    {
      category: 'subprocess',
      metadata: {
        workflow_version_ref: 'child-v1',
        interface: {
          inputs: [],
          outputs: [],
          outcomes: { approved: 'finish' },
        },
      },
    },
  ]);
  expect(nodes[0].outcomes).toEqual(['approved', 'failure']);
  expect(nodes[0].outcomes).not.toContain('success');
  expect(nodes[0].canContinue).toBe(true);
  expect(workspace).toEqual(before);
});
it('preserves existing route labels but requires available pin metadata before guided new-route creation', () => {
  const node = nodeModels(workspace, catalog, [])[0];
  expect(node.outcomes).toEqual(['approved']);
  expect(node.canContinue).toBe(false);
  const revoked = nodeModels(workspace, catalog, [
    {
      category: 'subprocess',
      metadata: {
        workflow_version_ref: 'child-v1',
        runtime_available: false,
        interface: { outcomes: { approved: 'finish' } },
      },
    },
  ])[0];
  expect(revoked.canContinue).toBe(false);
  expect(revoked.outcomes).toEqual(['approved']);
});
