import { computed } from '@angular/core';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Locale } from './locale';
import { sessionInterceptor } from '../auth/session-interceptor';
import { ColorScheme } from '../theme/color-scheme';
describe('Locale and shared theme', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([sessionInterceptor])),
        provideHttpClientTesting(),
      ],
    });
  });
  afterEach(() => {
    document.documentElement.classList.remove('app-dark');
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  });
  it('switches translated labels and direction without modifying canonical drafts or opaque option keys', async () => {
    const canonical = {
      amount: '125.00',
      selected: 'opaque/option',
      outcome: 'APPROVE',
    };
    const before = structuredClone(canonical);
    const locale = TestBed.inject(Locale);
    await locale.set('fa');
    expect(document.documentElement.dir).toBe('rtl');
    expect(locale.text('Sign in')).toBe('ورود');
    expect(canonical).toEqual(before);
    expect(locale.text('opaque/option')).toBe('opaque/option');
    await locale.set('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
  it('uses the selected locale for subsequent server reads and preserves JSON request values', async () => {
    await TestBed.inject(Locale).set('fa');
    const work = firstValueFrom(
      TestBed.inject(HttpClient).post('/api/v1/fixture', { amount: '125.00' }),
    );
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne('/api/v1/fixture');
    expect(request.request.headers.get('accept-language')).toBe('fa');
    expect(request.request.body).toEqual({ amount: '125.00' });
    request.flush({});
    await work;
    http.verify();
  });
  it('changes both library themes through their common document selector without persistence', () => {
    const scheme = TestBed.inject(ColorScheme);
    scheme.toggle();
    expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    scheme.toggle();
    expect(scheme.dark()).toBe(false);
  });
  it('formats dates with an explicit time zone and Gregorian calendar and never normalizes input strings', async () => {
    const locale = TestBed.inject(Locale);
    expect(locale.date(new Date('2026-01-01T00:00:00Z'), 'UTC')).toContain(
      '2026',
    );
    await locale.set('fa');
    expect(locale.number(125)).not.toBe('125');
  });
});

describe('Extensible language selection', () => {
  afterEach(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });
  it('provides English, Persian and Arabic with native names and correct directions', async () => {
    const locale = TestBed.inject(Locale);
    expect(locale.languages.map((language) => language.code)).toEqual([
      'en',
      'fa',
      'ar',
    ]);
    await locale.set('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(locale.text('Language')).toBe('اللغة');
    expect(locale.text('Sign in')).toBe('تسجيل الدخول');
    expect(locale.text('Username')).toBe('اسم المستخدم');
    expect(locale.text('opaque/option')).toBe('opaque/option');
    expect(locale.contentLanguage()).toBe('en');
    await locale.set('fa');
    expect(locale.text('Username')).toBe('نام کاربری');
    expect(locale.contentLanguage()).toBe('fa');
    await locale.set('en');
    expect(locale.text('Username')).toBe('Username');
    expect(document.documentElement.dir).toBe('ltr');
  });
  it('updates reactive labels when the selected catalog changes', async () => {
    const locale = TestBed.inject(Locale);
    const label = computed(() => locale.text('Username'));
    expect(label()).toBe('Username');
    await locale.set('fa');
    expect(label()).toBe('نام کاربری');
    await locale.set('ar');
    expect(label()).toBe('اسم المستخدم');
    await locale.set('en');
    expect(label()).toBe('Username');
  });
  it('keeps the latest language and catalog when asynchronous switches overlap', async () => {
    const locale = TestBed.inject(Locale);
    await Promise.all([locale.set('fa'), locale.set('ar'), locale.set('en')]);
    expect(locale.language()).toBe('en');
    expect(locale.text('Sign in')).toBe('Sign in');
    await Promise.all([locale.set('fa'), locale.set('ar')]);
    expect(locale.language()).toBe('ar');
    expect(locale.text('Sign in')).toBe('تسجيل الدخول');
    expect(locale.changing()).toBe(false);
  });
});
