import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { SessionContext } from '../auth/session-context';
import { errorInterceptor } from './error-interceptor';
import { RequestErrors } from './request-errors';
import { SupportReporter } from './support-reporter';
describe('Bounded private client failure intake', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: [],
    });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('sends only the approved safe fields and distinguishes a durable incident from correlation', async () => {
    const reporter = TestBed.inject(SupportReporter);
    const pending = reporter.report(
      'client.render_failed',
      'private message or URL',
    );
    const request = TestBed.inject(HttpTestingController).expectOne(
      '/api/v1/support/client-failures',
    );
    expect(Object.keys(request.request.body).sort()).toEqual([
      'build',
      'error_code',
      'request_id',
      'screen_key',
    ]);
    expect(request.request.body.request_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(request.request.body)).not.toContain('private');
    request.flush({
      success: true,
      data: { persisted: false, support_ref: null },
    });
    expect(await pending).toEqual({ persisted: false, support_ref: null });
    expect(await reporter.report('client.render_failed')).toBeNull();
  });
  it('does not recursively report a failed sink or return an old-account receipt', async () => {
    const reporter = TestBed.inject(SupportReporter);
    const failed = reporter.report('client.network_failed');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/v1/support/client-failures')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(await failed).toEqual({ persisted: false, support_ref: null });
    expect(TestBed.inject(RequestErrors).notice()).toBeNull();
    const pending = reporter.report('client.unexpected_error');
    const request = TestBed.inject(HttpTestingController).expectOne(
      '/api/v1/support/client-failures',
    );
    TestBed.inject(ActorState).reset();
    request.flush({
      success: true,
      data: {
        persisted: true,
        support_ref: 'e77f2929-96a1-4d4b-9b50-138d0da34ef5',
      },
    });
    expect(await pending).toBeNull();
  });
});
