import { JsonObject } from '../../forms/domain/runtime-document';
import { chooseSubprocess, setChildInput } from './subprocess-pin';
const catalog = [
  {
    category: 'subprocess',
    metadata: { workflow_version_ref: 'published-child' },
  },
];
it('pins only a catalog-approved child version without rewriting existing mapped inputs', () => {
  expect(chooseSubprocess(undefined, 'published-child', catalog)).toEqual({
    workflow_version_ref: 'published-child',
    inputs: [],
  });
  const current = {
    workflow_version_ref: 'retired-pin',
    inputs: [{ constant_value: false }],
    retained: 0,
  };
  expect(() => chooseSubprocess(current, 'published-child', catalog)).toThrow(
    'Repair',
  );
  expect(() => chooseSubprocess(current, 'forbidden', catalog)).toThrow(
    'permitted',
  );
  const existing = {
    workflow_version_ref: 'published-child',
    inputs: [{ constant_value: false }],
    retained: 0,
  };
  expect(chooseSubprocess(existing, 'published-child', catalog)).toEqual(
    existing,
  );
});
it('writes canonical child constants and deliberately clears exact inputs without losing other mappings', () => {
  const rows: JsonObject[] = [
    {
      category: 'subprocess',
      metadata: {
        workflow_version_ref: 'published-child',
        interface: {
          inputs: [
            { name: 'flag', value_schema: { type: 'boolean' } },
            { name: 'amount', value_schema: { type: 'integer', minimum: 0 } },
          ],
        },
      },
    },
  ];
  const current = {
    workflow_version_ref: 'published-child',
    retained: 0,
    inputs: [{ name: 'other', source_kind: 'REQUEST', source_path: '/other' }],
  };
  const first = setChildInput(current, 'flag', false, rows);
  const mapped = setChildInput(first, 'amount', 0, rows);
  expect(
    (mapped['inputs'] as JsonObject[]).map((item) => item['constant_value']),
  ).toEqual([undefined, false, 0]);
  expect(setChildInput(mapped, 'flag', undefined, rows)['inputs']).toEqual([
    current.inputs[0],
    (mapped['inputs'] as JsonObject[])[2],
  ]);
  expect(() => setChildInput(current, 'amount', -1, rows)).toThrow('Invalid');
  expect(() => setChildInput(current, 'forbidden', true, rows)).toThrow(
    'Unsupported',
  );
  const pinned = {
    ...current,
    inputs: [{ name: 'flag', source_kind: 'REQUEST', source_path: '/flag' }],
  };
  expect(() => setChildInput(pinned, 'flag', true, rows)).toThrow('Remove');
});
it('projects an authorized collection item with exact leaf schema and refuses invalid indices or fields', async () => {
  const { setChildSource } = await import('./subprocess-pin');
  const childCatalog = [
    {
      category: 'subprocess',
      metadata: {
        workflow_version_ref: 'child',
        interface: {
          inputs: [{ name: 'note', value_schema: { type: 'string' } }],
        },
      },
    },
  ];
  const sources = [
    {
      key: '/lines',
      label: 'request.lines',
      schema: {
        type: 'array',
        items: { type: 'object', properties: { note: { type: 'string' } } },
      },
      binding: { source_kind: 'REQUEST', source_path: '/lines' },
    },
  ];
  const current = {
    workflow_version_ref: 'child',
    inputs: [{ name: 'other', source_kind: 'CONSTANT', constant_value: false }],
  };
  const next = setChildSource(
    current,
    'note',
    '/lines',
    childCatalog,
    sources,
    0,
    '/note',
  );
  expect(next['inputs']).toEqual([
    current.inputs[0],
    {
      name: 'note',
      source_kind: 'REQUEST',
      source_path: '/lines/0/note',
      source_schema: { type: 'string' },
    },
  ]);
  expect(() =>
    setChildSource(
      current,
      'note',
      '/lines',
      childCatalog,
      sources,
      -1,
      '/note',
    ),
  ).toThrow('index');
  expect(() =>
    setChildSource(
      current,
      'note',
      '/lines',
      childCatalog,
      sources,
      0,
      '/missing',
    ),
  ).toThrow('field');
  expect(current.inputs).toHaveLength(1);
});
