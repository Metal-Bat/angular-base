import { gregorianMillis } from './calendar-value';
import { fieldLabel } from './field-label';
import { JsonObject, JsonValue } from './json-value';

export function alternatives(schema: JsonObject): JsonObject[] {
  const branches = schema['anyOf'] ?? schema['oneOf'];
  return Array.isArray(branches)
    ? (branches as JsonObject[]).filter((branch) => branch['type'] !== 'null')
    : [schema];
}
export function schemaBranch(
  schema: JsonObject,
  value: JsonValue | undefined,
  choice = 0,
): JsonObject {
  const branches = alternatives(schema);
  if (
    branches.length > 1 &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const keys = Object.keys(value);
    const scores = branches.map(
      (branch) =>
        keys.filter((key) =>
          Object.hasOwn((branch['properties'] as JsonObject) ?? {}, key),
        ).length,
    );
    const best = Math.max(...scores);
    if (best > 0) {
      return branches[scores[choice] === best ? choice : scores.indexOf(best)];
    }
  }
  if (value !== undefined) {
    const selected = branches[choice];
    if (selected && matchesValue(selected, value)) {
      return selected;
    }
    const matching = branches.find((branch) => matchesValue(branch, value));
    if (matching) {
      return matching;
    }
  }
  return branches[choice] ?? schema;
}
function matchesValue(schema: JsonObject, value: JsonValue): boolean {
  const type = schema['type'];
  if (!type) {
    return (
      !schema['properties'] ||
      (!!value && typeof value === 'object' && !Array.isArray(value))
    );
  }
  if (Array.isArray(type)) {
    return type.some((kind) => matchesValue({ type: kind }, value));
  }
  if (type === 'integer') {
    return typeof value === 'number' && Number.isInteger(value);
  }
  if (type === 'array') {
    return Array.isArray(value);
  }
  if (type === 'object') {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }
  if (type === 'null') {
    return value === null;
  }
  return typeof value === type;
}

