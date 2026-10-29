import { record } from '../../../core/transport/api-failure';
import { JsonObject } from '../../../shared/domain/json-value';
import {
  AgentChoicePreview,
  AgentEvaluationRequest,
  AgentReportSource,
} from '../application/agent-authoring-port';

export const text = (row: Record<string, unknown>, key: string): string => {
  if (typeof row[key] !== 'string') {
    throw Error('Invalid Agent authoring response');
  }
  return row[key];
};
export const optionalText = (
  row: Record<string, unknown>,
  key: string,
): string | null => (row[key] === null ? null : text(row, key));
export const strings = (value: unknown, max: number): string[] => {
  if (
    !Array.isArray(value) ||
    value.length > max ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw Error('Invalid Agent authoring response');
  }
  return value;
};
export function choicePreview(value: unknown): AgentChoicePreview {
  const row = record(value);
  const state = text(row, 'sample_state');
  if (
    !['STATIC', 'MISSING', 'EMPTY', 'INVALID', 'VALID'].includes(state) ||
    row['provider_called'] !== false ||
    !Array.isArray(row['options']) ||
    row['options'].length > 254
  ) {
    throw Error('Invalid decision preview');
  }
  return {
    state: state as AgentChoicePreview['state'],
    inputKey: optionalText(row, 'options_input_key'),
    options: row['options'].map((entry) => {
      const option = record(entry);
      const labels = record(option['labels']);
      if (!Object.values(labels).every((label) => typeof label === 'string')) {
        throw Error('Invalid choice labels');
      }
      return {
        key: text(option, 'key'),
        labels: labels as Record<string, string>,
        description: text(option, 'description'),
      };
    }),
    issues: strings(row['issue_codes'], 64),
  };
}
export function reportSource(value: unknown): AgentReportSource {
  const row = record(value);
  const maxRows = row['max_rows'];
  const version = row['definition_version'];
  if (
    !Number.isSafeInteger(maxRows) ||
    Number(maxRows) < 1 ||
    Number(maxRows) > 10 ||
    !Number.isSafeInteger(version) ||
    Number(version) < 1 ||
    !['PUBLIC', 'INTERNAL', 'CONFIDENTIAL'].includes(
      text(row, 'classification'),
    )
  ) {
    throw Error('Invalid saved report source');
  }
  return {
    ref: text(row, 'report_ref'),
    name: text(row, 'source_key'),
    createdAt: text(row, 'created_at'),
    version: Number(version),
    classification: text(row, 'classification'),
    fields: strings(row['fields'], 256),
    maxRows: Number(maxRows),
  };
}
export function evaluationRequest(value: unknown): AgentEvaluationRequest {
  const row = record(value);
  const data = record(row['data']);
  return {
    ref: text(row, 'ref_id'),
    name:
      typeof data['title'] === 'string' && data['title']
        ? data['title']
        : 'Untitled request',
    untitled: typeof data['title'] !== 'string' || !data['title'],
    version: text(row, 'workflow_version_ref_id'),
    status: text(row, 'status'),
    createdAt: text(row, 'created_at'),
  };
}
export const schema = (value: unknown): JsonObject | null =>
  value === null ? null : (record(value) as JsonObject);
