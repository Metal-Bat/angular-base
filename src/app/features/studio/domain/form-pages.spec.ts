import { JsonObject } from '../../forms/domain/runtime-document';
import { authoredPages, removePage, reorderPage, savePage } from './form-pages';
const documents: JsonObject = {
  data_schema: { type: 'object', properties: { name: { type: 'string' } } },
  render_schema: { root: { component: 'vertical' } },
  page_settings: {
    paper: 'retained',
    retained: { flag: false, count: 0 },
    pages: [
      {
        key: 'original',
        title: 'Original',
        scopes: ['/properties/name', '/properties/name'],
        retained: { flag: false, count: 0 },
      },
    ],
  },
  variants: [{ key: 'untouched' }],
};
describe('Existing form page contract', () => {
  it('changes a title without normalizing untouched scopes, keys or metadata', () => {
    const next = savePage(
      documents,
      'original',
      'Renamed',
      ['/properties/name', '/properties/name'],
      ['/properties/name'],
    );
    expect(authoredPages(next)?.[0]).toMatchObject({
      key: 'original',
      title: 'Renamed',
      scopes: ['/properties/name', '/properties/name'],
    });
    expect(authoredPages(next)?.[0].source['retained']).toEqual({
      flag: false,
      count: 0,
    });
    expect(next['data_schema']).toBe(documents['data_schema']);
    expect(next['variants']).toBe(documents['variants']);
    expect((next['page_settings'] as JsonObject)['retained']).toEqual({
      flag: false,
      count: 0,
    });
    expect(authoredPages(documents)?.[0].title).toBe('Original');
  });
  it('generates stable unique keys and removes/reorders only pages, preserving canonical fields', () => {
    const next = savePage(
      documents,
      null,
      'Second',
      ['/properties/name'],
      ['/properties/name'],
    );
    expect(authoredPages(next)?.map((page) => page.key)).toEqual([
      'original',
      'page_1',
    ]);
    const moved = reorderPage(next, 'page_1', -1);
    expect(authoredPages(moved)?.map((page) => page.key)).toEqual([
      'page_1',
      'original',
    ]);
    const removed = removePage(moved, 'original');
    expect(authoredPages(removed)?.map((page) => page.key)).toEqual(['page_1']);
    expect(removed['data_schema']).toBe(documents['data_schema']);
    expect(removed['render_schema']).toBe(documents['render_schema']);
    expect(reorderPage(removed, 'page_1', -1)).toBe(removed);
  });
  it('preserves existing missing assignments but cannot add unknown assignments or replace unsupported pages', () => {
    expect(() =>
      savePage(
        documents,
        null,
        'Bad',
        ['/properties/unknown'],
        ['/properties/name'],
      ),
    ).toThrow();
    expect(() =>
      savePage(
        documents,
        'missing',
        'Bad',
        ['/properties/name'],
        ['/properties/name'],
      ),
    ).toThrow();
    const missing = {
      ...documents,
      page_settings: {
        pages: [{ key: 'old', title: 'Old', scopes: ['/properties/old'] }],
      },
    };
    expect(
      authoredPages(
        savePage(
          missing,
          'old',
          'Renamed',
          ['/properties/old'],
          ['/properties/name'],
        ),
      )?.[0].scopes,
    ).toEqual(['/properties/old']);
    const unsupported = {
      ...documents,
      page_settings: { pages: [{ unexpected: true }] },
    };
    expect(authoredPages(unsupported)).toBeNull();
    expect(() =>
      savePage(
        unsupported,
        null,
        'New',
        ['/properties/name'],
        ['/properties/name'],
      ),
    ).toThrow();
  });
  it('uses the producer code-point bounds and rejects duplicate identities and excessive pages', () => {
    const unicode = savePage(
      { ...documents, page_settings: {} },
      null,
      '😀'.repeat(256),
      ['/properties/name'],
      ['/properties/name'],
    );
    expect(authoredPages(unicode)?.[0].title).toBe('😀'.repeat(256));
    expect(() =>
      savePage(
        unicode,
        null,
        '😀'.repeat(257),
        ['/properties/name'],
        ['/properties/name'],
      ),
    ).toThrow();
    const full = {
      ...documents,
      page_settings: {
        pages: Array.from({ length: 32 }, (_, i) => ({
          key: 'p' + i,
          title: 'Page',
          scopes: ['/properties/name'],
        })),
      },
    };
    expect(() =>
      savePage(full, null, 'New', ['/properties/name'], ['/properties/name']),
    ).toThrow();
    expect(
      authoredPages({
        ...full,
        page_settings: {
          pages: [
            { key: 'same', title: 'A', scopes: [] },
            { key: 'same', title: 'B', scopes: [] },
          ],
        },
      }),
    ).toBeNull();
  });
});
