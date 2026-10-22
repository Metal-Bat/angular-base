import { HttpResponse } from '@angular/common/http';
import { readAuxiliary } from './auxiliary-result';

function response(state = 'BLOCKED', generation = 0): HttpResponse<unknown> {
  return new HttpResponse({
    body: {
      success: true,
      result: {
        items: [],
        page: 1,
        size: 20,
        total: 0,
        total_pages: 0,
        dialect: 'bpms.options/1',
        key_encoding: 'json-scalar/1',
        state,
        generation,
        locale: 'fa',
        source_revision: 'source',
        dependency_fingerprint: 'dependencies',
      },
    },
  });
}
describe('Auxiliary option response', () => {
  it('preserves blocked/client-fetch states and source identity', () => {
    for (const state of ['BLOCKED', 'CLIENT_FETCH']) {
      expect(
        readAuxiliary('options', response(state), { query: { generation: 0 } }),
      ).toMatchObject({
        state,
        generation: 0,
        locale: 'fa',
        revision: 'source',
        fingerprint: 'dependencies',
        items: [],
      });
    }
  });
  it('rejects a mismatched generation and an unrecognized option state', () => {
    expect(() =>
      readAuxiliary('options', response('READY', 1), {
        query: { generation: 0 },
      }),
    ).toThrow();
    expect(() =>
      readAuxiliary('options', response('future'), {
        query: { generation: 0 },
      }),
    ).toThrow();
  });
  it('preserves the existing bare-selector and data envelopes for unrelated tools', () => {
    const rows = [{ ref_id: 'opaque' }];
    expect(
      readAuxiliary('other', new HttpResponse({ body: rows }), undefined),
    ).toBe(rows);
    expect(
      readAuxiliary(
        'other',
        new HttpResponse({ body: { success: true, data: { valid: false } } }),
        undefined,
      ),
    ).toEqual({ valid: false });
  });
});
