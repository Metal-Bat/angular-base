import { errorInterceptor } from '../feedback/error-interceptor';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { RequestErrors } from '../feedback/request-errors';
import { decodeInbox, InboxApi } from './inbox-api';
describe('Unified inbox producer adapter', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }),
  );
  it('mark-read sends only the required empty command and retains current response refs', async () => {
    const api = TestBed.inject(InboxApi);
    const http = TestBed.inject(HttpTestingController);
    const work = api.read('current_ref');
    const request = await vi.waitFor(() =>
      http.expectOne('/api/v1/inbox/current_ref/read'),
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush(
      new Blob(
        [
          JSON.stringify({
            success: true,
            data: {
              schema_version: 1,
              ref_id: 'new_ref',
              subject: 'Notice',
              status: 'ACTIVE',
              created_at: '2026-10-09T00:00:00Z',
              read_at: '2026-10-09T01:00:00Z',
              content: null,
              target: {
                kind: 'account',
                route_key: 'me',
                available: true,
                ref_id: 'actor',
              },
            },
          }),
        ],
        { type: 'application/json' },
      ),
    );
    expect((await work).ref_id).toBe('new_ref');
    http.verify();
  });
  it('actor cleanup cancels the read and safe support metadata excludes private errors', async () => {
    const api = TestBed.inject(InboxApi);
    const http = TestBed.inject(HttpTestingController);
    const pending = api.detail('old');
    const rejected = expect(pending).rejects.toThrow();
    const old = await vi.waitFor(() => http.expectOne('/api/v1/inbox/old'));
    TestBed.inject(ActorState).reset();
    await rejected;
    expect(old.cancelled).toBe(true);
    const current = api.detail('missing');
    const failure = expect(current).rejects.toThrow();
    const missing = await vi.waitFor(() =>
      http.expectOne('/api/v1/inbox/missing'),
    );
    missing.flush(
      new Blob(
        [
          JSON.stringify({
            success: false,
            code: 1001,
            data: { secret: 'private' },
          }),
        ],
        { type: 'application/json' },
      ),
      {
        status: 503,
        statusText: 'Unavailable',
        headers: { 'x-request-id': 'support-reference' },
      },
    );
    await failure;
    expect(TestBed.inject(RequestErrors).notice()?.requestReference).toBe(
      'support-reference',
    );
    expect(
      JSON.stringify(TestBed.inject(RequestErrors).notice()),
    ).not.toContain('private');
    http.verify();
  });
  it('rejects arbitrary destination routes and references', () => {
    const raw = {
      schema_version: 1,
      ref_id: 'notice',
      subject: 'Notice',
      status: 'ACTIVE',
      created_at: '2026-10-09T00:00:00Z',
      read_at: null,
      content: null,
      target: {
        kind: 'account',
        route_key: 'https://attacker.example',
        available: true,
        ref_id: 'actor',
      },
    };
    expect(() => decodeInbox(raw)).toThrow();
    expect(() =>
      decodeInbox({
        ...raw,
        target: { ...raw.target, route_key: 'me', ref_id: '../../other' },
      }),
    ).toThrow();
  });
});
