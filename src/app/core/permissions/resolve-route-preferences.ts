import { Injector } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ActorState } from '../auth/actor-state';
import { Preferences } from '../auth/preferences';
import { SessionContext } from '../auth/session-context';
import { hasPermissions } from './area-access';

/** Lazily resolve account defaults without promoting preference/theme code into startup bundles. */
export async function resolveRoutePreferences(
  injector: Injector,
  epoch: number,
  required: readonly string[],
  any: readonly string[],
): Promise<boolean | UrlTree> {
  await injector.get(Preferences).ready();
  const current = injector.get(SessionContext).snapshot();
  const router = injector.get(Router);
  if (
    injector.get(ActorState).epoch !== epoch ||
    current.status !== 'authenticated'
  ) {
    return router.parseUrl('/access-unavailable');
  }
  return hasPermissions(current.permissions, required, any)
    ? true
    : router.parseUrl('/forbidden');
}
