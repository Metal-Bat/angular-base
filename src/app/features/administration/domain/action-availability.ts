import { JsonObject } from '../../../shared/domain/json-value';
import { AdminCommand } from './admin-command';

export function hasActiveSubprocess(row: JsonObject): boolean {
  const positions = row['current_positions'];
  return (
    Array.isArray(positions) &&
    positions.some(
      (position) =>
        !!position &&
        typeof position === 'object' &&
        !Array.isArray(position) &&
        position['wait_kind'] === 'SUBPROCESS' &&
        position['execution_status'] === 'WAITING',
    )
  );
}

/** Presentation guard from the inspected producer policy; server checks remain authoritative. */
export function actionAvailable(
  command: AdminCommand,
  group: string,
  row: JsonObject,
): boolean {
  if (command.mutation && group === 'processes' && hasActiveSubprocess(row)) {
    return false;
  }
  const status = row['status'];
  if (!command.mutation || typeof status !== 'string') {
    return true;
  }
  const action = command.path.split('/').at(-1) ?? '';
  if (
    group === 'tasks' &&
    command.path.startsWith('/api/v1/tasks/executions/')
  ) {
    if (action === 'retry') {
      return status === 'FAILURE';
    }
    if (action === 'revoke') {
      return ['PENDING', 'RECEIVED', 'STARTED', 'RETRY', 'QUEUED'].includes(
        status,
      );
    }
  }
  if (group === 'processes') {
    // apps.processes.domain.state._TRANSITIONS. Missing state is retained for
    // recovery-only operators who have no process-inspection permission.
    const states: Readonly<Record<string, readonly string[]>> = {
      pause: ['RUNNING', 'WAITING'],
      cancel: ['RUNNING', 'WAITING', 'PAUSED', 'FAILED'],
      retry: ['FAILED'],
      compensate: [
        'FAILED',
        'CANCELLED',
        'COMPENSATING',
        'COMPENSATION_FAILED',
      ],
    };
    return !states[action] || states[action].includes(status);
  }
  return true;
}
