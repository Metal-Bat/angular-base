import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, Observable, takeUntil, throwError } from 'rxjs';
import { Locale } from '../localization/locale';
import { ActorState } from './actor-state';
import { AuthSession } from './auth-session';

export const sessionInterceptor: HttpInterceptorFn = (request, next) => {
  const isApi = request.url.startsWith('/api/v1/');
  const isSession = request.url.startsWith('/session/');
  if (!isApi && !isSession) {
    return next(request);
  }
  const auth = inject(AuthSession);
  const actor = inject(ActorState);
  const locale = inject(Locale);
  const csrf = request.headers.get('x-csrf-token') ?? auth.csrf();
  let headers = request.headers
    .delete('Authorization')
    .set('Accept-Language', locale.language());
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.url !== '/session/login' &&
    csrf
  ) {
    headers = headers.set('x-csrf-token', csrf);
  }
  const epoch = actor.epoch;
  const aborted = new Observable<void>((subscriber) => {
    const signal = actor.abortSignal;
    const abort = (): void => {
      subscriber.next();
      subscriber.complete();
    };
    signal.addEventListener('abort', abort, { once: true });
    return (): void => signal.removeEventListener('abort', abort);
  });
  const result = next(request.clone({ headers, withCredentials: true })).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && epoch === actor.epoch) {
        if (error.status === 401 && request.url !== '/session/login') {
          auth.invalidate();
        }
        if (
          error.status === 403 &&
          isApi &&
          !request.url.includes('/auth/permissions/')
        ) {
          void auth.revalidate();
        }
      }
      return throwError(() => error);
    }),
  );
  return isApi ? result.pipe(takeUntil(aborted)) : result;
};
