export { json, jsonObject } from '../../../shared/domain/json-value';
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
