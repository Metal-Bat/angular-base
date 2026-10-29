import { record } from '../../../core/transport/api-failure';
import { BindingPreview } from '../domain/binding-preview';
import { JsonObject } from '../../../shared/domain/json-value';
export function bindingPreview(
  raw: unknown,
  body: JsonObject | undefined,
): BindingPreview {
  const row = record(raw);
  const fail = (): never => {
    throw Error('Invalid mapping preview response');
  };
  const text = (value: unknown): string =>
    typeof value === 'string' && value.length <= 2048 ? value : fail();
  if (
    !['VALID', 'MISSING', 'INVALID'].includes(String(row['sample_state'])) ||
    row['values_redacted'] !== true ||
    row['provider_called'] !== false ||
    row['tool_called'] !== false ||
    row['handler_called'] !== false ||
    row['target_step'] !== body?.['target_step'] ||
    row['target_port'] !== body?.['target_port'] ||
    !Array.isArray(row['fields']) ||
    row['fields'].length > 64 ||
    !Array.isArray(row['issues']) ||
    row['issues'].length > 64
  ) {
    fail();
  }
  return {
    workflow_version_ref: text(row['workflow_version_ref']),
    candidate_checksum:
      row['candidate_checksum'] === null
        ? null
        : text(row['candidate_checksum']),
    target_step: text(row['target_step']),
    target_port: text(row['target_port']),
    sample_state: row['sample_state'] as BindingPreview['sample_state'],
    fields: (row['fields'] as unknown[]).map((value) => {
      const field = record(value);
      if (
        Object.keys(field).some(
          (key) =>
            !['path', 'source_kind', 'sample_origin', 'value_type'].includes(
              key,
            ),
        ) ||
        !['REQUEST', 'CONTEXT', 'CONSTANT', 'STEP_OUTPUT'].includes(
          String(field['source_kind']),
        ) ||
        !['AUTHOR', 'VISIBLE_CONSTANT'].includes(
          String(field['sample_origin']),
        ) ||
        ![
          'null',
          'boolean',
          'integer',
          'number',
          'string',
          'array',
          'object',
        ].includes(String(field['value_type']))
      ) {
        fail();
      }
      return {
        path: text(field['path']),
        source_kind: text(field['source_kind']),
        sample_origin: text(field['sample_origin']),
        value_type: text(field['value_type']),
      };
    }),
    issues: (row['issues'] as unknown[]).map((value) => {
      const issue = record(value);
      return { pointer: text(issue['pointer']), code: text(issue['code']) };
    }),
  };
}
