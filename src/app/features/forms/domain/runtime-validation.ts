import { JsonObject, JsonValue, RuntimeDocument } from './runtime-document';
import { fieldValue, instancePointer, MISSING } from './canonical-values';
export type FieldIssue = {
  readonly pointer: string;
  readonly message: string;
  readonly code: string;
};
function valueType(value: JsonValue, type: string): boolean {
  if (type === 'null') {
    return value === null;
  }
  if (type === 'array') {
    return Array.isArray(value);
  }
  if (type === 'object') {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  if (type === 'integer') {
    return typeof value === 'number' && Number.isSafeInteger(value);
  }
  return typeof value === type;
}
function stringIssue(value: string, schema: JsonObject): string | null {
  if (
    typeof schema['minLength'] === 'number' &&
    [...value].length < schema['minLength']
  ) {
    return 'Too short';
  }
  if (
    typeof schema['maxLength'] === 'number' &&
    [...value].length > schema['maxLength']
  ) {
    return 'Too long';
  }
  const format = schema['format'];
  if (format === 'date') {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value
    ) {
      return 'Use a Gregorian date (YYYY-MM-DD)';
    }
  }
  if (
    format === 'date-time' &&
    (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) ||
      Number.isNaN(Date.parse(value)))
  ) {
    return 'Use a date and time with an explicit offset';
  }
  // Complex authored patterns remain server validation; no authored expression runs here.
  const pattern = schema['pattern'];
  if (
    typeof pattern === 'string' &&
    pattern.length <= 128 &&
    value.length <= 256 &&
    !/[()\\]/.test(pattern)
  ) {
    try {
      if (!new RegExp(pattern, 'u').test(value)) {
        return 'Invalid format';
      }
    } catch {
      /* Server validates unsupported patterns. */
    }
  }
  return null;
}
function numericIssue(value: number, schema: JsonObject): string | null {
  if (typeof schema['minimum'] === 'number' && value < schema['minimum']) {
    return 'Below minimum';
  }
  if (typeof schema['maximum'] === 'number' && value > schema['maximum']) {
    return 'Above maximum';
  }
  if (
    typeof schema['exclusiveMinimum'] === 'number' &&
    value <= schema['exclusiveMinimum']
  ) {
    return 'Below minimum';
  }
  if (
    typeof schema['exclusiveMaximum'] === 'number' &&
    value >= schema['exclusiveMaximum']
  ) {
    return 'Above maximum';
  }
  return null;
}
export function validateValue(
  value: JsonValue | typeof MISSING,
  schema: JsonObject,
  required: boolean,
): string | null {
  if (value === MISSING) {
    return required ? 'Required' : null;
  }
  const types = schema['type'];
  const allowed =
    typeof types === 'string' ? [types] : Array.isArray(types) ? types : [];
  if (
    allowed.length &&
    !allowed.some((type) => typeof type === 'string' && valueType(value, type))
  ) {
    return 'Invalid value type';
  }
  if (
    Array.isArray(schema['anyOf']) &&
    !schema['anyOf'].some(
      (part) =>
        part &&
        typeof part === 'object' &&
        !Array.isArray(part) &&
        !validateValue(value, part as JsonObject, false),
    )
  ) {
    return 'Invalid value type';
  }
  if (
    Array.isArray(schema['enum']) &&
    !schema['enum'].some(
      (item) => JSON.stringify(item) === JSON.stringify(value),
    )
  ) {
    return 'Choose an available value';
  }
  if (
    Object.hasOwn(schema, 'const') &&
    JSON.stringify(schema['const']) !== JSON.stringify(value)
  ) {
    return 'Invalid constant value';
  }
  if (typeof value === 'string') {
    return stringIssue(value, schema);
  }
  if (typeof value === 'number') {
    return numericIssue(value, schema);
  }
  return null;
}
function nestedIssues(
  value: JsonValue | typeof MISSING,
  schema: JsonObject,
  pointer: string,
  required: boolean,
  depth = 0,
): readonly FieldIssue[] {
  const message = validateValue(value, schema, required);
  if (message) {
    return [{ pointer, message, code: 'client.validation' }];
  }
  if (
    depth > 16 ||
    value === MISSING ||
    value === null ||
    typeof value !== 'object'
  ) {
    return [];
  }
  if (Array.isArray(value)) {
    const min = schema['minItems'];
    const max = schema['maxItems'];
    if (
      (typeof min === 'number' && value.length < min) ||
      (typeof max === 'number' && value.length > max)
    ) {
      return [
        {
          pointer,
          message: 'Review the number of rows',
          code: 'client.validation',
        },
      ];
    }
    const items = schema['items'];
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      return value
        .slice(0, 256)
        .flatMap((row, index) =>
          nestedIssues(
            row,
            items as JsonObject,
            pointer + '/' + index,
            false,
            depth + 1,
          ),
        );
    }
    return [];
  }
  const properties = schema['properties'];
  if (
    !properties ||
    typeof properties !== 'object' ||
    Array.isArray(properties)
  ) {
    return [];
  }
  const requiredKeys = Array.isArray(schema['required'])
    ? schema['required']
    : [];
  return Object.entries(properties).flatMap(([key, child]) => {
    if (!child || typeof child !== 'object' || Array.isArray(child)) {
      return [];
    }
    return nestedIssues(
      Object.hasOwn(value, key) ? (value as JsonObject)[key] : MISSING,
      child as JsonObject,
      pointer + '/' + key.replace(/~/g, '~0').replace(/\//g, '~1'),
      requiredKeys.includes(key),
      depth + 1,
    );
  });
}
export function validateRuntime(
  document: RuntimeDocument,
  data: JsonObject,
  requiredScopes = document.policy.required,
): readonly FieldIssue[] {
  return document.fields.flatMap((field) =>
    field.scope.includes('/items')
      ? []
      : nestedIssues(
          fieldValue(data, field.scope),
          field.schema,
          instancePointer(field.scope),
          requiredScopes.includes(field.scope),
        ),
  );
}
