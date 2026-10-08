import { FieldSpec, projectFields } from '../../studio/domain/authoring';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
export type AdminCommand = {
  id: string;
  title: string;
  permission: string;
  mutation: boolean;
  method: string;
  path: string;
  bodyRequired: boolean;
  fields: {
    body: readonly FieldSpec[];
    path: readonly FieldSpec[];
    query: readonly FieldSpec[];
  };
};
export type AdminInput = {
  body: Record<string, JsonValue>;
  path: Record<string, JsonValue>;
  query: Record<string, JsonValue>;
};
export type AdminResult = {
  value: JsonValue;
  page: number;
  totalPages: number;
  requestId: string | null;
};
export function freezeCommand(
  command: AdminCommand,
  input: AdminInput,
): AdminInput {
  const project = (kind: keyof AdminInput): JsonObject => ({
    ...projectFields(command.fields[kind], input[kind]),
  });
  return structuredClone({
    body: project('body'),
    path: project('path'),
    query: project('query'),
  });
}
// Administrative responses may include authorization metadata; never reveal stored credentials.
export function redactAdmin(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(redactAdmin);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const output: Record<string, JsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      continue;
    }
    output[key] =
      /password|secret|credential|token|authorization|api_key/i.test(key)
        ? '[redacted]'
        : redactAdmin(item);
  }
  return output;
}
