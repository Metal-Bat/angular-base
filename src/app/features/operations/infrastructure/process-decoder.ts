import { record } from '../../../core/transport/api-failure';
import { decodePage } from '../../../core/transport/response-adapters';
import { ProcessSnapshot, processStatuses } from '../domain/process-tracking';
import { stringField } from './workspace-decoders';
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > 1000) {
    throw Error('Invalid tracking response');
  }
  return value.map(record);
}
function optional(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw Error('Invalid tracking response');
  }
  return value;
}
export function tracking(process: unknown, timeline: unknown): ProcessSnapshot {
  const owner = record(process);
  const view = record(timeline);
  const status = stringField(view, 'status');
  if (!processStatuses.includes(status as ProcessSnapshot['status'])) {
    throw Error('Unknown process state');
  }
  const events = decodePage(view['events'], (value) => {
    const event = record(value);
    if (!Number.isSafeInteger(event['sequence'])) {
      throw Error('Invalid event');
    }
    return {
      sequence: Number(event['sequence']),
      kind: stringField(event, 'event_type'),
      occurred: stringField(event, 'occurred_at'),
      task: optional(event['work_item_ref_id']),
    };
  });
  return {
    reference: stringField(view, 'process_ref_id'),
    request: stringField(view, 'business_request_ref_id'),
    workflow: stringField(owner, 'workflow_version_ref_id'),
    status: status as ProcessSnapshot['status'],
    positions: rows(view['current_positions']).map((position) => ({
      step: stringField(position, 'step_key'),
      status: stringField(position, 'status'),
      wait: optional(position['wait_kind']),
    })),
    steps: rows(view['steps']).map((step) => ({
      key: stringField(step, 'step_key'),
      status: stringField(step, 'path_status'),
    })),
    children: rows(view['children'] ?? []).map((child) => ({
      reference: stringField(child, 'process_ref_id'),
      status: stringField(child, 'status'),
    })),
    events: events.items,
    page: events.page,
    totalPages: events.totalPages,
    coverage: optional(view['coverage_started_at']),
  };
}
