import { JsonObject, JsonValue } from './runtime-document';
export const MISSING = Symbol('missing');
export function scopeTokens(scope: string): readonly string[] {
  const parts = scope.split('/').slice(1);
  const result: string[] = [];
  for (let index = 0; index < parts.length; index += 2) {
    if (
      parts[index] !== 'properties' ||
      !parts[index + 1] ||
      /~(?![01])/.test(parts[index + 1])
    ) {
      throw new Error('Unsupported field scope.');
    }
    const key = parts[index + 1].replace(/~1/g, '/').replace(/~0/g, '~');
    if (['__proto__', 'prototype', 'constructor'].includes(key)) {
      throw new Error('Invalid field scope.');
    }
    result.push(key);
  }
  if (!result.length) {
    throw new Error('Invalid field scope.');
  }
  return result;
}
export function instancePointer(scope: string): string {
  return (
    '/' +
    scopeTokens(scope)
      .map((key) => key.replace(/~/g, '~0').replace(/\//g, '~1'))
      .join('/')
  );
}
export function fieldValue(
  data: JsonObject,
  scope: string,
): JsonValue | typeof MISSING {
  let value: JsonValue = data;
  for (const key of scopeTokens(scope)) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !Object.hasOwn(value, key)
    ) {
      return MISSING;
    }
    value = (value as JsonObject)[key];
  }
  return value;
}
export function replaceField(
  data: JsonObject,
  scope: string,
  value: JsonValue | typeof MISSING,
): JsonObject {
  const keys = scopeTokens(scope);
  function replace(node: JsonObject, index: number): JsonObject {
    const result: Record<string, JsonValue> = { ...node };
    const key = keys[index];
    if (index === keys.length - 1) {
      if (value === MISSING) {
        delete result[key];
      } else {
        result[key] = value;
      }
    } else {
      const child = node[key];
      if (
        child !== undefined &&
        (child === null || typeof child !== 'object' || Array.isArray(child))
      ) {
        throw new Error('Cannot overwrite a canonical parent value.');
      }
      result[key] = replace((child ?? {}) as JsonObject, index + 1);
    }
    return Object.freeze(result);
  }
  return replace(data, 0);
}
export function encodeChoice(value: JsonValue): string {
  if (
    value === null ||
    !['string', 'number', 'boolean'].includes(typeof value)
  ) {
    throw new Error('Invalid choice key.');
  }
  return (
    'json:' +
    JSON.stringify(value).replace(
      /[\u007f-\uffff]/g,
      (character) =>
        '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'),
    )
  );
}
export function decodeChoice(key: string): string | number | boolean {
  if (!key.startsWith('json:') || key.length > 4096) {
    throw new Error('Invalid choice key.');
  }
  const value: unknown = JSON.parse(key.slice(5));
  if (
    typeof value !== 'string' &&
    typeof value !== 'boolean' &&
    !(typeof value === 'number' && Number.isFinite(value))
  ) {
    throw new Error('Invalid choice key.');
  }
  return value as string | number | boolean;
}
export function displayValue(value: JsonValue | typeof MISSING): string {
  return value === MISSING
    ? 'Not provided'
    : value === null
      ? 'Null'
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
}

export type FieldEdit = {
  readonly scope: string;
  readonly indices?: readonly number[];
  readonly rowKeys?: readonly string[];
  readonly value: JsonValue | typeof MISSING;
  readonly error?: string;
};
