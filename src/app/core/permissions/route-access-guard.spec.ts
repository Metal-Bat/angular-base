import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Preferences } from '../auth/preferences';
import { SessionContext } from '../auth/session-context';
import { routeAccessGuard } from './route-access-guard';

const route = Object.assign(new ActivatedRouteSnapshot(), {
  routeConfig: {
    path: 'calendar',
    data: { access: 'authenticated', requiredPermissions: ['requests.start'] },
  },
});
const state = { url: '/operations/calendar' } as RouterStateSnapshot;
describe('Initial account defaults before route construction', () => {
  let finish: () => void;
  const ready = vi.fn();
  beforeEach(() => {
    ready.mockReset().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Preferences, useValue: { ready } },
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['requests.start'],
    });
  });
  it('waits for saved defaults and only then admits an authorized feature', async () => {
    const outcome = TestBed.runInInjectionContext(() =>
      routeAccessGuard(route, state),
    );
    let entered = false;
    void Promise.resolve(outcome).then(() => {
      entered = true;
    });
    await Promise.resolve();
    expect(entered).toBe(false);
    await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce());
    finish();
    expect(await outcome).toBe(true);
  });
  it('does not admit a revoked actor when the preference read finishes', async () => {
    const outcome = TestBed.runInInjectionContext(() =>
      routeAccessGuard(route, state),
    );
    await vi.waitFor(() => expect(ready).toHaveBeenCalledOnce());
    TestBed.inject(SessionContext).clear();
    finish();
    const result = await outcome;
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/access-unavailable',
    );
  });
  it('does not fetch account defaults as a substitute for a denied permission', () => {
    TestBed.inject(SessionContext).updatePermissions([]);
    const result = TestBed.runInInjectionContext(() =>
      routeAccessGuard(route, state),
    );
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/forbidden',
    );
    expect(ready).not.toHaveBeenCalled();
  });
});
