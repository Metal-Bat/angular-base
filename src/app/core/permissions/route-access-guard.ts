import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';

import { hasPermissions } from './area-access';
import { safeReturnPath } from '../auth/safe-return-path';
import { SessionContext } from '../auth/session-context';

export type RouteAccessPolicy = 'planning-preview' | 'authenticated';

// Missing/invalid policies deny access. Only the static area home may be public.
export const routeAccessGuard: CanActivateChildFn = (route, state) => {
  const router = inject(Router);
  const policy: unknown = route.routeConfig?.data?.['access'];
  if (policy === 'planning-preview' && route.routeConfig?.path === '') {
    return true;
  }
  if (policy !== 'authenticated') {
    return router.parseUrl('/forbidden');
  }

  const session = inject(SessionContext).snapshot();
  if (session.status === 'unresolved') {
    return router.parseUrl('/access-unavailable');
  }
  if (session.status === 'signed-out') {
    return router.createUrlTree(['/login'], {
      queryParams: { returnTo: safeReturnPath(state.url) },
    });
  }

  const required: unknown = route.routeConfig?.data?.['requiredPermissions'];
  if (
    !Array.isArray(required) ||
    !required.every((value: unknown) => typeof value === 'string')
  ) {
    return router.parseUrl('/forbidden');
  }
  const any: unknown = route.routeConfig?.data?.['anyPermissions'] ?? [];
  if (
    !Array.isArray(any) ||
    !any.every((value: unknown) => typeof value === 'string')
  ) {
    return router.parseUrl('/forbidden');
  }
  return hasPermissions(session.permissions, required, any)
    ? true
    : router.parseUrl('/forbidden');
};