export function seedValue(schema: JsonObject): JsonValue | undefined {
  if (schema['default'] !== undefined) {
    return structuredClone(schema['default']);
  }
  const shape = alternatives(schema)[0];
  if (shape?.['type'] === 'object') {
    return Object.fromEntries(
      Object.entries((shape['properties'] as JsonObject) ?? {}).flatMap(
        ([key, child]) => {
          const value = seedValue(child as JsonObject);
          return value === undefined ? [] : [[key, value]];
        },
      ),
    ) as JsonObject;
  }
  if (shape?.['type'] === 'array') {
    return [];
  }
  return undefined;
}
export function schemaErrors(
  schema: JsonObject,
  value: JsonValue | undefined,
  path = '',
  required = false,
  literalValues = false,
): Record<string, string> {
  if (value === undefined || (value === '' && !literalValues)) {
    return required ? { [path]: 'Complete the required fields.' } : {};
  }
  if (value === null) {
    return acceptsNull(schema, literalValues)
      ? {}
      : { [path]: 'Invalid value' };
  }
  const shape = schemaBranch(schema, value);
  const error = (message = 'Invalid value'): Record<string, string> => ({
    [path]: message,
  });
  if (Array.isArray(shape['enum']) && !shape['enum'].includes(value)) {
    return error('Choose a value');
  }
  if (shape['type'] === 'array') {
    return arrayErrors(shape, value, path, literalValues);
  }
  if (shape['type'] === 'object' || shape['properties']) {
    return objectErrors(shape, value, path, literalValues);
  }
  return primitiveErrors(shape, value, path);
}
function temporalErrors(format: string, value: string): string | null {
  if (['date', 'date-time'].includes(format)) {
    try {
      gregorianMillis(value.slice(0, 10));
    } catch {
      return 'Enter a valid date.';
    }
    if (format === 'date' && value.length !== 10) {
      return 'Enter a valid date.';
    }
  }
  if (
    format === 'time' &&
    !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/.test(value)
  ) {
    return 'Enter a valid time.';
  }
  return null;
}
function primitiveErrors(
  shape: JsonObject,
  value: JsonValue,
  path: string,
): Record<string, string> {
  const type = shape['type'];
  const error = (message = 'Invalid value'): Record<string, string> => ({
    [path]: message,
  });
  if (type === 'string') {
    if (typeof value !== 'string') {
      return error();
    }
    if (
      (shape['minLength'] !== undefined &&
        value.length < Number(shape['minLength'])) ||
      (shape['maxLength'] !== undefined &&
        value.length > Number(shape['maxLength']))
    ) {
      return error('Check the field length.');
    }
    if (shape['pattern'] && !new RegExp(String(shape['pattern'])).test(value)) {
      return error();
    }
    if (
      shape['format'] === 'email' &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      return error('Enter a valid email address.');
    }
    const temporalError = temporalErrors(String(shape['format']), value);
    if (temporalError) {
      return error(temporalError);
    }
    if (
      shape['format'] === 'date-time' &&
      (!/(Z|[+-]\d{2}:\d{2})$/.test(value) ||
        !Number.isFinite(Date.parse(value)))
    ) {
      return error('Use a datetime with a timezone.');
    }
  }
  if (type === 'number' || type === 'integer') {
    return numberErrors(shape, value, path);
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    return error();
  }
  return {};
}
function arrayErrors(
  shape: JsonObject,
  value: JsonValue,
  path: string,
  literalValues: boolean,
): Record<string, string> {
  const error = (message = 'Invalid value'): Record<string, string> => ({
    [path]: message,
  });

  if (!Array.isArray(value)) {
    return error();
  }
  if (
    (shape['minItems'] !== undefined &&
      value.length < Number(shape['minItems'])) ||
    (shape['maxItems'] !== undefined &&
      value.length > Number(shape['maxItems']))
  ) {
    return error('Check the number of values.');
  }
  if (
    shape['uniqueItems'] &&
    new Set(value.map((item) => JSON.stringify(item))).size !== value.length
  ) {
    return error('Use unique values.');
  }
  return Object.assign(
    {},
    ...value.map((item, index) =>
      schemaErrors(
        (shape['items'] as JsonObject) ?? {},
        item,
        path + '.' + index,
        true,
        literalValues,
      ),
    ),
  );
}
function objectErrors(
  shape: JsonObject,
  value: JsonValue,
  path: string,
  literalValues: boolean,
): Record<string, string> {
  const error = (message = 'Invalid value'): Record<string, string> => ({
    [path]: message,
  });

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return error();
  }
  const count = Object.keys(value).length;
  if (
    shape['minProperties'] !== undefined &&
    count < Number(shape['minProperties'])
  ) {
    return error('Add a field.');
  }
  if (
    shape['maxProperties'] !== undefined &&
    count > Number(shape['maxProperties'])
  ) {
    return error('Check the number of fields.');
  }
  const properties = (shape['properties'] as JsonObject) ?? {};
  const requiredKeys = (shape['required'] as string[]) ?? [];
  const errors = Object.assign(
    {},
    ...Object.entries(properties).map(([key, child]) =>
      schemaErrors(
        child as JsonObject,
        (value as JsonObject)[key],
        path ? path + '.' + key : key,
        requiredKeys.includes(key),
        literalValues,
      ),
    ),
  );
  for (const key of Object.keys(value)) {
    if (shape['propertyNames']) {
      Object.assign(
        errors,
        schemaErrors(
          shape['propertyNames'] as JsonObject,
          key,
          path + '.' + key,
          true,
          literalValues,
        ),
      );
    }
    if (
      ['__proto__', 'constructor', 'prototype'].includes(key) ||
      (!Object.hasOwn(properties, key) &&
        shape['additionalProperties'] === false)
    ) {
      Object.defineProperty(errors, path ? path + '.' + key : key, {
        value: 'Invalid value',
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    if (
      !Object.hasOwn(properties, key) &&
      typeof shape['additionalProperties'] === 'object'
    ) {
      Object.assign(
        errors,
        schemaErrors(
          shape['additionalProperties'] as JsonObject,
          (value as JsonObject)[key],
          path + '.' + key,
          false,
          literalValues,
        ),
      );
    }
  }
  return errors;
}

export function schemaLabel(key: string, schema: JsonObject): string {
  return fieldLabel(key, String(schema['title'] ?? ''));
}

function numberErrors(
  shape: JsonObject,
  value: JsonValue,
  path: string,
): Record<string, string> {
  const type = shape['type'];
  const error = (message = 'Invalid value'): Record<string, string> => ({
    [path]: message,
  });

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (type === 'integer' && !Number.isInteger(value))
  ) {
    return error('Enter a valid number.');
  }
  if (shape['minimum'] !== undefined && value < Number(shape['minimum'])) {
    return error();
  }
  if (
    shape['exclusiveMaximum'] !== undefined &&
    value >= Number(shape['exclusiveMaximum'])
  ) {
    return error();
  }
  if (shape['maximum'] !== undefined && value > Number(shape['maximum'])) {
    return error();
  }
  if (
    shape['exclusiveMinimum'] !== undefined &&
    value <= Number(shape['exclusiveMinimum'])
  ) {
    return error();
  }

  return {};
}

function acceptsNull(schema: JsonObject, literalValues: boolean): boolean {
  return (
    (literalValues && !Object.keys(schema).length) ||
    schema['type'] === 'null' ||
    ((schema['anyOf'] ?? []) as JsonObject[]).some(
      (branch) => branch['type'] === 'null',
    )
  );
}
