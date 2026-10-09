import contracts from './node-inspectors.json';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import {
  schemaErrors,
  schemaLabel,
} from '../../administration/domain/schema-form';
export type Inspector = {
  handler_key: string;
  handler_version: string;
  config_schema: JsonObject;
  outcomes: readonly string[];
  bindings: readonly {
    pointer: string;
    selector_kind: string;
    pinned: boolean;
  }[];
  ports: readonly JsonObject[];
  execution_mode: string;
  required_capabilities: readonly string[];
  help_text: string | null;
  help_key: string | null;
};
export const taskSchema = contracts.task as JsonObject;
export const flowSchema = contracts.flow as JsonObject;
export const handlers = contracts.handlers as unknown as readonly Inspector[];
export function inspectorFor(
  step: JsonObject,
  catalog: readonly JsonObject[],
): Inspector | null {
  const config = step['config'];
  if (
    config !== undefined &&
    (!config || typeof config !== 'object' || Array.isArray(config))
  ) {
    return null;
  }
  const entry = catalog.find(
    (row) =>
      (row['metadata'] as JsonObject | undefined)?.['ref_id'] ===
      step['type_version_ref'],
  );
  const metadata = entry?.['metadata'] as JsonObject | undefined;
  const handler = handlers.find(
    (item) =>
      item.handler_key === metadata?.['handler_key'] &&
      item.handler_version === metadata?.['handler_version'],
  );
  if (!handler || metadata?.['code'] !== step['type_code']) {
    return null;
  }
  try {
    if (
      !entry?.['type_schema'] ||
      canonical(resolveSchema(entry['type_schema'] as JsonObject)) !==
        canonical(handler.config_schema)
    ) {
      return null;
    }
  } catch {
    return null;
  }
  // The catalog remains authoritative for availability and the exact version pin.
  if (metadata['runtime_available'] === false) {
    return null;
  }
  return {
    ...handler,
    ports: Array.isArray(metadata['ports'])
      ? (metadata['ports'] as JsonObject[])
      : handler.ports,
  };
}
export function editableFields(inspector: Inspector): readonly {
  key: string;
  label: string;
  schema: JsonObject;
  required: boolean;
  selector: string;
}[] {
  return Object.entries(
    inspector.config_schema['properties'] as JsonObject,
  ).map(([key, schema]) => ({
    key,
    label: schemaLabel(key, schema as JsonObject),
    schema: schema as JsonObject,
    required:
      (inspector.config_schema['required'] as string[] | undefined)?.includes(
        key,
      ) ?? false,
    selector:
      inspector.bindings.find((binding) => binding.pointer === '/' + key)
        ?.selector_kind ?? '',
  }));
}
export function applyConfiguration(
  step: JsonObject,
  inspector: Inspector,
  edits: JsonObject,
): JsonObject {
  const original = (step['config'] ?? {}) as JsonObject;
  const owned = Object.fromEntries(
    editableFields(inspector).map((field) => [field.key, edits[field.key]]),
  ) as JsonObject;
  const errors = schemaErrors(inspector.config_schema, owned);
  if (Object.keys(errors).length) {
    throw Error('Complete the required fields.');
  }
  let config = { ...original };
  for (const field of editableFields(inspector)) {
    config = patchOwned(config, field.key, edits[field.key]);
  }
  return { ...step, config };
}
export function scalarSchema(schema: JsonObject): boolean {
  const alternatives = (schema['anyOf'] ?? [schema]) as JsonObject[];
  return alternatives.every((item) =>
    ['string', 'number', 'integer', 'boolean', 'null'].includes(
      String(item['type']),
    ),
  );
}
export function patchOwned(
  original: JsonObject,
  key: string,
  value: JsonValue | undefined,
): JsonObject {
  const next = { ...original };
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}

function canonical(value: JsonValue): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonical).join(',') + ']';
  }
  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map(
          (key) =>
            JSON.stringify(key) + ':' + canonical((value as JsonObject)[key]),
        )
        .join(',') +
      '}'
    );
  }
  return JSON.stringify(value);
}
function resolveSchema(
  schema: JsonObject,
  root: JsonObject = schema,
): JsonObject {
  if (schema['$ref']) {
    const reference = String(schema['$ref']);
    if (!reference.startsWith('#/$defs/')) {
      return { type: 'unsupported' };
    }
    return resolveSchema(
      (root['$defs'] as JsonObject)?.[reference.slice(8)] as JsonObject,
      root,
    );
  }
  const result = Object.fromEntries(
    Object.entries(schema)
      .filter(([key]) => key !== '$defs')
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((item) =>
              item && typeof item === 'object' && !Array.isArray(item)
                ? resolveSchema(item as JsonObject, root)
                : item,
            )
          : value && typeof value === 'object'
            ? resolveSchema(value as JsonObject, root)
            : value,
      ]),
  ) as JsonObject;
  if (result['const'] !== undefined) {
    return { ...result, enum: [result['const']] };
  }
  return result;
}
