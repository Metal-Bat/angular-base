import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { AuthSession } from '../auth/auth-session';
import { ApiClient } from '../transport/api-client';
import { record } from '../transport/api-failure';
import { readData } from '../transport/response-adapters';
/** The implemented setup projection is superuser-only; a support receipt grants no access. */
export const installationOperatorGuard: CanActivateFn = async () => {
  const api = inject(ApiClient);
  const auth = inject(AuthSession);
  const actor = inject(ActorState);
  const router = inject(Router);
  const epoch = actor.epoch;
  try {
    await auth.revalidate();
    if (epoch !== actor.epoch || !auth.profile()) {
      return router.parseUrl('/forbidden');
    }
    const operator = readData(
      await firstValueFrom(
        api.call('me_api_v1_auth_me_get', {}, actor.abortSignal),
      ),
      (raw) => record(raw)['is_superuser'] === true,
    );
    return epoch === actor.epoch && operator
      ? true
      : router.parseUrl('/forbidden');
  } catch {
    return router.parseUrl('/access-unavailable');
  }
};
