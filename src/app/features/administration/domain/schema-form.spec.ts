import { schemaBranch, schemaErrors, seedValue } from './schema-form';
import { JsonObject } from '../../forms/domain/runtime-document';
import {
  fieldErrors,
  formBody,
  formValues,
} from '../../records/domain/records';

describe('Structured contract forms', () => {
  const schema: JsonObject = {
    type: 'object',
    additionalProperties: false,
    required: ['models'],
    properties: {
      models: {
        type: 'array',
        minItems: 1,
        items: { type: 'string', minLength: 1 },
      },
      attempts: { type: 'integer', minimum: 1, maximum: 3, default: 1 },
      enabled: { type: 'boolean', default: false },
    },
  };
  it('preserves typed defaults and reports the exact nested field', () => {
    expect(seedValue(schema)).toEqual({
      models: [],
      attempts: 1,
      enabled: false,
    });
    expect(
      schemaErrors(schema, { models: [''], attempts: 4 }, 'configuration'),
    ).toEqual({
      'configuration.models.0': 'Complete the required fields.',
      'configuration.attempts': 'Invalid value',
    });
    expect(
      schemaErrors(schema, {
        models: ['model-a'],
        attempts: 1,
        enabled: false,
      }),
    ).toEqual({});
  });
  it('chooses a union using the actual configuration properties', () => {
    const union = {
      anyOf: [
        { type: 'object', properties: { endpoint_key: { type: 'string' } } },
        schema,
      ],
    };
    expect(schemaBranch(union, { models: ['model-a'] })).toEqual(schema);
  });
  it('rejects unexpected fields, forbidden keys, fractional integers and datetimes without timezone', () => {
    expect(schemaErrors(schema, { models: ['a'], other: 1 })).toHaveProperty(
      'other',
    );
    expect(
      schemaErrors({ type: 'object' }, JSON.parse('{"__proto__":{}}')),
    ).toHaveProperty('__proto__');
    expect(schemaErrors({ type: 'integer' }, 1.5, 'attempts')).toHaveProperty(
      'attempts',
    );
    expect(
      schemaErrors(
        { type: 'string', format: 'date-time' },
        '2026-10-06T10:00:00',
        'start_at',
      ),
    ).toHaveProperty('start_at');
    expect(
      schemaErrors(
        { type: 'string', format: 'date-time' },
        '2026-10-06T10:00:00Z',
      ),
    ).toEqual({});
  });
  it('serializes structured CRUD fields with nested validation', () => {
    const fields = [
      {
        key: 'configuration',
        label: 'Configuration',
        type: 'json' as const,
        required: true,
        nullable: false,
        schema,
      },
    ];
    const values = formValues(fields, null);
    expect(
      formBody(fields, {
        configuration: JSON.stringify({
          models: ['model-a'],
          attempts: 2,
          enabled: false,
        }),
      }),
    ).toEqual({
      configuration: { models: ['model-a'], attempts: 2, enabled: false },
    });
    expect(fieldErrors(fields, values)).toHaveProperty('configuration.models');
    expect(() => formBody(fields, values)).toThrow();
  });
});
