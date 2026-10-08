import { expect, vi } from 'vitest';
import { HttpTestingController } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionContext, SessionSnapshot } from '../core/auth/session-context';

/** Complete the real initializer using only the test HTTP backend. */
export async function finishSessionBootstrap(
  session: SessionSnapshot,
): Promise<void> {
  const http = TestBed.inject(HttpTestingController);
  const status = http.expectOne('/session/status');
  if (session.status === 'unresolved') {
    status.flush(null, { status: 503, statusText: 'Service Unavailable' });
  } else if (session.status === 'signed-out') {
    status.flush({ authenticated: false });
  } else {
    status.flush({ authenticated: true, csrfToken: 'test-csrf' });
    const profile = await vi.waitFor(() => http.expectOne('/api/v1/auth/me'));
    profile.flush(
      new Blob([
        JSON.stringify({
          success: true,
          data: { ref_id: 'test-actor', username: 'Tester', is_active: true },
        }),
      ]),
    );
    const permissions = await vi.waitFor(() =>
      http.expectOne('/api/v1/auth/permissions/search'),
    );
    permissions.flush(
      new Blob([
        JSON.stringify({
          success: true,
          result: {
            items: session.permissions,
            page: 1,
            size: 100,
            total: session.permissions.length,
            total_pages: 1,
          },
        }),
      ]),
    );
  }
  await TestBed.inject(ApplicationInitStatus).donePromise;
  expect(TestBed.inject(SessionContext).snapshot()).toEqual(session);
  http.verify();
}
