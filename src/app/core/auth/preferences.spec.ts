import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Preferences } from './preferences';
import { AuthSession } from './auth-session';
import { SessionContext } from './session-context';

const endpoint = '/api/v1/me/preferences';
const data = (
  ref = 'current-1',
  theme = 'blue',
  mode = 'light',
  language = 'en',
): { success: boolean; data: Record<string, unknown> } => ({
  success: true,
  data: {
    ref_id: ref,
    schema_version: 1,
    appearance: { theme_key: theme, theme_mode: mode, density: 'compact' },
    locale: {
      language,
      timezone: 'Asia/Tehran',
      calendar: 'gregory',
      numbering: 'latn',
    },
    workspace: { landing_key: 'studio', page_size: 25 },
    notifications: { email_enabled: true },
  },
});

describe('Server-owned display preferences', () => {
  let preferences: Preferences;
  let http: HttpTestingController;
  const profile = signal<{ ref: string; username: string } | null>(null);
  beforeEach(() => {
    profile.set({ ref: 'actor-a', username: 'a' });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSession, useValue: { profile } },
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: [],
    });
    preferences = TestBed.inject(Preferences);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
  });
  afterEach(() => {
    http.verify();
    document.documentElement.classList.remove('app-dark');
    delete document.documentElement.dataset['palette'];
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });
  async function loaded(): Promise<void> {
    http.expectOne(endpoint).flush(data());
    await vi.waitFor(() => expect(preferences.status()).toBe('saved'));
  }
  it('restores saved palette and locale after actor bootstrap', async () => {
    http.expectOne(endpoint).flush(data('current-2', 'violet', 'dark', 'fa'));
    await vi.waitFor(() => expect(preferences.status()).toBe('saved'));
    expect(preferences.scheme.selected()).toBe('violet-dark');
    expect(preferences.locale.language()).toBe('fa');
    expect(document.documentElement.dir).toBe('rtl');
  });
  it('serializes rapid selections using returned references and patches only selected fields', async () => {
    await loaded();
    preferences.theme('rose-dark');
    const first = http.expectOne(endpoint);
    expect(first.request.method).toBe('PATCH');
    expect(first.request.body).toEqual({
      ref_id: 'current-1',
      appearance: { theme_key: 'rose', theme_mode: 'dark' },
    });
    preferences.theme('teal-light');
    await preferences.language('fa');
    first.flush(data('current-2', 'rose', 'dark'));
    const next = await vi.waitFor(() => http.expectOne(endpoint));
    expect(next.request.body).toEqual({
      ref_id: 'current-2',
      appearance: { theme_key: 'teal', theme_mode: 'light' },
      locale: { language: 'fa' },
    });
    next.flush(data('current-3', 'teal', 'light', 'fa'));
    await vi.waitFor(() => expect(preferences.status()).toBe('saved'));
    expect(preferences.scheme.selected()).toBe('teal-light');
  });
  it('keeps local changes on conflict and requires an explicit read before another write', async () => {
    await loaded();
    preferences.theme('rose-dark');
    http.expectOne(endpoint).flush({}, { status: 409, statusText: 'Conflict' });
    await vi.waitFor(() => expect(preferences.status()).toBe('error'));
    preferences.theme('teal-dark');
    http.expectNone(endpoint);
    expect(preferences.scheme.selected()).toBe('teal-dark');
    const reload = preferences.load();
    http.expectOne(endpoint).flush(data('fresh', 'emerald'));
    await reload;
    expect(preferences.scheme.selected()).toBe('emerald-light');
    preferences.theme('blue-dark');
    const next = http.expectOne(endpoint);
    expect(next.request.body.ref_id).toBe('fresh');
    next.flush(data('next', 'blue', 'dark'));
    await vi.waitFor(() => expect(preferences.status()).toBe('saved'));
  });
  it('discards a late read after logout rather than applying another actor preferences', async () => {
    const read = http.expectOne(endpoint);
    profile.set(null);
    TestBed.inject(SessionContext).clear();
    read.flush(data('old', 'rose', 'dark', 'fa'));
    await Promise.resolve();
    TestBed.tick();
    expect(preferences.scheme.selected()).toBe('blue-light');
    expect(preferences.locale.language()).toBe('en');
    expect(preferences.status()).toBe('idle');
  });
  it('does not send unsupported Arabic to the backend or persist browser credentials', async () => {
    await loaded();
    await preferences.language('ar');
    expect(preferences.locale.language()).toBe('ar');
    expect(preferences.sessionLanguage()).toBe(true);
    http.expectNone(endpoint);
  });
  it('does not apply malformed or failed preference reads', async () => {
    http.expectOne(endpoint).flush(data('bad', 'unapproved'));
    await vi.waitFor(() => expect(preferences.status()).toBe('error'));
    expect(preferences.scheme.selected()).toBe('blue-light');
    preferences.theme('unknown-css');
    expect(preferences.scheme.selected()).toBe('blue-light');
    http.expectNone(endpoint);
  });
});
