import { JsonObject } from '../../forms/domain/runtime-document';
export const interfaceTypes = [
  'string',
  'integer',
  'number',
  'boolean',
  'object',
  'array',
] as const;
export function newInterfaceSchema(type: string): JsonObject {
  if (!interfaceTypes.some((item) => item === type)) {
    throw Error('Unsupported input type');
  }
  return type === 'array' ? { type, items: {} } : { type };
}
export function editableInterfaceShape(schema: JsonObject): boolean {
  if (schema['type'] === 'object') {
    const properties = schema['properties'];
    const required = schema['required'];
    if (
      properties !== undefined &&
      (!properties ||
        typeof properties !== 'object' ||
        Array.isArray(properties) ||
        Object.values(properties).some(
          (value) =>
            !value || typeof value !== 'object' || Array.isArray(value),
        ))
    ) {
      return false;
    }
    if (
      required !== undefined &&
      (!Array.isArray(required) ||
        required.some((value) => typeof value !== 'string'))
    ) {
      return false;
    }
  }
  if (
    schema['type'] === 'array' &&
    schema['items'] !== undefined &&
    (!schema['items'] ||
      typeof schema['items'] !== 'object' ||
      Array.isArray(schema['items']))
  ) {
    return false;
  }
  return ![
    '$ref',
    'anyOf',
    'oneOf',
    'allOf',
    'const',
    'enum',
    'prefixItems',
    'dependentSchemas',
  ].some((key) => schema[key] !== undefined);
}
export function addInterfaceProperty(
  schema: JsonObject,
  name: string,
  type: string,
): JsonObject {
  const properties = (schema['properties'] ?? {}) as JsonObject;
  if (
    schema['type'] !== 'object' ||
    !editableInterfaceShape(schema) ||
    !name.trim() ||
    name.length > 64 ||
    Object.hasOwn(properties, name) ||
    name === '__proto__' ||
    Object.keys(properties).length >= 64
  ) {
    throw Error('Use a new field name of up to 64 characters.');
  }
  return {
    ...schema,
    properties: { ...properties, [name]: newInterfaceSchema(type) },
  };
}
export function removeInterfaceProperty(
  schema: JsonObject,
  name: string,
): JsonObject {
  const properties = { ...(schema['properties'] as JsonObject) };
  delete properties[name];
  return {
    ...schema,
    properties,
    required: ((schema['required'] ?? []) as string[]).filter(
      (key) => key !== name,
    ),
  };
}
export function requireInterfaceProperty(
  schema: JsonObject,
  name: string,
  required: boolean,
): JsonObject {
  const keys = ((schema['required'] ?? []) as string[]).filter(
    (key) => key !== name,
  );
  return { ...schema, required: required ? [...keys, name] : keys };
}
