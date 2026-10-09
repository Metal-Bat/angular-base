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
export const ruleValueSchema: JsonObject = {
  anyOf: [
    { type: 'string' },
    { type: 'boolean' },
    { type: 'number' },
    { type: 'null' },
  ],
};
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
