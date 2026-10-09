import { processStatuses } from '../domain/process-tracking';
import { tracking } from './process-decoder';
describe('Authorized process tracking', () => {
  const snapshot = (status: string): Record<string, unknown> => ({
    process_ref_id: 'process',
    business_request_ref_id: 'request',
    status,
    current_positions: [],
    steps: [],
    children: [],
    events: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
    coverage_started_at: null,
  });
  it.each(processStatuses)(
    'accepts the declared %s lifecycle state',
    (status) => {
      expect(
        tracking({ workflow_version_ref_id: 'workflow' }, snapshot(status))
          .status,
      ).toBe(status);
    },
  );
  it('rejects unknown statuses and bounds tracking lists', () => {
    expect(() => tracking({}, snapshot('UNKNOWN'))).toThrow();
    expect(() =>
      tracking(
        { workflow_version_ref_id: 'workflow' },
        { ...snapshot('WAITING'), steps: Array(1001).fill({}) },
      ),
    ).toThrow();
  });
  it('does not carry authoring configuration into the view model', () => {
    const result = tracking(
      { workflow_version_ref_id: 'workflow', graph: { secret: 'private' } },
      { ...snapshot('WAITING'), authoring: { secret: 'private' } },
    );
    expect(JSON.stringify(result)).not.toContain('private');
  });
});

describe('Execution detail projection', () => {
  const execution = {
    ref_id: 'execution',
    visit_number: 2,
    status: 'FAILED',
    wait_kind: null,
    last_error_code: 'EFFECT_UNKNOWN',
    attempts: [
      {
        number: 1,
        status: 'FAILED',
        error_code: 'TIMEOUT',
        started_at: '2026-10-08T10:00:00Z',
        ended_at: null,
      },
    ],
    work_item: {
      ref_id: 'task',
      status: 'COMPLETED',
      outcome_key: 'REVIEWED',
      due_at: null,
      candidates: [{ principal_ref_id: 'private-person' }],
    },
    inputs: { secret: 'private-input' },
    outputs: { secret: 'private-output' },
  };
  const timeline = {
    process_ref_id: 'process',
    business_request_ref_id: 'request',
    status: 'FAILED',
    current_positions: [
      { step_key: 'left', status: 'WAITING', wait_kind: 'HUMAN' },
      { step_key: 'right', status: 'WAITING', wait_kind: 'EVENT' },
    ],
    steps: [
      { step_key: 'effect', path_status: 'FAILED', executions: [execution] },
    ],
    children: [],
    events: { items: [], page: 1, size: 20, total: 0, total_pages: 0 },
    coverage_started_at: null,
  };
  it('retains branches, visits and human outcomes without private payloads', () => {
    const view = tracking({ workflow_version_ref_id: 'pinned' }, timeline);
    expect(view.positions.map((position) => position.step)).toEqual([
      'left',
      'right',
    ]);
    expect(view.workflow).toBe('pinned');
    expect(view.steps[0].executions[0]).toMatchObject({
      visit: 2,
      error: 'EFFECT_UNKNOWN',
      task: { outcome: 'REVIEWED' },
    });
    expect(view.steps[0].executions[0].attempts[0].error).toBe('TIMEOUT');
    expect(JSON.stringify(view)).not.toContain('private-');
  });
  it('rejects malformed attempt counters and excessive attempt collections', () => {
    for (const attempts of [
      [{ ...execution.attempts[0], number: 0 }],
      Array(1001).fill(execution.attempts[0]),
    ]) {
      expect(() =>
        tracking(
          { workflow_version_ref_id: 'pin' },
          {
            ...timeline,
            steps: [
              {
                step_key: 'effect',
                path_status: 'FAILED',
                executions: [{ ...execution, attempts }],
              },
            ],
          },
        ),
      ).toThrow();
    }
  });
});
