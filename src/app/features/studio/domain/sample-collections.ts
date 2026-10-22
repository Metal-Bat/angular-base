import { MISSING } from '../../forms/domain/canonical-values';
import {
  fieldSchema,
  indicesFromPath,
  replaceRow,
  rowValue,
  writableScope,
} from '../../forms/domain/row-values';
import {
  JsonObject,
  JsonValue,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
type Operation = 'add' | 'remove' | 'reorder' | 'duplicate';
type Identity = Record<string, readonly string[]>;

/** Synthetic UUIDv7 keys satisfy the preview context contract; never mutation refs. */
function sampleKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let timestamp = Date.now();
  for (let index = 5; index >= 0; index--) {
    bytes[index] = timestamp % 256;
    timestamp = Math.floor(timestamp / 256);
  }
  bytes[6] = (bytes[6] % 16) + 112;
  bytes[8] = (bytes[8] % 64) + 128;
  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
function checkedCollection(
  document: RuntimeDocument,
  data: JsonObject,
  scope: string,
  path: string,
): {
  rows: JsonValue[];
  keys: string[];
  definition: JsonObject;
  indices: readonly number[];
} {
  if (
    !['edit', 'correction'].includes(document.purpose) ||
    !writableScope(document, scope)
  ) {
    throw Error('Sample collection is read-only');
  }
  const indices = indicesFromPath(scope, path);
  const raw = rowValue(data, scope, indices);
  if (raw !== MISSING && !Array.isArray(raw)) {
    throw Error('Invalid sample collection');
  }
  const rows = raw === MISSING ? [] : [...(raw as readonly JsonValue[])];
  const keys = [...(document.rowIdentity[path] ?? [])];
  if (keys.length !== rows.length || new Set(keys).size !== keys.length) {
    throw Error('Invalid sample row identities');
  }
  const definition = fieldSchema(document, scope);
  if ((definition['items'] as JsonObject | undefined)?.['type'] !== 'object') {
    throw Error('Unsupported sample collection');
  }
  return { rows, keys, definition, indices };
}
function mutateRows(
  rows: JsonValue[],
  keys: string[],
  definition: JsonObject,
  operation: Operation,
  key?: string,
  target?: number,
): void {
  const minimum =
    typeof definition['minItems'] === 'number' ? definition['minItems'] : 0;
  const maximum =
    typeof definition['maxItems'] === 'number'
      ? Math.min(256, definition['maxItems'])
      : 256;
  if (
    (operation === 'remove' && rows.length <= minimum) ||
    (['add', 'duplicate'].includes(operation) && rows.length >= maximum)
  ) {
    throw Error('Sample row limit reached');
  }
  const index = operation === 'add' ? rows.length : keys.indexOf(key ?? '');
  if (index < 0) {
    throw Error('Sample row no longer exists');
  }
  switch (operation) {
    case 'add':
      rows.push(
        structuredClone((definition['items'] as JsonObject)['default'] ?? {}),
      );
      keys.push(sampleKey());
      break;
    case 'remove':
      rows.splice(index, 1);
      keys.splice(index, 1);
      break;
    case 'duplicate':
      rows.splice(index + 1, 0, structuredClone(rows[index]));
      keys.splice(index + 1, 0, sampleKey());
      break;
    case 'reorder':
      if (!Number.isInteger(target) || target! < 0 || target! >= rows.length) {
        throw Error('Invalid sample row position');
      }
      rows.splice(target!, 0, rows.splice(index, 1)[0]);
      keys.splice(target!, 0, keys.splice(index, 1)[0]);
      break;
    default:
      throw Error('Unsupported sample collection operation');
  }
}
function remapIdentity(
  source: RuntimeDocument['rowIdentity'],
  path: string,
  keys: readonly string[],
): Identity {
  const result: Identity = { [path]: keys };
  const old = source[path] ?? [];
  for (const [pointer, values] of Object.entries(source)) {
    if (pointer === path) {
      continue;
    }
    if (!pointer.startsWith(path + '/')) {
      result[pointer] = values;
      continue;
    }
    const suffix = pointer.slice(path.length + 1).split('/');
    const position = keys.indexOf(old[Number(suffix[0])]);
    if (position >= 0) {
      result[path + '/' + position + '/' + suffix.slice(1).join('/')] = values;
    }
  }
  return result;
}
function fillIdentity(
  value: JsonValue,
  shape: JsonObject,
  pointer: string,
  identity: Identity,
): void {
  if (Array.isArray(value)) {
    const item = shape['items'] as JsonObject | undefined;
    if (item?.['type'] !== 'object') {
      return;
    }
    identity[pointer] ??= value.map(() => sampleKey());
    if (identity[pointer].length !== value.length || value.length > 256) {
      throw Error('Invalid sample row identities');
    }
    value.forEach((child, position) =>
      fillIdentity(child, item, pointer + '/' + position, identity),
    );
  } else if (value && typeof value === 'object') {
    const properties = (shape['properties'] ?? {}) as JsonObject;
    for (const [name, child] of Object.entries(value)) {
      fillIdentity(
        child,
        (properties[name] ?? {}) as JsonObject,
        pointer + '/' + name.replaceAll('~', '~0').replaceAll('/', '~1'),
        identity,
      );
    }
  }
}
export function editSampleCollection(
  document: RuntimeDocument,
  data: JsonObject,
  schema: JsonObject,
  scope: string,
  path: string,
  operation: Operation,
  key?: string,
  target?: number,
): { data: JsonObject; identity: Identity } {
  const current = checkedCollection(document, data, scope, path);
  mutateRows(
    current.rows,
    current.keys,
    current.definition,
    operation,
    key,
    target,
  );
  const next = replaceRow(data, scope, current.indices, current.rows);
  const identity = remapIdentity(document.rowIdentity, path, current.keys);
  fillIdentity(next, schema, '', identity);
  const keys = Object.values(identity).flat();
  if (
    new Set(keys).size !== keys.length ||
    keys.some(
      (value) =>
        !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          value,
        ),
    )
  ) {
    throw Error('Invalid synthetic UUIDv7 identities');
  }
  if (
    Object.keys(identity).length > 256 ||
    new TextEncoder().encode(JSON.stringify(next)).length > 262144
  ) {
    throw Error('Sample collection exceeds preview bounds');
  }
  return { data: next, identity };
}
