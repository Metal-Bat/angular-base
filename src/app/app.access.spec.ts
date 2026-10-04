import { TestBed } from '@angular/core/testing';
import { Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { appConfig } from './app.config';
import { routes } from './app.routes';
import { SessionContext, SessionSnapshot } from './core/auth/session-context';
import { operationsRoutes } from './features/operations/presentation/operations.routes';

// Extend the real area route boundary with a protected test page; no fake login/provider ships.
function protectedRoutes(data: Record<string, unknown>): Routes {
  const area: Routes = [
    {
      ...operationsRoutes[0],
      children: [
        ...operationsRoutes[0].children!,
        {
          path: 'restricted',
          data,
          loadComponent: () =>
            import('./features/operations/presentation/operations-home').then(
              (m) => m.OperationsHome,
            ),
        },
      ],
    },
  ];
  return [
    {
      ...routes[0],
      children: routes[0].children!.map((route) =>
        route.path === 'operations'
          ? { ...route, loadChildren: (): Routes => area }
          : route,
      ),
    },
  ];
}

function configure(
  data: Record<string, unknown>,
  session: SessionSnapshot,
): void {
  TestBed.configureTestingModule({
    providers: appConfig.providers,
  });
  TestBed.inject(Router).resetConfig(protectedRoutes(data));
  if (session.status !== 'unresolved') {
    TestBed.inject(SessionContext).resolve(session);
  }
}

describe('Area access boundaries', () => {
  it.each([
    [{ status: 'unresolved' }, '/access-unavailable', 'Access unavailable'],
    [
      { status: 'signed-out' },
      '/login?returnTo=%2Foperations%2Frestricted',
      'Sign in',
    ],
    [
      { status: 'authenticated', permissions: ['requests.read'] },
      '/forbidden',
      'Access denied',
    ],
    [
      { status: 'authenticated', permissions: ['requests.manage'] },
      '/operations/restricted',
      'Operations',
    ],
  ] as const)(
    'resolves %j without flashing protected content',
    async (session, url, heading) => {
      configure(
        { access: 'authenticated', requiredPermissions: ['requests.manage'] },
        session,
      );
      const harness = await RouterTestingHarness.create(
        '/operations/restricted',
      );
      expect(TestBed.inject(Router).url).toBe(url);
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
        heading,
      );
      if (url !== '/operations/restricted') {
        expect(
          harness.routeNativeElement?.querySelector('app-operations-home'),
        ).toBeNull();
      }
    },
  );

  it.each([
    {},
    { access: 'unknown' },
    { access: 'authenticated' },
    { access: 'authenticated', requiredPermissions: [42] },
    { access: 'planning-preview' },
  ])(
    'fails closed for missing/invalid policy or public preview on a non-home path %j',
    async (data) => {
      configure(data, {
        status: 'authenticated',
        permissions: ['requests.manage'],
      });
      const harness = await RouterTestingHarness.create(
        '/operations/restricted',
      );
      expect(TestBed.inject(Router).url).toBe('/forbidden');
      expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
        'Access denied',
      );
    },
  );

  it('allows authenticated-only routes with explicitly empty permission requirements', async () => {
    configure(
      { access: 'authenticated', requiredPermissions: [] },
      { status: 'authenticated', permissions: [] },
    );
    await RouterTestingHarness.create('/operations/restricted');
    expect(TestBed.inject(Router).url).toBe('/operations/restricted');
  });

  it('denies a missing permission even if another required permission is granted', async () => {
    configure(
      {
        access: 'authenticated',
        requiredPermissions: ['requests.manage', 'forms.manage'],
      },
      { status: 'authenticated', permissions: ['requests.manage'] },
    );
    await RouterTestingHarness.create('/operations/restricted');
    expect(TestBed.inject(Router).url).toBe('/forbidden');
  });

  it('clears old permissions on session reset and denies the next protected navigation', async () => {
    configure(
      { access: 'authenticated', requiredPermissions: ['requests.manage'] },
      { status: 'authenticated', permissions: ['requests.manage'] },
    );
    const harness = await RouterTestingHarness.create('/operations/restricted');
    await harness.navigateByUrl('/operations');
    TestBed.inject(SessionContext).beginResolution();
    await harness.navigateByUrl('/operations/restricted');
    expect(TestBed.inject(Router).url).toBe('/access-unavailable');
    TestBed.inject(SessionContext).clear();
    await harness.navigateByUrl('/operations/restricted');
    expect(TestBed.inject(Router).url).toBe(
      '/login?returnTo=%2Foperations%2Frestricted',
    );
  });

  it('redirects signed-out area navigation to login with a local return path', async () => {
    configure(
      { access: 'authenticated', requiredPermissions: [] },
      { status: 'signed-out' },
    );
    const harness = await RouterTestingHarness.create('/operations');
    expect(TestBed.inject(Router).url).toBe('/login?returnTo=%2Foperations');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe(
      'Sign in',
    );
  });
});
