import { readRuntimeDocument } from './runtime-document-adapter';
import { runtimeFixture } from '../testing/runtime-fixtures';
import { MISSING } from '../domain/canonical-values';
import { RuntimeDocument } from '../domain/runtime-document';
import {
  indicesFor,
  keysAt,
  replaceRow,
  rowPointer,
  rowValue,
} from '../domain/row-values';
import { writablePatch } from '../domain/writable-patch';
import { validateRuntime } from '../domain/runtime-validation';
import { formPages, pageRender } from '../domain/form-pages';
function base(): RuntimeDocument {
  const value = readRuntimeDocument(runtimeFixture());
  if (value.status !== 'ready') {
    throw Error('Invalid fixture');
  }
  return value.document;
}
describe('Stable nested collection values', () => {
  const scope =
    '/properties/rows/items/properties/nested/items/properties/value';
  const document = (): RuntimeDocument => ({
    ...base(),
    rowIdentity: { '/rows': ['a', 'b'], '/rows/1/nested': ['x', 'y'] },
  });
  it('binds explicit nested indices and escaped pointers without treating numeric property names as indices', () => {
    expect(rowPointer(scope, [1, 0])).toBe('/rows/1/nested/0/value');
    expect(keysAt(document(), scope, [1, 0])).toEqual(['b', 'x']);
    expect(indicesFor(document(), scope, ['b', 'y'])).toEqual([1, 1]);
    expect(rowPointer('/properties/12/properties/a~1b')).toBe('/12/a~1b');
  });
  it('follows row keys after reordering and rejects deleted identities', () => {
    const reordered = {
      ...document(),
      rowIdentity: { '/rows': ['b', 'a'], '/rows/0/nested': ['y', 'x'] },
    };
    expect(indicesFor(reordered, scope, ['b', 'x'])).toEqual([0, 1]);
    expect(indicesFor(reordered, scope, ['b', 'missing'])).toBeNull();
  });
  it('edits a nested row immutably and preserves missing/null/false/zero', () => {
    const data = { rows: [{ nested: [{ value: null, other: false }] }] };
    const next = replaceRow(data, scope, [0, 0], 0);
    expect(rowValue(next, scope, [0, 0])).toBe(0);
    expect(rowValue(data, scope, [0, 0])).toBeNull();
    expect(rowValue(next, scope.replace('/value', '/absent'), [0, 0])).toBe(
      MISSING,
    );
  });
  it('refuses forged indices, prototype traversal and structural removal', () => {
    expect(() => rowPointer(scope, [0])).toThrow();
    expect(() => rowPointer('/properties/__proto__')).toThrow();
    expect(() =>
      replaceRow({ rows: ['a'] }, '/properties/rows/items', [1], 'b'),
    ).toThrow();
    expect(() =>
      replaceRow({ rows: ['a'] }, '/properties/rows/items', [0], MISSING),
    ).toThrow();
  });
  it('projects child-only writable rows while preserving row counts and withholding readable-only values', () => {
    const doc = {
      ...base(),
      policy: {
        readable: [],
        required: [],
        writable: ['/properties/rows/items/properties/note'],
      },
      fields: [],
    };
    expect(
      writablePatch(doc, {
        rows: [
          { note: 'edit', private: 'hidden' },
          { note: 'second', readonly: true },
        ],
        secret: 'hidden',
      }),
    ).toEqual({ rows: [{ note: 'edit' }, { note: 'second' }] });
  });
  it('validates required fields inside visible repeated rows', () => {
    const doc = {
      ...base(),
      fields: [
        {
          scope: '/properties/rows',
          writable: true,
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'object',
              required: ['note'],
              properties: { note: { type: 'string', minLength: 1 } },
            },
          },
        },
      ],
    };
    expect(
      validateRuntime(doc, { rows: [{}, { note: '' }] }).map(
        (issue) => issue.pointer,
      ),
    ).toEqual(['/rows/0/note', '/rows/1/note']);
  });
  it('projects declared pages and excludes invalid or unauthorized scopes', () => {
    const doc = base();
    const pageScope = doc.render.children[0].scope!;
    const pages = formPages({
      ...doc,
      page: {
        pages: [
          { key: 'first', title: 'Page', scopes: [pageScope] },
          { key: 'invalid', title: 'Hidden', scopes: ['/properties/secret'] },
        ],
      },
    });
    expect(pages).toHaveLength(1);
    expect(
      pageRender(doc.render, pages[0].scopes).children.every(
        (child) => child.scope === pageScope,
      ),
    ).toBe(true);
  });
});

import { correctionValue } from '../domain/correction-values';
describe('Correction feedback identity', () => {
  it('binds prior/current values by stable row key after reorder', () => {
    const scope = '/properties/rows/items/properties/note';
    expect(
      correctionValue(
        { rows: [{ note: 'current-b' }, { note: 'current-a' }] },
        scope,
        'a',
        { '/rows': ['b', 'a'] },
      ),
    ).toBe('current-a');
    expect(
      correctionValue(
        { rows: [{ note: 'prior-a' }, { note: 'prior-b' }] },
        scope,
        'a',
        { '/rows': ['a', 'b'] },
      ),
    ).toBe('prior-a');
  });
  it('does not substitute a current index for unavailable prior identities or removed rows', () => {
    const scope = '/properties/rows/items/properties/note';
    expect(
      correctionValue({ rows: [{ note: 'other' }] }, scope, 'deleted', {
        '/rows': ['other'],
      }),
    ).toBe(MISSING);
    expect(
      correctionValue({ rows: [{ note: 'other' }] }, scope, 'a', null),
    ).toBe(MISSING);
  });
});
