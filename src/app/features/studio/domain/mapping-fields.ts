import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import { editorSchema } from './mapping-schema';
import { escapePointer } from './mapping-sources';
export type MappingField = { path: string; label: string; schema: JsonObject };
export function mappingFields(
  schema: JsonObject,
  prefix = '',
  label = '',
  depth = 0,
): MappingField[] {
  if (depth > 12) {
    return [];
  }
  const properties = (editorSchema(schema)['properties'] ?? {}) as JsonObject;
  return Object.entries(properties).flatMap(([key, value]) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }
    const child = value as JsonObject;
    const path = prefix + '/' + escapePointer(key);
    const title = label
      ? label + ' › ' + String(child['title'] ?? key)
      : String(child['title'] ?? key);
    return [
      { path, label: title, schema: child },
      ...mappingFields(child, path, title, depth + 1),
    ];
  });
}
export function schemaAt(schema: JsonObject, path: string): JsonObject | null {
  let current = editorSchema(schema);
  for (const part of path.slice(1).split('/')) {
    const key = part.replaceAll('~1', '/').replaceAll('~0', '~');
    const next =
      current['type'] === 'array'
        ? current['items']
        : (current['properties'] as JsonObject | undefined)?.[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      return null;
    }
    current = next as JsonObject;
  }
  return current;
}
export function boundInputSchema(
  graph: JsonObject,
  step: string,
  port: string,
): JsonObject {
  const binding = ((graph['bindings'] ?? []) as JsonObject[]).find(
    (row) => row['step'] === step && row['target_port'] === port,
  );
  if (binding?.['target_projection']) {
    return binding['target_schema'] as JsonObject;
  }
  if (binding?.['source_kind'] === 'CONSTANT') {
    return constantSchema(binding['constant_value']);
  }
  const root = (binding?.['source_schema'] ?? {}) as JsonObject;
  return typeof binding?.['source_path'] === 'string'
    ? (schemaAt(root, binding['source_path']) ?? {})
    : root;
}

function constantSchema(value: JsonValue, depth = 0): JsonObject {
  if (depth > 12) {
    return {};
  }
  if (value === null) {
    return { type: 'null' };
  }
  if (Array.isArray(value)) {
    return { type: 'array' };
  }
  if (typeof value === 'object') {
    return {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          constantSchema(item, depth + 1),
        ]),
      ),
    };
  }
  return {
    type:
      typeof value === 'number' && Number.isInteger(value)
        ? 'integer'
        : typeof value,
  };
}
