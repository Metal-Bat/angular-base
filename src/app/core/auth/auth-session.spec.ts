import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSession } from './auth-session';
import { SessionContext } from './session-context';
import { sessionInterceptor } from './session-interceptor';

async function settle(): Promise<void> {
  for (let count = 0; count < 12; count++) {
    await Promise.resolve();
  }
}
const blob = (body: unknown): Blob =>
  new Blob([JSON.stringify(body)], { type: 'application/json' });
describe('Authenticated bootstrap', () => {
  let http: HttpTestingController;
  let auth: AuthSession;
  beforeEach(async () => {
    await import('../transport/generated/operations');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthSession);
  });
  afterEach(() => {
    http.verify();
  });
  it('waits for the account and every permission page before granting access', async () => {
    const work = auth.bootstrap();
    expect(auth.bootstrap()).toBe(work);
    (await vi.waitFor(() => http.expectOne('/session/status'))).flush({
      authenticated: true,
      csrfToken: 'fixture-csrf',
    });
    await settle();
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(
      blob({
        success: true,
        data: { ref_id: 'opaque', username: 'requester', is_active: true },
      }),
    );
    await settle();
    const first = await vi.waitFor(() =>
      http.expectOne('/api/v1/auth/permissions/search'),
    );
    expect(first.request.body).toEqual({ page: 1, size: 100 });
    expect(first.request.headers.get('x-csrf-token')).toBe('fixture-csrf');
    first.flush(
      blob({
        success: true,
        result: {
          items: ['requests.start'],
          page: 1,
          size: 100,
          total: 101,
          total_pages: 2,
        },
      }),
    );
    await settle();
    expect(TestBed.inject(SessionContext).snapshot().status).toBe('unresolved');
    const second = await vi.waitFor(() =>
      http.expectOne('/api/v1/auth/permissions/search'),
    );
    expect(second.request.body).toEqual({ page: 2, size: 100 });
    second.flush(
      blob({
        success: true,
        result: {
          items: ['forms.manage'],
          page: 2,
          size: 100,
          total: 101,
          total_pages: 2,
        },
      }),
    );
    await work;
    expect(TestBed.inject(SessionContext).snapshot()).toEqual({
      status: 'authenticated',
      permissions: ['requests.start', 'forms.manage'],
    });
    expect(auth.profile()?.username).toBe('requester');
  });
  it('does not confuse an unavailable boundary with authenticated or signed-out access', async () => {
    const work = auth.bootstrap();
    (await vi.waitFor(() => http.expectOne('/session/status'))).flush(
      'proxy unavailable',
      { status: 503, statusText: 'Unavailable' },
    );
    await work;
    expect(TestBed.inject(SessionContext).snapshot().status).toBe('unresolved');
    expect(auth.unavailable()).toBe(true);
  });
  it('cannot restore an actor after logout interrupts bootstrap', async () => {
    const work = auth.bootstrap();
    const request = await vi.waitFor(() => http.expectOne('/session/status'));
    auth.invalidate(false);
    request.flush({ authenticated: true, csrfToken: 'late-csrf' });
    await work;
    expect(auth.profile()).toBeNull();
    expect(TestBed.inject(SessionContext).snapshot().status).toBe('signed-out');
  });
  it('serializes overlapping refreshes and rereads permissions after a newer focus', async () => {
    const boot = auth.bootstrap();
    (await vi.waitFor(() => http.expectOne('/session/status'))).flush({
      authenticated: true,
      csrfToken: 'fixture-csrf',
    });
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(
      blob({
        success: true,
        data: { ref_id: 'opaque', username: 'requester', is_active: true },
      }),
    );
    (
      await vi.waitFor(() => http.expectOne('/api/v1/auth/permissions/search'))
    ).flush(
      blob({
        success: true,
        result: {
          items: ['requests.start'],
          page: 1,
          size: 100,
          total: 1,
          total_pages: 1,
        },
      }),
    );
    await boot;
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/operations');
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const first = auth.revalidate();
    const second = auth.revalidate();
    expect(first).toBe(second);
    // An already-running read may finish with the old permission snapshot.
    (
      await vi.waitFor(() => http.expectOne('/api/v1/auth/permissions/search'))
    ).flush(
      blob({
        success: true,
        result: {
          items: ['requests.start'],
          page: 1,
          size: 100,
          total: 1,
          total_pages: 1,
        },
      }),
    );
    // The queued focus rereads without overlapping or aborting another read.
    (
      await vi.waitFor(() => http.expectOne('/api/v1/auth/permissions/search'))
    ).flush(
      blob({
        success: true,
        result: { items: [], page: 1, size: 100, total: 0, total_pages: 0 },
      }),
    );
    await Promise.all([first, second]);
    expect(auth.profile()?.username).toBe('requester');
    expect(TestBed.inject(SessionContext).snapshot()).toEqual({
      status: 'authenticated',
      permissions: [],
    });
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/forbidden');
  });
  it('resolves a missing cookie without calling protected APIs', async () => {
    const work = auth.bootstrap();
    (await vi.waitFor(() => http.expectOne('/session/status'))).flush({
      authenticated: false,
      csrfToken: null,
    });
    await work;
    expect(TestBed.inject(SessionContext).snapshot().status).toBe('signed-out');
  });
});
