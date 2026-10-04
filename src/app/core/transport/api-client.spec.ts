import { ActorState } from '../auth/actor-state';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from './api-client';
import { ApiFailure } from './api-failure';
import { HealthClient } from './health-client';

async function settle(): Promise<void> {
  for (let index = 0; index < 20; index++) {
    await Promise.resolve();
  }
}
describe('Generated operation transport', () => {
  let http: HttpTestingController;
  let api: ApiClient;
  beforeEach(async () => {
    await import('./generated/operations');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ApiClient);
  });
  afterEach(() => {
    http.verify();
  });
  it('uses exact versioned paths and keeps health at the root', async () => {
    const work = firstValueFrom(api.call('me_api_v1_auth_me_get', {}));
    await settle();
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(
      new Blob(['{"success":true,"data":null}']),
    );
    expect((await work).body).toEqual({ success: true, data: null });
    const health = firstValueFrom(TestBed.inject(HealthClient).liveness());
    (await vi.waitFor(() => http.expectOne('/health'))).flush({ status: 'ok' });
    expect((await health).status).toBe(200);
  });
  it('preserves binary multipart uploads without supplying a multipart boundary', async () => {
    const upload = new Blob(['fixture']);
    const work = firstValueFrom(
      api.call('upload_file_api_v1_media_files_post', { body: { upload } }),
    );
    await settle();
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/media/files'),
    );
    expect(request.request.body).toBeInstanceOf(FormData);
    expect(request.request.body.get('upload')).toBeInstanceOf(Blob);
    expect(request.request.headers.has('content-type')).toBe(false);
    request.flush(new Blob(['{"success":true,"data":{}}']));
    await work;
  });
  it('decodes JSON blob errors and sends an uncertain mutation only once', async () => {
    const work = firstValueFrom(
      api.call('current_permissions_api_v1_auth_permissions_search_post', {
        body: { page: 1, size: 100 },
      }),
    ).catch((error: unknown) => error);
    await settle();
    (
      await vi.waitFor(() => http.expectOne('/api/v1/auth/permissions/search'))
    ).flush(
      new Blob([
        JSON.stringify({
          code: 17,
          uncertain: true,
          data: { issues: [{ pointer: '/amount', code: 'invalid' }] },
        }),
      ]),
      { status: 409, statusText: 'Conflict' },
    );
    const error = await work;
    expect(error).toBeInstanceOf(ApiFailure);
    expect((error as ApiFailure).uncertain).toBe(true);
    expect((error as ApiFailure).issues).toEqual([
      { pointer: '/amount', code: 'invalid' },
    ]);
    http.expectNone('/api/v1/auth/permissions/search');
  });
  it('discards a response still being decoded when the actor changes', async () => {
    let finish!: (value: string) => void;
    const decoding = new Promise<string>((resolve) => {
      finish = resolve;
    });
    const payload = new Blob(['private']);
    vi.spyOn(payload, 'text').mockReturnValue(decoding);
    const work = firstValueFrom(api.call('me_api_v1_auth_me_get', {})).catch(
      (error: unknown) => error,
    );
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(payload);
    await settle();
    TestBed.inject(ActorState).reset();
    finish('{"success":true,"data":{"username":"old-actor"}}');
    const outcome = await work;
    expect(outcome).toBeInstanceOf(Error);
    expect(JSON.stringify(outcome)).not.toContain('old-actor');
  });
});
