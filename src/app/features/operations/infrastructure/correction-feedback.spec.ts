import { RuntimeDocument } from '../../forms/domain/runtime-document';
import { readRuntimeDocument } from '../../forms/infrastructure/runtime-document-adapter';
import { runtimeFixture } from '../../forms/testing/runtime-fixtures';
import {
  correctionTargets,
  validCorrectionFeedback,
} from '../domain/correction-feedback';
function document(): RuntimeDocument {
  const result = readRuntimeDocument(runtimeFixture());
  if (result.status !== 'ready') {
    throw Error('Invalid owned fixture');
  }
  return result.document;
}
it('offers authorized fields and rejects hidden, missing or unbounded feedback', () => {
  const source = document();
  const scoped = {
    ...source,
    policy: {
      ...source.policy,
      readable: ['/properties/amount'],
      writable: [],
    },
  };
  expect(correctionTargets(scoped).map((row) => row.scope)).toEqual([
    '/properties/amount',
  ]);
  const row = {
    scope: '/properties/amount',
    item_key: null,
    message: 'Correct amount',
  };
  expect(validCorrectionFeedback(scoped, [row])).toBe(true);
  for (const invalid of [
    [],
    [{ ...row, message: ' ' }],
    [{ ...row, scope: '/properties/private' }],
    [{ ...row, message: 'a'.repeat(4001) }],
    Array.from({ length: 65 }, () => row),
  ]) {
    expect(validCorrectionFeedback(scoped, invalid)).toBe(false);
  }
});
it('binds feedback to stable row keys across reorder and rejects removed rows', () => {
  const source = document();
  const scope = '/properties/lines/items/properties/note';
  const scoped: RuntimeDocument = {
    ...source,
    fields: [
      { scope, schema: { type: 'string' }, writable: false, required: false },
    ],
    policy: { readable: [scope], writable: [], required: [] },
    rowIdentity: { '/lines': ['row-a', 'row-b'] },
  };
  const row = { scope, item_key: 'row-a', message: 'Correct this row' };
  expect(
    correctionTargets(scoped).map((target) => [target.item_key, target.row]),
  ).toEqual([
    ['row-a', '1'],
    ['row-b', '2'],
  ]);
  expect(validCorrectionFeedback(scoped, [row])).toBe(true);
  const reordered = {
    ...scoped,
    rowIdentity: { '/lines': ['row-b', 'row-a'] },
  };
  expect(validCorrectionFeedback(reordered, [row])).toBe(true);
  expect(
    correctionTargets(reordered).find((target) => target.item_key === 'row-a')
      ?.row,
  ).toBe('2');
  expect(
    validCorrectionFeedback(
      { ...scoped, rowIdentity: { '/lines': ['row-b'] } },
      [row],
    ),
  ).toBe(false);
  expect(validCorrectionFeedback(scoped, [{ ...row, item_key: null }])).toBe(
    false,
  );
});

it('keeps literal schema keywords as field names when finding correction targets', () => {
  const source = document();
  const scopes = [
    '/properties/items',
    '/properties/items_total',
    '/properties/properties/items/properties/items',
  ];
  const scoped: RuntimeDocument = {
    ...source,
    fields: scopes.map((scope) => ({
      scope,
      schema: { type: 'string' },
      writable: true,
      required: false,
    })),
    policy: { readable: scopes, writable: scopes, required: [] },
    rowIdentity: { '/properties': ['row-a', 'row-b'] },
  };
  expect(
    correctionTargets(scoped).map((target) => [target.scope, target.item_key]),
  ).toEqual([
    [scopes[0], null],
    [scopes[1], null],
    [scopes[2], 'row-a'],
    [scopes[2], 'row-b'],
  ]);
});

it('locates scalar and nested row corrections at their current instance paths', () => {
  const source = document();
  const scope =
    '/properties/groups/items/properties/lines/items/properties/note';
  const scoped: RuntimeDocument = {
    ...source,
    fields: [
      {
        scope: '/properties/amount',
        schema: { type: 'integer' },
        writable: true,
        required: false,
      },
      { scope, schema: { type: 'string' }, writable: true, required: false },
    ],
    policy: {
      readable: ['/properties/amount', scope],
      writable: [],
      required: [],
    },
    rowIdentity: {
      '/groups': ['group-a'],
      '/groups/0/lines': ['row-a', 'row-b'],
    },
  };
  expect(correctionTargets(scoped)[0]).toMatchObject({ pointer: '/amount' });
  expect(
    correctionTargets(scoped, new Set(['/properties/amount'])).map(
      (target) => target.pointer,
    ),
  ).toEqual(['/amount']);
  expect(
    correctionTargets(scoped).find((row) => row.item_key === 'row-b'),
  ).toMatchObject({
    pointer: '/groups/0/lines/1/note',
    row: '1.2',
  });
  expect(
    correctionTargets({
      ...scoped,
      rowIdentity: {
        '/groups': ['group-a'],
        '/groups/0/lines': ['row-b', 'row-a'],
      },
    }).find((row) => row.item_key === 'row-b'),
  ).toMatchObject({
    pointer: '/groups/0/lines/0/note',
    row: '1.1',
  });
});
