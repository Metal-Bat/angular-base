import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { runtimeFixture } from '../testing/runtime-fixtures';
import { readRuntimeDocument } from './runtime-document-adapter';
import { RuntimeOptions } from './runtime-options';

function response(
  keys: string[],
  revision = 'source/1',
): HttpResponse<unknown> {
  return new HttpResponse({
    body: {
      success: true,
      result: {
        dialect: 'bpms.options/1',
        key_encoding: 'json-scalar/1',
        state: 'READY',
        generation: 3,
        source_revision: revision,
        dependency_fingerprint: 'inputs/1',
        locale: 'en',
        page: 1,
        size: 20,
        total: 40,
        total_pages: 2,
        items: keys.map((key) => ({ key, value: key })),
      },
    },
  });
}
describe('Authorized runtime option transport', () => {
  it('merges selected lookup with the candidate page and sends the named view', async () => {
    const call = vi
      .fn()
      .mockReturnValueOnce(of(response(['json:1'])))
      .mockReturnValueOnce(of(response(['json:2'])));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const runtime = readRuntimeDocument(runtimeFixture());
    if (runtime.status !== 'ready') {
      throw Error('Fixture incompatible');
    }
    const page = await TestBed.inject(RuntimeOptions).query(
      runtime.document,
      '/root/children/3',
      {
        data: { choice: 2 },
        selected: ['json:2'],
        locale: 'en',
        search: 'One',
        page: 1,
      },
      3,
      new AbortController().signal,
    );
    expect(page.items.map((item) => item.key)).toEqual(['json:1', 'json:2']);
    expect(page.totalPages).toBe(2);
    expect(call.mock.calls[0][1]).toMatchObject({
      query: { key: 'review' },
      body: {
        selected_keys: [],
        size: 20,
        search: 'One',
        node_pointer: '/root/children/3',
      },
    });
    expect(call.mock.calls[1][1]).toMatchObject({
      body: { selected_keys: ['json:2'], search: null, size: 100 },
    });
  });
  it.each(['json:{}', 'json:null'])(
    'rejects unsafe typed option key %s',
    async (key) => {
      const call = vi.fn().mockReturnValue(of(response([key])));
      TestBed.configureTestingModule({
        providers: [{ provide: ApiClient, useValue: { call } }],
      });
      const runtime = readRuntimeDocument(runtimeFixture('REQUEST'));
      if (runtime.status !== 'ready') {
        throw Error('Fixture incompatible');
      }
      await expect(
        TestBed.inject(RuntimeOptions).query(
          runtime.document,
          '/root/children/3',
          {
            data: {},
            selected: [],
            locale: 'en',
            search: '',
            page: 1,
          },
          3,
          new AbortController().signal,
        ),
      ).rejects.toThrow();
      expect(call.mock.calls[0][0]).toBe(
        'request_options_api_v1_business_requests__ref_id__options_post',
      );
    },
  );
  it('rejects a selected lookup from a different source snapshot', async () => {
    const call = vi
      .fn()
      .mockReturnValueOnce(of(response(['json:1'])))
      .mockReturnValueOnce(of(response(['json:2'], 'source/2')));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const runtime = readRuntimeDocument(runtimeFixture());
    if (runtime.status !== 'ready') {
      throw Error('Fixture incompatible');
    }
    await expect(
      TestBed.inject(RuntimeOptions).query(
        runtime.document,
        '/root/children/3',
        {
          data: {},
          selected: ['json:2'],
          locale: 'en',
          search: '',
          page: 1,
        },
        3,
        new AbortController().signal,
      ),
    ).rejects.toThrow('snapshot changed');
  });
});
