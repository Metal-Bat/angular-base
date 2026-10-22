import {
  JsonObject,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import { editSampleCollection } from './sample-collections';
const a = '01900000-0000-7000-8000-000000000001';
const b = '01900000-0000-7000-8000-000000000002';
const ca = '01900000-0000-7000-8000-000000000003';
const cb = '01900000-0000-7000-8000-000000000004';
const schema: JsonObject = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          children: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
    },
  },
};
const data: JsonObject = {
  rows: [
    { title: 'A', children: [{ name: 'A child' }] },
    { title: 'B', children: [{ name: 'B child' }] },
  ],
};
function document(): RuntimeDocument {
  return {
    dialect: 'bpms.runtime/1',
    identity: {
      resourceKind: 'REQUEST',
      resource: 'sample',
      formVersion: 'form',
      versionNumber: 1,
      submission: 'sample',
      design: 'original',
      view: 'edit',
    },
    purpose: 'edit',
    locale: { language: 'en', direction: 'ltr' },
    before: null,
    render: {
      component: 'table',
      key: 'rows',
      scope: '/properties/rows',
      label: 'Rows',
      renderer: 'default',
      display: {},
      children: [],
    },
    page: {},
    actions: [],
    behavior: { provenance: {}, issues: [] },
    canonical: data,
    rowIdentity: {
      '/rows': [a, b],
      '/rows/0/children': [ca],
      '/rows/1/children': [cb],
    },
    policy: {
      readable: ['/properties/rows'],
      writable: ['/properties/rows'],
      required: [],
    },
    fields: [
      {
        scope: '/properties/rows',
        schema: (schema['properties'] as JsonObject)['rows'] as JsonObject,
        writable: true,
        required: false,
      },
    ],
  };
}
describe('Synthetic collection editing', () => {
  it('retains nested row identities on moves and assigns fresh UUIDv7 identities only to duplicates', () => {
    const original = document();
    const moved = editSampleCollection(
      original,
      data,
      schema,
      '/properties/rows',
      '/rows',
      'reorder',
      b,
      0,
    );
    expect(moved.identity).toEqual({
      '/rows': [b, a],
      '/rows/0/children': [cb],
      '/rows/1/children': [ca],
    });
    const duplicated = editSampleCollection(
      { ...original, rowIdentity: moved.identity },
      moved.data,
      schema,
      '/properties/rows',
      '/rows',
      'duplicate',
      b,
    );
    expect(duplicated.identity['/rows'][0]).toBe(b);
    expect(duplicated.identity['/rows'][2]).toBe(a);
    expect(duplicated.identity['/rows/0/children']).toEqual([cb]);
    expect(duplicated.identity['/rows/2/children']).toEqual([ca]);
    expect(duplicated.identity['/rows'][1]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(duplicated.identity['/rows/1/children'][0]).not.toBe(cb);
    expect(duplicated.data['rows']).toEqual([
      (data['rows'] as JsonObject[])[1],
      (data['rows'] as JsonObject[])[1],
      (data['rows'] as JsonObject[])[0],
    ]);
    expect(original.canonical).toEqual(data);
    expect(original.rowIdentity['/rows']).toEqual([a, b]);
  });
  it('rejects stale keys, forged paths, readonly policy and canonical row bounds', () => {
    const original = document();
    expect(() =>
      editSampleCollection(
        original,
        data,
        schema,
        '/properties/rows',
        '/elsewhere',
        'remove',
        a,
      ),
    ).toThrow();
    expect(() =>
      editSampleCollection(
        original,
        data,
        schema,
        '/properties/rows',
        '/rows',
        'remove',
        'stale',
      ),
    ).toThrow();
    expect(() =>
      editSampleCollection(
        { ...original, policy: { ...original.policy, writable: [] } },
        data,
        schema,
        '/properties/rows',
        '/rows',
        'add',
      ),
    ).toThrow('read-only');
    const one = editSampleCollection(
      original,
      data,
      schema,
      '/properties/rows',
      '/rows',
      'remove',
      a,
    );
    expect(() =>
      editSampleCollection(
        { ...original, rowIdentity: one.identity },
        one.data,
        schema,
        '/properties/rows',
        '/rows',
        'remove',
        b,
      ),
    ).toThrow('limit');
    expect(one.identity).toEqual({ '/rows': [b], '/rows/0/children': [cb] });
  });
});
