import {
  fieldChanges,
  presentedFields,
  recordCollections,
} from './record-presentation';
describe('Read-only response presentation', () => {
  it('groups heterogeneous domain collection rows without leaking references or mutating input', () => {
    const source = {
      assignments: [
        {
          name: 'Sara',
          enabled: false,
          user_ref_id: 'hidden',
          client_ref_ids: ['private'],
        },
        { name: 'Ali', amount: '0.00000000000000001', token: 'secret' },
      ],
    };
    const snapshot = structuredClone(source);
    const [collection] = recordCollections(source);
    expect(collection.columns.map((column) => column.path)).toEqual([
      ['name'],
      ['enabled'],
      ['amount'],
    ]);
    expect(collection.rows[0]['["enabled"]'].value).toBe(false);
    expect(collection.rows[1]['["amount"]'].value).toBe('0.00000000000000001');
    expect(source).toEqual(snapshot);
    expect(JSON.stringify(collection)).not.toMatch(/hidden|private|secret/);
    expect(
      presentedFields({
        client_ref_ids: ['private'],
        refs: ['private'],
        number: 0,
      }).map((field) => field.value),
    ).toEqual([0]);
  });
  it('keeps returned nested fields, booleans, zeroes and array objects', () => {
    const fields = presentedFields({
      priority: 0,
      enabled: false,
      rules: [{ name: 'Review', settings: { limit: 5 } }],
    });
    expect(fields.map((field) => field.value)).toEqual([0, false, 'Review', 5]);
    expect(fields.at(-1)?.path).toEqual(['rules', '0', 'settings', 'limit']);
  });
  it('compares restore values field by field and ignores unchanged fields', () => {
    const changes = fieldChanges(
      { name: null, description: null, active: false },
      { name: 'test_2', description: 'test', active: false },
    );
    expect(
      changes.map((change) => [
        change.path.join('.'),
        change.before,
        change.after,
      ]),
    ).toEqual([
      ['name', null, 'test_2'],
      ['description', null, 'test'],
    ]);
  });
  it('distinguishes an absent value from null, empty text, zero and false', () => {
    const changes = fieldChanges(
      { removed: 0, cleared: 'old' },
      { added: false, cleared: null, text: '' },
    );
    expect(
      changes.find((change) => change.path[0] === 'removed')?.afterPresent,
    ).toBe(false);
    expect(
      changes.find((change) => change.path[0] === 'added')?.beforePresent,
    ).toBe(false);
    expect(
      changes.find((change) => change.path[0] === 'cleared')?.afterPresent,
    ).toBe(true);
    expect(changes.find((change) => change.path[0] === 'text')?.after).toBe('');
  });
  it('compares nested fields and array membership independently of object key order', () => {
    expect(
      fieldChanges(
        { settings: { a: 1, b: 2 }, roles: ['reader'] },
        { roles: ['reader', 'editor'], settings: { b: 2, a: 1 } },
      ).map((change) => change.path),
    ).toEqual([['roles', '1']]);
  });
  it('keeps empty lists distinct from empty objects and null', () => {
    expect(fieldChanges({ options: [] }, { options: [] })).toEqual([]);
    expect(fieldChanges({ options: {} }, { options: {} })).toEqual([]);
    expect(fieldChanges({ options: [] }, { options: {} })).toHaveLength(1);
    expect(fieldChanges({ options: null }, { options: [] })).toHaveLength(1);
  });
  it('never exposes nested secrets or opaque references and leaves the response intact', () => {
    const before = {
      profile: { password: 'hidden', ref_id: 'opaque', username: 'Ali' },
      request_id: 'trace',
    };
    const after = {
      profile: {
        password: 'changed secret',
        ref_id: 'new ref',
        username: 'Sara',
      },
    };
    expect(fieldChanges(before, after).map((change) => change.path)).toEqual([
      ['profile', 'username'],
    ]);
    expect(before.profile.password).toBe('hidden');
  });
});

it('presents authorized token usage counts while hiding authentication tokens', () => {
  const fields = presentedFields({
    used: { input_tokens: 0, output_tokens: 2, total_tokens: 2 },
    access_token: 'private',
    token: 'private',
  });
  expect(fields.map((field) => field.path.join('.'))).toEqual([
    'used.input_tokens',
    'used.output_tokens',
    'used.total_tokens',
  ]);
  expect(JSON.stringify(fields)).not.toContain('private');
});

it('does not present secrets stored under a token-count-shaped key', () => {
  expect(
    presentedFields({
      input_tokens: 'private-secret',
      output_tokens: -1,
      total_tokens: 1.5,
    }),
  ).toEqual([]);
});
