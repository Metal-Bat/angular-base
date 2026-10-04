import { record } from '../../../core/transport/api-failure';
import { CaseRecord, CatalogItem } from '../domain/workspace-models';
export function stringField(
  value: Record<string, unknown>,
  key: string,
): string {
  if (typeof value[key] !== 'string' || !value[key]) {
    throw new Error('Invalid case response.');
  }
  return value[key];
}
function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error('Invalid case response.');
  }
  return value;
}
export function catalogItem(value: unknown): CatalogItem {
  const item = record(value);
  if (item['render_dialect'] !== 'bpms.render/1') {
    throw new Error('Unsupported form dialect.');
  }
  return {
    ref: stringField(item, 'ref_id'),
    name: stringField(item, 'name'),
    code: stringField(item, 'code'),
    form: stringField(item, 'form_version_ref_id'),
    workflow: stringField(item, 'workflow_version_ref_id'),
  };
}
export function caseRecord(value: unknown): CaseRecord {
  const item = record(value);
  const kind = item['kind'];
  if (
    kind !== undefined &&
    !['HUMAN_TASK', 'AI_APPROVAL', 'UNSUPPORTED'].includes(String(kind))
  ) {
    throw new Error('Unknown task kind.');
  }
  return {
    ref: stringField(item, 'ref_id'),
    status: stringField(item, 'status'),
    kind: (kind ?? 'HUMAN_TASK') as CaseRecord['kind'],
    claimant: nullableString(item['claimant_ref_id']),
    process: nullableString(item['process_ref_id']),
    form: nullableString(item['form_version_ref_id']),
    workflow: nullableString(item['workflow_version_ref_id']),
    runtime: item['runtime_state'] ?? null,
  };
}
