import { SessionContext } from './core/auth/session-context';
import { Title } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from './app.config';

describe('Workspace routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['*'],
    });
  });

  it('redirects the root to Operations', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(TestBed.inject(Router).url).toBe('/operations');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
      'Operations',
    );
  });

  it.each([
    ['/operations', 'Operations'],
    ['/studio', 'Studio'],
    ['/administration', 'Administration'],
  ])(
    'opens %s directly with its title and active navigation',
    async (url, heading) => {
      const harness = await RouterTestingHarness.create(url);
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
        heading,
      );
      expect(TestBed.inject(Title).getTitle()).toBe(
        `${heading} | Workflow workspace`,
      );
      const active = harness.routeNativeElement?.querySelector(
        'nav a[aria-current="page"]',
      );
      expect(active?.getAttribute('href')).toBe(url);
      expect(harness.routeNativeElement?.textContent).toContain(
        url === '/administration'
          ? 'Manage the configuration and access'
          : 'This area is being built.',
      );
    },
  );

  it('updates navigation when switching areas', async () => {
    const harness = await RouterTestingHarness.create('/operations');
    const studioLink =
      harness.routeNativeElement?.querySelector<HTMLAnchorElement>(
        'nav a[href="/studio"]',
      );
    studioLink?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/studio');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
      'Studio',
    );
    expect(
      harness.routeNativeElement?.querySelectorAll(
        'nav a[aria-current="page"]',
      ),
    ).toHaveLength(1);
  });

  it.each(['/missing', '/operations/missing'])(
    'handles unknown path %s and returns home',
    async (url) => {
      const harness = await RouterTestingHarness.create(url);
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
        'Page not found',
      );
      const returnLink =
        harness.routeNativeElement?.querySelector<HTMLAnchorElement>('main a');
      returnLink?.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe('/operations');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
        'Operations',
      );
    },
  );
});
