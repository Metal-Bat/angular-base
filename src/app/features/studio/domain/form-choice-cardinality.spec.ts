import { JsonObject } from '../../forms/domain/runtime-document';
import { applyChoiceCardinality } from './form-choice-cardinality';
import { schemaAt } from './form-editing';
const document: JsonObject = {
  data_schema: {
    type: 'object',
    properties: {
      answer: {
        type: ['integer', 'boolean', 'null'],
        enum: [0, false],
        default: false,
        title: 'Decision',
        retained: 'metadata',
      },
    },
  },
};
it('round-trips typed multiple choices without stringifying zero, false, null policy or metadata', () => {
  const before = structuredClone(document);
  const list = applyChoiceCardinality(document, '/properties/answer', {
    component: 'choice',
    options: { multiple: true },
  });
  expect(schemaAt(list, '/properties/answer')).toEqual({
    type: ['array', 'null'],
    items: { type: ['integer', 'boolean'], enum: [0, false] },
    default: [false],
    title: 'Decision',
    retained: 'metadata',
  });
  const single = applyChoiceCardinality(list, '/properties/answer', {
    component: 'choice',
    options: { multiple: false },
  });
  expect(single).toEqual(document);
  expect(document).toEqual(before);
});
it('preserves existing array schemas unless cardinality is explicitly changed and refuses lossy defaults', () => {
  const list: JsonObject = {
    data_schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'array',
          items: { type: 'string' },
          default: ['a', 'b'],
          minItems: 1,
        },
      },
    },
  };
  expect(
    applyChoiceCardinality(list, '/properties/answer', {
      component: 'choice',
      options: { read_only: true },
    }),
  ).toBe(list);
  expect(() =>
    applyChoiceCardinality(list, '/properties/answer', {
      component: 'choice',
      options: { multiple: false },
    }),
  ).toThrow();
  expect(schemaAt(list, '/properties/answer')['default']).toEqual(['a', 'b']);
});

it('aligns custom zero and false keys with a canonical list item schema instead of retaining text', () => {
  const before: JsonObject = {
    data_schema: {
      type: 'object',
      properties: { answer: { type: 'string', title: 'Answer' } },
    },
  };
  const next = applyChoiceCardinality(before, '/properties/answer', {
    component: 'choice',
    options: { multiple: true },
    source: {
      kind: 'custom',
      items: [
        { key: 0, value: 'Zero' },
        { key: false, value: 'No' },
      ],
    },
  });
  expect(schemaAt(next, '/properties/answer')).toEqual({
    type: 'array',
    items: { type: ['integer', 'boolean'] },
    title: 'Answer',
  });
});
it('keeps incompatible declared constraints intact and rejects the configuration locally', () => {
  const before: JsonObject = {
    data_schema: {
      type: 'object',
      properties: { answer: { type: 'string', enum: ['kept'] } },
    },
  };
  expect(() =>
    applyChoiceCardinality(before, '/properties/answer', {
      component: 'choice',
      source: { kind: 'custom', items: [{ key: 0, value: 'Zero' }] },
    }),
  ).toThrow();
  expect(schemaAt(before, '/properties/answer')['enum']).toEqual(['kept']);
});
