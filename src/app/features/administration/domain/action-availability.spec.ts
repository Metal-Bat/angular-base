import { actionAvailable } from './action-availability';
import { AdminCommand } from './admin-command';
const command = (path: string): AdminCommand =>
  ({ path, mutation: true }) as AdminCommand;
it('limits worker retry to recorded failures and revoke to pending/running deliveries', () => {
  const retry = command('/api/v1/tasks/executions/{task_id}/retry');
  const revoke = command('/api/v1/tasks/executions/{task_id}/revoke');
  expect(actionAvailable(retry, 'tasks', { status: 'FAILURE' })).toBe(true);
  expect(actionAvailable(retry, 'tasks', { status: 'SUCCESS' })).toBe(false);
  expect(actionAvailable(revoke, 'tasks', { status: 'STARTED' })).toBe(true);
  expect(actionAvailable(revoke, 'tasks', { status: 'REVOKED' })).toBe(false);
  expect(actionAvailable(revoke, 'tasks', { status: 'SUCCESS' })).toBe(false);
});
it('preserves recovery-only inspection limits and excludes impossible process transitions', () => {
  const pause = command('/api/v1/processes/{ref_id}/pause');
  expect(actionAvailable(pause, 'processes', { ref_id: 'known' })).toBe(true);
  expect(actionAvailable(pause, 'processes', { status: 'RUNNING' })).toBe(true);
  expect(actionAvailable(pause, 'processes', { status: 'COMPLETED' })).toBe(
    false,
  );
  expect(
    actionAvailable(command('/api/v1/processes/{ref_id}/retry'), 'processes', {
      status: 'FAILED',
    }),
  ).toBe(true);
  expect(
    actionAvailable(command('/api/v1/processes/{ref_id}/retry'), 'processes', {
      status: 'PAUSED',
    }),
  ).toBe(false);
});
it('keeps read-only process inspection while suppressing commands the producer rejects during an active child', () => {
  const row = {
    status: 'WAITING',
    current_positions: [
      { wait_kind: 'SUBPROCESS', execution_status: 'WAITING' },
    ],
  };
  for (const action of [
    'pause',
    'cancel',
    'retry',
    'compensate',
    'timeout',
    'resume',
    'recover',
  ]) {
    expect(
      actionAvailable(
        command('/api/v1/processes/{ref_id}/' + action),
        'processes',
        row,
      ),
    ).toBe(false);
  }
  expect(
    actionAvailable(
      { ...command('/api/v1/processes/{ref_id}/timeline'), mutation: false },
      'processes',
      row,
    ),
  ).toBe(true);
  expect(
    actionAvailable(command('/api/v1/processes/{ref_id}/cancel'), 'processes', {
      status: 'WAITING',
      current_positions: [{ wait_kind: 'HUMAN', execution_status: 'WAITING' }],
    }),
  ).toBe(true);
  expect(
    actionAvailable(
      command('/api/v1/processes/{ref_id}/recover'),
      'processes',
      { ref_id: 'known' },
    ),
  ).toBe(true);
});
