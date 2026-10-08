import {
  Filter,
  ListQuery,
  QueryField,
} from '../../../shared/domain/list-query';
import {
  schemaErrors,
  seedValue,
} from '../../administration/domain/schema-form';
import { parseDocument } from '../../studio/domain/authoring';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export type RecordRow = JsonObject;
export type RecordField = {
  key: string;
  label: string;
  type:
    'text' | 'number' | 'boolean' | 'password' | 'email' | 'strings' | 'json';
  schema?: JsonObject;
  options?: readonly string[];
  initial?: JsonValue;
  required: boolean;
  nullable: boolean;
  min?: number;
  max?: number;
};
export type RecordDefinition = {
  key: string;
  title: string;
  description: string;
  permission: string;
  userPartition?: boolean;
  selector?: boolean;
  adminGroup?: string;
  commandBase?: string;
  immutableStatuses?: readonly string[];
  columns: readonly { key: string; label: string }[];
  queryFields: readonly QueryField[];
  extras: readonly { key: string; label: string }[];
  fixed: readonly Filter[];
  fields: readonly RecordField[];
  createFields: readonly RecordField[];
  operations: {
    search: string;
    get?: string;
    create?: string;
    update?: string;
    delete?: string;
    restore?: string;
    history?: string;
    report?: string;
  };
};
export type RecordPage = {
  items: readonly RecordRow[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
};
export function recordReference(row: RecordRow): string {
  const value = row['ref_id'] ?? row['key'] ?? row['id'];
  return typeof value === 'string' ? value : '';
}
export function formValues(
  fields: readonly RecordField[],
  row: RecordRow | null,
): Record<string, string | boolean> {
  return Object.fromEntries(
    fields.map((field) => [
      field.key,
      field.type === 'boolean'
        ? (row?.[field.key] ?? field.initial) === true
        : field.type === 'strings'
          ? Array.isArray(row?.[field.key])
            ? (row![field.key] as JsonValue[]).join('\n')
            : ''
          : field.type === 'json'
            ? JSON.stringify(
                row?.[field.key] ??
                  field.initial ??
                  (field.schema ? seedValue(field.schema) : {}) ??
                  {},
              )
            : String(row?.[field.key] ?? field.initial ?? ''),
    ]),
  );
}
function validateFieldValue(field: RecordField, value: string | boolean): void {
  if (field.schema && value !== '') {
    const parsed =
      field.type === 'json'
        ? parseDocument('{"value":' + String(value) + '}')['value']
        : field.type === 'strings'
          ? String(value).split('\n').filter(Boolean)
          : field.type === 'number'
            ? Number(value)
            : value;
    const errors = schemaErrors(
      field.schema,
      parsed,
      field.key,
      field.required,
    );
    if (Object.keys(errors).length) {
      throw Error(Object.values(errors)[0]);
    }
  }
  if (field.required && value === '') {
    throw Error('Complete the required fields.');
  }
  if (
    typeof value === 'string' &&
    ((field.min !== undefined && value.length < field.min) ||
      (field.max !== undefined && value.length > field.max))
  ) {
    throw Error('Check the field length.');
  }
  if (
    field.type === 'email' &&
    value !== '' &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))
  ) {
    throw Error('Enter a valid email address.');
  }
  if (field.type === 'number' && !Number.isFinite(Number(value))) {
    throw Error('Enter a valid number.');
  }
}
export function formBody(
  fields: readonly RecordField[],
  values: Record<string, string | boolean>,
): RecordRow {
  const body: Record<string, JsonValue> = {};
  for (const field of fields) {
    const value = values[field.key] ?? '';
    validateFieldValue(field, value);
    if (field.type === 'strings' && value === '') {
      body[field.key] = [];
      continue;
    }
    if (value === '') {
      if (field.nullable) {
        body[field.key] = null;
      }
      continue;
    }
    body[field.key] =
      field.type === 'json'
        ? parseDocument('{"value":' + String(value) + '}')['value']
        : field.type === 'strings'
          ? String(value)
              .split('\n')
              .map((v) => v.trim())
              .filter(Boolean)
          : field.type === 'boolean'
            ? value === true
            : field.type === 'number'
              ? Number(value)
              : String(value);
  }
  return body;
}
export function redactRecord(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(redactRecord);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) => !['__proto__', 'constructor', 'prototype'].includes(key),
      )
      .map(([key, item]) => [
        key,
        /password|secret|credential|token|authorization|api_key/i.test(key)
          ? '[redacted]'
          : redactRecord(item),
      ]),
  );
}
export type AppliedList = { query: ListQuery; page: RecordPage };

export function fieldErrors(
  fields: readonly RecordField[],
  values: Record<string, string | boolean>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.schema && values[field.key] !== '') {
      try {
        const value = values[field.key];
        const parsed =
          field.type === 'json'
            ? parseDocument('{"value":' + String(value) + '}')['value']
            : field.type === 'strings'
              ? String(value).split('\n').filter(Boolean)
              : field.type === 'number'
                ? Number(value)
                : value;
        Object.assign(
          errors,
          schemaErrors(field.schema, parsed, field.key, field.required),
        );
      } catch {
        errors[field.key] = 'Invalid values';
      }
    }
    try {
      validateFieldValue(field, values[field.key] ?? '');
    } catch (error) {
      errors[field.key] =
        error instanceof Error ? error.message : 'Invalid values';
    }
  }
  return errors;
}

export const passwordFields: readonly RecordField[] = [
  {
    key: 'new_password',
    label: 'New password',
    type: 'password',
    required: true,
    nullable: false,
    min: 8,
  },
];

export function issueFieldErrors(
  issues: readonly { pointer: string; code: string }[],
): Record<string, string> {
  return Object.fromEntries(
    issues.map((issue) => [
      issue.pointer.replace(/^\/(body\/)?/, '').replaceAll('/', '.'),
      issue.code,
    ]),
  );
}
