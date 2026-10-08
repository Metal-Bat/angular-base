import { FieldSpec } from '../../domain/authoring';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
export function initialValue(field: FieldSpec): JsonValue | undefined {
  if (field.initial !== undefined) {
    return field.initial;
  }
  if (field.key === 'data_schema') {
    return { type: 'object', properties: {} };
  }
  if (field.key === 'render_schema') {
    return { root: { component: 'vertical', children: [] } };
  }
  if (field.type === 'json' && field.required) {
    return field.schema['type'] === 'array' ? [] : {};
  }
  if (field.type === 'number' && field.required) {
    return Number(field.schema['minimum'] ?? 0);
  }
  return field.required ? '' : undefined;
}
export function displayValue(field: FieldSpec, values: JsonObject): string {
  const value = values[field.key];
  return value === undefined
    ? ''
    : field.type === 'json'
      ? JSON.stringify(value, null, 2)
      : String(value ?? '');
}
export function resourceLabel(row: JsonObject): string {
  return String(
    row['name'] ??
      row['code'] ??
      row['version'] ??
      row['number'] ??
      'Record detail',
  );
}
