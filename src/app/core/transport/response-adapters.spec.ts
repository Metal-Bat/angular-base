import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ApiFailure, failure } from './api-failure';
import {
  decodePage,
  readBareToken,
  readData,
  readDataPage,
  readResultPage,
  readSelector,
  responseMetadata,
} from './response-adapters';

const string = (value: unknown): string => {
  if (typeof value !== 'string') {
    throw new Error('Not a string');
  }
  return value;
};
const response = (body: unknown, status = 200): HttpResponse<unknown> =>
  new HttpResponse({
    body,
    status,
    headers: new HttpHeaders({ 'x-request-id': 'request-fixture' }),
  });
const page = { items: ['one'], page: 1, size: 20, total: 1, total_pages: 1 };
describe('Endpoint response contracts', () => {
  it('keeps HTTP 200 distinct from application 204 and preserves null data', () => {
    const value = response({ success: true, code: 204, data: null });
    expect(readData(value, (data) => data)).toBeNull();
    expect(responseMetadata(value)).toEqual({
      httpStatus: 200,
      applicationCode: 204,
      requestId: 'request-fixture',
    });
  });
  it('reads search result pages and scheduled-action data pages separately', () => {
    expect(
      readResultPage(response({ success: true, result: page }), string).items,
    ).toEqual(['one']);
    expect(
      readDataPage(response({ success: true, data: page }), string).items,
    ).toEqual(['one']);
    expect(() =>
      readResultPage(response({ success: true, data: page }), string),
    ).toThrow();
  });
  it('supports empty pages and rejects zero page, excessive size and invalid items', () => {
    expect(
      decodePage({ ...page, items: [], total: 0, total_pages: 0 }, string)
        .items,
    ).toEqual([]);
    for (const invalid of [
      { ...page, page: 0 },
      { ...page, size: 101 },
      { ...page, items: [4] },
    ]) {
      expect(() => decodePage(invalid, string)).toThrow();
    }
  });
  it('decodes bounded bare selectors and bare OAuth responses', () => {
    expect(readSelector(response(['one']), string)).toEqual(['one']);
    expect(() =>
      readSelector(response(Array(1001).fill('one')), string),
    ).toThrow();
    expect(
      readBareToken(
        response({ access_token: 'fixture', token_type: 'bearer' }),
      ),
    ).toEqual({ access_token: 'fixture', token_type: 'bearer' });
  });
  it.each([401, 403, 409, 422])(
    'preserves status %s, numeric application code and JSON pointers without raw inputs',
    (status) => {
      const error = failure(
        status,
        {
          code: 1042,
          data: {
            issues: [
              {
                pointer: '/rows/0/name',
                code: 'required',
                input: 'private-value',
              },
            ],
          },
        },
        'request-fixture',
      );
      expect(error.httpStatus).toBe(status);
      expect(error.applicationCode).toBe(1042);
      expect(error.issues).toEqual([
        { pointer: '/rows/0/name', code: 'required' },
      ]);
      expect(JSON.stringify(error)).not.toContain('private-value');
    },
  );
  it('rejects failed HTTP 200 envelopes and hides proxy markup', () => {
    expect(() =>
      readData(response({ success: false, code: 12 }), string),
    ).toThrow(ApiFailure);
    expect(failure(502, '<html>proxy secret</html>', null).message).toBe(
      'The service is unavailable.',
    );
  });
});
