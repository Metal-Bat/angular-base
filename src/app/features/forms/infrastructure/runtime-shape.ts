import { JsonObject, JsonValue } from '../domain/runtime-document';
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('shape');
  }
  return value as Record<string, unknown>;
}
export function text(value: unknown, max = 4096): string {
  if (typeof value !== 'string' || !value || value.length > max) {
    throw new Error('shape');
  }
  return value;
}
export function list(value: unknown, max: number): readonly unknown[] {
  if (!Array.isArray(value) || value.length > max) {
    throw new Error('shape');
  }
  return value;
}
export function strings(value: unknown, max = 256): readonly string[] {
  const result = list(value, max).map((item) => text(item));
  if (new Set(result).size !== result.length) {
    throw new Error('shape');
  }
  return Object.freeze(result);
}
export function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new Error('shape');
  }
  return value;
}
export function json(
  value: unknown,
  depth = 0,
  budget = { nodes: 0 },
): JsonValue {
  if (depth > 48 || ++budget.nodes > 20000) {
    throw new Error('shape');
  }
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    if (typeof value === 'string' && value.length > 100000) {
      throw new Error('shape');
    }
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => json(item, depth + 1, budget)));
  }
  const record = object(value);
  if (
    Object.getPrototypeOf(record) !== Object.prototype &&
    Object.getPrototypeOf(record) !== null
  ) {
    throw new Error('shape');
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(record).map(([key, item]) => {
        if (key === '__proto__') {
          throw new Error('shape');
        }
        return [key, json(item, depth + 1, budget)];
      }),
    ),
  );
}
export function jsonObject(value: unknown): JsonObject {
  object(value);
  return json(value) as JsonObject;
}
export function scope(value: unknown): string {
  const result = text(value);
  if (!result.startsWith('/properties/') || /~(?![01])/.test(result)) {
    throw new Error('policy');
  }
  return result;
}
export function scopes(value: unknown): readonly string[] {
  return strings(value).map(scope);
}
