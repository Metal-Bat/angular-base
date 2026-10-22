import {
  addInterfaceProperty,
  newInterfaceSchema,
  removeInterfaceProperty,
  requireInterfaceProperty,
} from './interface-shape';
it('authors nested object/collection schemas while preserving unrelated constraints and descriptive metadata', () => {
  const original = {
    type: 'object',
    title: 'Retained title',
    additionalProperties: false,
    minProperties: 1,
  };
  let schema = addInterfaceProperty(original, 'lines', 'array');
  schema = {
    ...schema,
    properties: {
      lines: {
        ...newInterfaceSchema('array'),
        items: requireInterfaceProperty(
          addInterfaceProperty(newInterfaceSchema('object'), 'note', 'string'),
          'note',
          true,
        ),
      },
    },
  };
  expect(schema).toMatchObject({
    title: 'Retained title',
    additionalProperties: false,
    minProperties: 1,
    properties: {
      lines: {
        type: 'array',
        items: {
          type: 'object',
          properties: { note: { type: 'string' } },
          required: ['note'],
        },
      },
    },
  });
  expect(original).not.toHaveProperty('properties');
  expect(
    removeInterfaceProperty(
      requireInterfaceProperty(schema, 'lines', true),
      'lines',
    ),
  ).toMatchObject({
    properties: {},
    required: [],
    title: 'Retained title',
    minProperties: 1,
  });
});
it('rejects duplicate and unsafe names without changing the original schema or advanced constraints', () => {
  const schema = addInterfaceProperty({ type: 'object' }, 'نام/حقل', 'boolean');
  expect(() => addInterfaceProperty(schema, 'نام/حقل', 'string')).toThrow();
  expect(() => addInterfaceProperty(schema, '__proto__', 'string')).toThrow();
  expect(() => addInterfaceProperty(schema, '  ', 'string')).toThrow();
  expect(() =>
    addInterfaceProperty({ type: 'object', allOf: [] }, 'new', 'string'),
  ).toThrow();
  expect(() =>
    addInterfaceProperty(
      { type: 'object', properties: 'invalid' },
      'new',
      'string',
    ),
  ).toThrow();
  expect(
    addInterfaceProperty({ type: 'object' }, 'constructor', 'string'),
  ).toEqual({
    type: 'object',
    properties: { constructor: { type: 'string' } },
  });
  expect(() => newInterfaceSchema('invented')).toThrow();
  expect(schema).toEqual({
    type: 'object',
    properties: { 'نام/حقل': { type: 'boolean' } },
  });
});
