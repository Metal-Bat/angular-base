export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };
export type JsonObject = { readonly [key: string]: JsonValue };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw Error('shape');
  }
  return value as Record<string, unknown>;
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
