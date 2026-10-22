import { JsonObject } from '../../forms/domain/runtime-document';
import { applyChoiceCardinality } from './form-choice-cardinality';
import { reconcileChoiceSample } from './form-choice-sample';
const document: JsonObject = {
  data_schema: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: { answer: { type: ['integer', 'boolean', 'null'] } },
        },
      },
    },
  },
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        {
          component: 'repeater',
          scope: '/properties/rows',
          children: [
            {
              component: 'choice',
              scope: '/properties/rows/items/properties/answer',
            },
          ],
        },
      ],
    },
  },
};
const list = applyChoiceCardinality(
  document,
  '/properties/rows/items/properties/answer',
  { component: 'choice', options: { multiple: true } },
);
it('converts compatible nested samples and keeps zero, false, null, missing fields and other data', () => {
  const data: JsonObject = {
    rows: [
      { answer: 0, retained: 'a' },
      { answer: false },
      { answer: null },
      {},
    ],
  };
  const changed = reconcileChoiceSample(document, list, data);
  expect(changed).toEqual({
    data: {
      rows: [
        { answer: [0], retained: 'a' },
        { answer: [false] },
        { answer: null },
        {},
      ],
    },
    cleared: false,
  });
  expect(reconcileChoiceSample(list, document, changed.data).data).toEqual(
    data,
  );
  expect((data['rows'] as JsonObject[])[0]['answer']).toBe(0);
});
it('reports discarded incompatible multi-sample values without silently choosing a value', () => {
  const data: JsonObject = {
    rows: [{ answer: [0, false], retained: true }, { answer: [] }],
  };
  expect(reconcileChoiceSample(list, document, data)).toEqual({
    data: { rows: [{ retained: true }, {}] },
    cleared: true,
  });
  expect((data['rows'] as JsonObject[])[0]['answer']).toEqual([0, false]);
});
