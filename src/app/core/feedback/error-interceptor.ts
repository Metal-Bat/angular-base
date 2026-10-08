import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, tap, throwError } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { failure } from '../transport/api-failure';
import { RequestErrors } from './request-errors';

async function responseBody(body: unknown): Promise<unknown> {
  if (!(body instanceof Blob)) {
    return body;
  }
  try {
    return JSON.parse(await body.text()) as unknown;
  } catch {
    return null;
  }
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  if (
    !request.url.startsWith('/api/v1/') &&
    !request.url.startsWith('/session/')
  ) {
    return next(request);
  }
  const errors = inject(RequestErrors);
  const actor = inject(ActorState);
  const epoch = actor.epoch;
  return next(request).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && actor.epoch === epoch) {
        errors.envelope(
          event.status,
          event.body,
          event.headers.get('x-request-id'),
        );
      }
    }),
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }
      return from(responseBody(error.error)).pipe(
        mergeMap((body) => {
          // The session boundary also has public machine identifiers for its own failures.
          if (
            request.url.startsWith('/session/') &&
            typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof body.error === 'string' &&
            /^[A-Za-z][A-Za-z0-9_.:-]{0,127}$/.test(body.error)
          ) {
            body = { ...body, code: 'code' in body ? body.code : body.error };
          }
          if (actor.epoch === epoch) {
            errors.show(
              failure(error.status, body, error.headers.get('x-request-id')),
              request.url === '/session/login' && error.status === 401
                ? 'The username or password is incorrect.'
                : undefined,
            );
          }
          // Preserve the original error for the existing auth and feature handlers.
          return throwError(() => error);
        }),
      );
    }),
  );
};
