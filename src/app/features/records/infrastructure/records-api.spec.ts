import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RecordsApi } from './records-api';
import { recordDefinitions } from './record-definitions';
import { emptyQuery } from '../../../shared/domain/list-query';
import { formBody } from '../domain/records';
describe('Resource operation adapters', () => {
  let http: HttpTestingController;
  let api: RecordsApi;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(RecordsApi);
  });
  afterEach(() => http.verify());
  it('preserves public numeric agent budgets while redacting credential lookalikes', async () => {
    const work = api.detail(recordDefinitions['agents'], 'agent-current');
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/ai-agents/agent-current'),
    );
    request.flush(
      new Blob([
        JSON.stringify({
          success: true,
          data: {
            spec: {
              user_limits: {
                input_tokens: 10,
                output_tokens: 0,
                total_tokens: 10,
                access_token: 'private',
              },
            },
            effective_limits: {
              input_tokens: 5,
              output_tokens: 0,
              total_tokens: 5,
            },
            credentials: { input_tokens: 'private', token: 123 },
          },
        }),
      ]),
    );
    expect(await work).toEqual({
      spec: {
        user_limits: {
          input_tokens: 10,
          output_tokens: 0,
          total_tokens: 10,
          access_token: '[redacted]',
        },
      },
      effective_limits: { input_tokens: 5, output_tokens: 0, total_tokens: 5 },
      credentials: '[redacted]',
    });
  });
  it('uses paged Select Users with the ordinary partition and supported extras', async () => {
    const query = { ...emptyQuery(), extras: { include_deleted: true } };
    const work = api.list(recordDefinitions['users'], query);
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/admin/users/select?response_format=page'),
    );
    expect(request.request.body).toEqual({
      page: 1,
      size: 20,
      filters: [
        { field_name: 'is_superuser', operation: 'equal', value: false },
      ],
      sort_orders: [],
      include_deleted: true,
    });
    request.flush(
      new Blob([
        JSON.stringify({
          success: true,
          result: {
            items: [{ key: 'user-v2', value: 'Ali' }],
            page: 1,
            size: 20,
            total: 1,
            total_pages: 1,
          },
        }),
      ]),
    );
    expect((await work).items[0]['key']).toBe('user-v2');
  });
  it('uses the actual step-version SelectQuery and rejects unsupported restrictions', async () => {
    const definition = recordDefinitions['step-types'];
    await expect(
      api.list(definition, {
        ...emptyQuery(),
        filters: [
          { field_name: 'code', operation: 'equal', value: 'restricted' },
        ],
      }),
    ).rejects.toThrow('Unsupported step-version query');
    const pending = api.list(definition, { ...emptyQuery(), page: 2 });
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/step-types/search'),
    );
    expect(request.request.body).toEqual({ page: 2, size: 20 });
    request.flush(
      new Blob([
        JSON.stringify({
          success: true,
          result: { items: [], page: 2, size: 20, total: 0, total_pages: 0 },
        }),
      ]),
    );
    expect((await pending).items).toEqual([]);
  });
  it('retains the archive password only on owned report detail', async () => {
    const work = api.detail(recordDefinitions['reports'], 'owned-report');
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/reports/owned-report'),
    );
    request.flush(
      new Blob([
        '{"success":true,"data":{"ref_id":"owned-report","zip_password":"fixture-password"}}',
      ]),
    );
    expect((await work)['zip_password']).toBe('fixture-password');
    const history = api.list(
      {
        ...recordDefinitions['history'],
        operations: { search: recordDefinitions['users'].operations.history! },
      },
      emptyQuery(),
      { ref_id: 'user-v2' },
    );
    const req = await vi.waitFor(() =>
      http.expectOne('/api/v1/admin/users/user-v2/history'),
    );
    req.flush(
      new Blob([
        JSON.stringify({
          success: true,
          result: {
            items: [{ from_values: { password: 'hidden' } }],
            page: 1,
            size: 20,
            total: 1,
            total_pages: 1,
          },
        }),
      ]),
    );
    expect(JSON.stringify(await history)).not.toContain('hidden');
  });
  it('cancels a pending read when polling aborts', async () => {
    const controller = new AbortController();
    const work = api
      .list(
        recordDefinitions['reports'],
        emptyQuery(),
        undefined,
        controller.signal,
      )
      .catch(() => null);
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/reports/search'),
    );
    controller.abort();
    await work;
    expect(request.cancelled).toBe(true);
  });
  it('clears the role permission list using an empty array rather than null', () => {
    expect(
      formBody(recordDefinitions['roles'].fields, {
        name: 'reviewer',
        description: '',
        permissions: '',
      })['permissions'],
    ).toEqual([]);
  });
});
