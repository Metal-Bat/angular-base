import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from '../transport/api-client';
import { ApiFailure } from '../transport/api-failure';
import { errorInterceptor } from './error-interceptor';
import { RequestErrors } from './request-errors';

describe('Request error feedback', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let errors: RequestErrors;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    errors = TestBed.inject(RequestErrors);
  });
  afterEach(() => controller.verify());

  it('shows an exact numeric code including zero and preserves HTTP error handling', async () => {
    const pending = firstValueFrom(http.get('/api/v1/example')).catch(
      (error: unknown) => error,
    );
    controller
      .expectOne('/api/v1/example')
      .flush(
        { code: 0, message: 'private details' },
        { status: 400, statusText: 'Bad Request' },
      );
    const result = await pending;
    expect(result).toBeInstanceOf(HttpErrorResponse);
    expect(errors.notice()?.code).toBe('0');
    expect(errors.notice()?.message).not.toContain('private');
  });

  it('decodes blob errors and keeps string codes unchanged', async () => {
    const pending = firstValueFrom(
      http.get('/api/v1/example', { responseType: 'blob' }),
    ).catch((error: unknown) => error);
    controller
      .expectOne('/api/v1/example')
      .flush(new Blob(['{"code":"001_CONFLICT"}']), {
        status: 409,
        statusText: 'Conflict',
      });
    await pending;
    expect(errors.notice()?.code).toBe('001_CONFLICT');
  });

  it('reports unsuccessful JSON envelopes without replacing their response', async () => {
    const pending = firstValueFrom(http.get('/api/v1/example'));
    controller.expectOne('/api/v1/example').flush({ success: false, code: 17 });
    expect(await pending).toEqual({ success: false, code: 17 });
    expect(errors.notice()?.code).toBe('17');
  });

  it('reports decoded API blob envelopes without parsing a successful response twice', async () => {
    const pending = firstValueFrom(
      TestBed.inject(ApiClient).call('me_api_v1_auth_me_get', {}),
    );
    const request = await vi.waitFor(() =>
      controller.expectOne('/api/v1/auth/me'),
    );
    request.flush(new Blob(['{"success":false,"code":18}']));
    expect((await pending).body).toEqual({ success: false, code: 18 });
    expect(errors.notice()?.code).toBe('18');
  });

  it('uses public boundary identifiers when no backend code is available', async () => {
    const pending = firstValueFrom(http.post('/session/login', {})).catch(
      (error: unknown) => error,
    );
    controller
      .expectOne('/session/login')
      .flush(
        { error: 'sign_in_failed' },
        { status: 401, statusText: 'Unauthorized' },
      );
    await pending;
    expect(errors.notice()?.code).toBe('sign_in_failed');
    expect(errors.notice()?.message).toBe(
      'The username or password is incorrect.',
    );
  });

  it('does not expose HTML or invent an application code', async () => {
    const pending = firstValueFrom(http.get('/api/v1/example')).catch(
      (error: unknown) => error,
    );
    controller
      .expectOne('/api/v1/example')
      .flush('<html>private proxy details</html>', {
        status: 502,
        statusText: 'Bad Gateway',
      });
    await pending;
    expect(errors.notice()).toBeNull();
  });

  it('discards an error still decoding when the actor changes', async () => {
    let finish!: (value: string) => void;
    const body = new Blob();
    vi.spyOn(body, 'text').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = firstValueFrom(
      http.get('/api/v1/example', { responseType: 'blob' }),
    ).catch((error: unknown) => error);
    controller
      .expectOne('/api/v1/example')
      .flush(body, { status: 409, statusText: 'Conflict' });
    TestBed.inject(ActorState).reset();
    finish('{"code":17}');
    await pending;
    expect(errors.notice()).toBeNull();
  });

  it('dismisses only the current notice and clears it on actor reset', () => {
    errors.show(new ApiFailure(400, 'ONE', null, []));
    const old = errors.notice()!;
    errors.show(new ApiFailure(400, 'TWO', null, []));
    errors.dismiss(old.id);
    expect(errors.notice()?.code).toBe('TWO');
    TestBed.inject(ActorState).reset();
    expect(errors.notice()).toBeNull();
  });
});
