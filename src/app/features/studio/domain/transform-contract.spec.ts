import { transformErrors, transformSchemas } from './transform-contract';
import { mappingCompatible } from './mapping-schema';
import { boundInputSchema, mappingFields } from './mapping-fields';
it('uses the producer transform contracts for explicit conversions and null preservation', () => {
  expect(transformSchemas({ conversion_key: 'integer' })).toEqual([
    { type: ['string', 'integer'] },
    { type: 'integer' },
  ]);
  const object = transformSchemas({
    conversion_key: 'object',
    projection: { name: '/profile/name' },
    null_behavior: 'preserve',
  });
  expect(object?.[1]).toEqual({
    type: ['object', 'null'],
    properties: { name: {} },
    additionalProperties: false,
  });
  expect(
    mappingCompatible(
      { type: 'string' },
      transformSchemas({ conversion_key: 'integer' })![0],
    ),
  ).toBe(true);
  expect(
    mappingCompatible(
      { type: 'boolean' },
      transformSchemas({ conversion_key: 'integer' })![0],
    ),
  ).toBe(false);
  expect(mappingCompatible({ type: 'integer' }, { type: 'number' })).toBe(
    false,
  );
});
it('rejects invalid conditional transform options before applying configuration', () => {
  expect(transformErrors({ conversion_key: 'object' })).toHaveProperty(
    'projection',
  );
  expect(
    transformErrors({
      conversion_key: 'integer',
      projection: { name: '/name' },
      format: '{}',
    }),
  ).toHaveProperty('format');
  expect(
    transformErrors({
      conversion_key: 'boolean',
      null_behavior: 'default',
      default: false,
    }),
  ).toEqual({});
  expect(
    transformErrors({
      conversion_key: 'string',
      null_behavior: 'default',
      default: null,
    }),
  ).toHaveProperty('default');
});
it('offers nested projection fields from the mapped input without requiring pointer entry', () => {
  const input = {
    type: 'object',
    properties: {
      profile: {
        type: 'object',
        properties: { 'a/b': { type: 'string', title: 'Display name' } },
      },
    },
  };
  const schema = boundInputSchema(
    {
      bindings: [
        {
          step: 'convert',
          target_port: 'value',
          source_path: '/customer',
          source_schema: { type: 'object', properties: { customer: input } },
        },
      ],
    },
    'convert',
    'value',
  );
  expect(schema).toEqual(input);
  expect(mappingFields(schema)).toMatchObject([
    { path: '/profile', label: 'profile' },
    { path: '/profile/a~1b', label: 'profile › Display name' },
  ]);
});
