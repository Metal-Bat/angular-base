import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActorState } from '../actor-state';
import { Profile } from './profile';

const blob = (body: unknown): Blob =>
  new Blob([JSON.stringify(body)], { type: 'application/json' });

describe('My information', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
  });

  it('reads the signed-in user from me and displays only personal information', async () => {
    const fixture = TestBed.createComponent(Profile);
    const http = TestBed.inject(HttpTestingController);
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(
      blob({
        success: true,
        data: {
          username: 'ali',
          first_name: 'Ali',
          last_name: 'Ahmadi',
          email: 'ali@example.test',
          is_active: true,
          is_superuser: false,
          created_at: '2026-10-04T08:00:00Z',
          ref_id: 'hidden-reference',
          password: 'hidden-password',
        },
      }),
    );
    await vi.waitFor(() =>
      expect(fixture.componentInstance.busy()).toBe(false),
    );
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Ali Ahmadi');
    expect(fixture.nativeElement.textContent).toContain('ali@example.test');
    expect(fixture.nativeElement.textContent).toContain('Active');
    expect(fixture.nativeElement.textContent).not.toMatch(/hidden-|Ref Id/);
    expect(
      fixture.nativeElement.querySelector('a[href="/account"]'),
    ).toBeTruthy();
    http.verify();
  });

  it('clears personal data and ignores a pending request after an actor reset', async () => {
    const fixture = TestBed.createComponent(Profile);
    const http = TestBed.inject(HttpTestingController);
    const request = await vi.waitFor(() => http.expectOne('/api/v1/auth/me'));
    TestBed.inject(ActorState).reset();
    await vi.waitFor(() =>
      expect(fixture.componentInstance.busy()).toBe(false),
    );
    await fixture.whenStable();
    expect(request.cancelled).toBe(true);
    expect(fixture.componentInstance.profile()).toBeNull();
    expect(fixture.componentInstance.error()).toBe('');
    http.verify();
  });

  it('offers retry after the me service fails', async () => {
    const fixture = TestBed.createComponent(Profile);
    const http = TestBed.inject(HttpTestingController);
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(
      blob({}),
      { status: 503, statusText: 'Unavailable' },
    );
    await vi.waitFor(() =>
      expect(fixture.componentInstance.busy()).toBe(false),
    );
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    fixture.nativeElement.querySelector('button').click();
    (await vi.waitFor(() => http.expectOne('/api/v1/auth/me'))).flush(
      blob({
        success: true,
        data: { username: 'ali', is_active: true, is_superuser: false },
      }),
    );
    await vi.waitFor(() =>
      expect(fixture.componentInstance.busy()).toBe(false),
    );
    await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('');
    expect(fixture.componentInstance.profile()?.['username']).toBe('ali');
    http.verify();
  });
});
