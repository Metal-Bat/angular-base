import { translatedSchemaSummary } from './schema-summary';
it('translates each composite type token without rewriting schema values', () => {
  const schema = { type: ['string', 'null'] };
  const fa: Record<string, string> = { string: 'متن', null: 'تهی' };
  const ar: Record<string, string> = { string: 'نص', null: 'فارغ' };
  expect(translatedSchemaSummary(schema, (value) => fa[value] ?? value)).toBe(
    'متن / تهی',
  );
  expect(translatedSchemaSummary(schema, (value) => ar[value] ?? value)).toBe(
    'نص / فارغ',
  );
  expect(schema).toEqual({ type: ['string', 'null'] });
});
it('keeps separators and unrecognized format keys while localizing the value type', () => {
  expect(
    translatedSchemaSummary(
      { type: 'string', format: 'custom-format' },
      (value) => (value === 'string' ? 'متن' : value),
    ),
  ).toBe('متن · custom-format');
});
