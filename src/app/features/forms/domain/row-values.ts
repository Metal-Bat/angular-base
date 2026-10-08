import { JsonObject, JsonValue, RuntimeDocument } from './runtime-document';
import { MISSING } from './canonical-values';
export function rowPath(
  scope: string,
  indices: readonly number[] = [],
): readonly string[] {
  const parts = scope.split('/').slice(1);
  const result: string[] = [];
  let row = 0;
  for (let index = 0; index < parts.length;) {
    if (parts[index] === 'items') {
      const position = indices[row++];
      if (!Number.isSafeInteger(position) || position < 0 || position > 255) {
        throw Error('Invalid row binding');
      }
      result.push(String(position));
      index++;
    } else {
      if (
        parts[index] !== 'properties' ||
        !parts[index + 1] ||
        /~(?![01])/.test(parts[index + 1])
      ) {
        throw Error('Invalid scope');
      }
      const key = parts[index + 1].replace(/~1/g, '/').replace(/~0/g, '~');
      if (['__proto__', 'constructor', 'prototype'].includes(key)) {
        throw Error('Unsafe property');
      }
      result.push(key);
      index += 2;
    }
  }
  if (!result.length) {
    throw Error('Invalid scope');
  }
  return result;
}
export function rowPointer(
  scope: string,
  indices: readonly number[] = [],
): string {
  return (
    '/' +
    rowPath(scope, indices)
      .map((part) => part.replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('/')
  );
}
export function rowValue(
  data: JsonObject,
  scope: string,
  indices: readonly number[] = [],
): JsonValue | typeof MISSING {
  let node: JsonValue = data;
  for (const part of rowPath(scope, indices)) {
    if (
      node === null ||
      typeof node !== 'object' ||
      !Object.hasOwn(node, part)
    ) {
      return MISSING;
    }
    node = (node as JsonObject)[part];
  }
  return node;
}
export function replaceRow(
  data: JsonObject,
  scope: string,
  indices: readonly number[],
  value: JsonValue | typeof MISSING,
): JsonObject {
  const path = rowPath(scope, indices);
  const copy = structuredClone(data);
  let node: JsonValue = copy;
  for (const key of path.slice(0, -1)) {
    if (node === null || typeof node !== 'object') {
      throw Error('Invalid canonical parent');
    }
    const child = (node as JsonObject)[key];
    if (child === undefined && !Array.isArray(node)) {
      (node as Record<string, JsonValue>)[key] = {};
    }
    node = (node as JsonObject)[key];
  }
  if (node === null || typeof node !== 'object') {
    throw Error('Use collection commands for structure');
  }
  const key = path[path.length - 1];
  if (Array.isArray(node)) {
    const index = Number(key);
    if (
      !Number.isSafeInteger(index) ||
      index < 0 ||
      index >= node.length ||
      value === MISSING
    ) {
      throw Error('Use collection commands for structure');
    }
    (node as JsonValue[])[index] = value;
    return copy;
  }
  if (value === MISSING) {
    delete (node as Record<string, JsonValue>)[key];
  } else {
    (node as Record<string, JsonValue>)[key] = value;
  }
  return copy;
}
export function fieldSchema(
  document: RuntimeDocument,
  scope: string,
): JsonObject {
  const field = document.fields
    .filter(
      (item) => scope === item.scope || scope.startsWith(item.scope + '/'),
    )
    .sort((a, b) => b.scope.length - a.scope.length)[0];
  if (!field) {
    return {};
  }
  let schema = field.schema;
  const parts = scope.slice(field.scope.length).split('/').filter(Boolean);
  for (let index = 0; index < parts.length;) {
    if (parts[index] === 'items') {
      schema = (schema['items'] ?? {}) as JsonObject;
      index++;
    } else {
      schema = ((schema['properties'] as JsonObject | undefined)?.[
        parts[index + 1].replace(/~1/g, '/').replace(/~0/g, '~')
      ] ?? {}) as JsonObject;
      index += 2;
    }
  }
  return schema;
}
export function writableScope(
  document: RuntimeDocument,
  scope: string,
): boolean {
  return (
    document.policy.writable.some(
      (parent) => scope === parent || scope.startsWith(parent + '/'),
    ) && fieldSchema(document, scope)['readOnly'] !== true
  );
}
export function keysAt(
  document: RuntimeDocument,
  scope: string,
  indices: readonly number[],
): readonly string[] {
  const pieces = scope.split('/').slice(1);
  const keys: string[] = [];
  let path = '';
  let row = 0;
  for (let position = 0; position < pieces.length;) {
    if (pieces[position] === 'items') {
      const index = indices[row++];
      const key = document.rowIdentity[path]?.[index];
      if (!key) {
        throw Error('Missing stable row identity');
      }
      keys.push(key);
      path += '/' + index;
      position++;
    } else {
      path += '/' + pieces[position + 1];
      position += 2;
    }
  }
  return keys;
}
export function indicesFor(
  document: RuntimeDocument,
  scope: string,
  keys: readonly string[],
): readonly number[] | null {
  const pieces = scope.split('/').slice(1);
  const indices: number[] = [];
  let path = '';
  let row = 0;
  for (let position = 0; position < pieces.length;) {
    if (pieces[position] === 'items') {
      const index = document.rowIdentity[path]?.indexOf(keys[row++]) ?? -1;
      if (index < 0) {
        return null;
      }
      indices.push(index);
      path += '/' + index;
      position++;
    } else {
      path += '/' + pieces[position + 1];
      position += 2;
    }
  }
  return indices;
}

export function indicesFromPath(
  scope: string,
  pointer: string,
): readonly number[] {
  const tokens = scope.split('/').slice(1);
  const path = pointer.split('/').slice(1);
  const result: number[] = [];
  let cursor = 0;
  for (let index = 0; index < tokens.length;) {
    if (tokens[index] === 'items') {
      const token = path[cursor++];
      if (!/^(0|[1-9][0-9]*)$/.test(token ?? '')) {
        throw Error('Invalid row path');
      }
      const position = Number(token);
      if (!Number.isSafeInteger(position) || position < 0 || position > 255) {
        throw Error('Invalid row path');
      }
      result.push(position);
      index++;
    } else {
      if (
        tokens[index] !== 'properties' ||
        tokens[index + 1] !== path[cursor++]
      ) {
        throw Error('Invalid row path');
      }
      index += 2;
    }
  }
  if (cursor !== path.length) {
    throw Error('Invalid row path');
  }
  return result;
}
