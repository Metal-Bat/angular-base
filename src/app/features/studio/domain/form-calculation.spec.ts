import { JsonObject } from '../../forms/domain/runtime-document';
import { applyCalculationType, calculationType } from './form-calculation';
import { schemaAt } from './form-editing';
const document: JsonObject = {
  data_schema: {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      quantity: { type: 'integer' },
      name: { type: 'string' },
      rows: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      result: { type: 'string', minLength: 1, title: 'Retained title' },
    },
  },
};
it('types sums and counts without changing the original document or unrelated metadata', () => {
  const original = structuredClone(document);
  const sum = applyCalculationType(document, '/properties/result', {
    function: 'sum',
    scopes: ['/properties/amount', '/properties/quantity'],
  });
  expect(schemaAt(sum, '/properties/result')).toEqual({
    type: 'number',
    title: 'Retained title',
  });
  expect(
    calculationType(document, '/properties/result', {
      function: 'sum',
      scopes: ['/properties/quantity'],
    }),
  ).toBe('integer');
  expect(
    calculationType(document, '/properties/result', {
      function: 'count',
      scopes: ['/properties/rows'],
    }),
  ).toBe('integer');
  expect(
    calculationType(document, '/properties/result', {
      function: 'concat',
      scopes: ['/properties/name'],
    }),
  ).toBe('string');
  expect(document).toEqual(original);
});
it('rejects incompatible types, self-dependency and ambiguous repeated sources before applying a calculation', () => {
  for (const calculation of [
    { function: 'sum', scopes: ['/properties/name'] },
    { function: 'count', scopes: ['/properties/quantity'] },
    { function: 'concat', scopes: ['/properties/result'] },
    { function: 'concat', scopes: ['/properties/rows/items/properties/name'] },
  ]) {
    expect(() =>
      calculationType(document, '/properties/result', calculation),
    ).toThrow();
  }
});

it('preserves nullable result policy and an already compatible numeric schema', () => {
  const nullable: JsonObject = {
    ...document,
    data_schema: {
      type: 'object',
      properties: {
        ...((document['data_schema'] as JsonObject)[
          'properties'
        ] as JsonObject),
        result: { type: ['string', 'null'], title: 'Result' },
      },
    },
  };
  const changed = applyCalculationType(nullable, '/properties/result', {
    function: 'sum',
    scopes: ['/properties/quantity'],
  });
  expect(schemaAt(changed, '/properties/result')['type']).toEqual([
    'integer',
    'null',
  ]);
  const numeric: JsonObject = {
    ...document,
    data_schema: {
      type: 'object',
      properties: {
        ...((document['data_schema'] as JsonObject)[
          'properties'
        ] as JsonObject),
        result: { type: ['number', 'null'], minimum: 0 },
      },
    },
  };
  expect(
    applyCalculationType(numeric, '/properties/result', {
      function: 'count',
      scopes: ['/properties/rows'],
    }),
  ).toEqual(numeric);
});
