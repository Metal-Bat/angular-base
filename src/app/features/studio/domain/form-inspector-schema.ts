import { JsonObject } from '../../forms/domain/runtime-document';
import options from './form-options.json';
export const formOptions = options as unknown as Readonly<
  Record<string, JsonObject>
>;
export const constraintSchema: JsonObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    minLength: { type: 'integer', minimum: 0 },
    maxLength: { type: 'integer', minimum: 0 },
    pattern: { type: 'string', maxLength: 1024 },
    minimum: { type: 'number' },
    maximum: { type: 'number' },
    minItems: { type: 'integer', minimum: 0, maximum: 256 },
    maxItems: { type: 'integer', minimum: 0, maximum: 256 },
  },
};
/** Only show constraints applicable to this canonical type; preserve other keys. */
export function constraintSchemaFor(field: JsonObject): JsonObject {
  const types = Array.isArray(field['type']) ? field['type'] : [field['type']];
  const keys = types.includes('string')
    ? ['minLength', 'maxLength', 'pattern']
    : types.some((type) => type === 'integer' || type === 'number')
      ? ['minimum', 'maximum']
      : types.includes('array')
        ? ['minItems', 'maxItems']
        : [];
  const properties = constraintSchema['properties'] as JsonObject;
  return {
    ...constraintSchema,
    properties: Object.fromEntries(keys.map((key) => [key, properties[key]])),
  };
}
export const choicesSchema: JsonObject = {
  type: 'array',
  minItems: 1,
  maxItems: 256,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['key', 'value'],
    properties: {
      key: {
        anyOf: [{ type: 'string' }, { type: 'boolean' }, { type: 'number' }],
      },
      value: { type: 'string', minLength: 1, maxLength: 255 },
    },
  },
};
