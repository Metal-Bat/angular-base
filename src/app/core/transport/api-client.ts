import { ActorState } from '../auth/actor-state';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  catchError,
  defer,
  mergeMap,
  Observable,
  takeUntil,
  throwError,
} from 'rxjs';
import { failure } from './api-failure';
import type {
  ApiOperationId,
  Domain,
  DomainOperation,
  RequestInput,
  SuccessBody,
} from './api-types';
import type { endpoints } from './generated/operations';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly actor = inject(ActorState);
  private bindActor<T>(
    work: Observable<T>,
    signal = this.actor.abortSignal,
  ): Observable<T> {
    return work.pipe(
      takeUntil(
        new Observable<void>((subscriber) => {
          const abort = (): void => {
            subscriber.next();
            subscriber.complete();
          };
          if (signal.aborted) {
            abort();
            return;
          }
          signal.addEventListener('abort', abort, { once: true });
          return (): void => signal.removeEventListener('abort', abort);
        }),
      ),
    );
  }
  domain<D extends Domain>(
    area: D,
  ): {
    call<I extends DomainOperation<D>>(
      id: I,
      input: RequestInput<I>,
    ): Observable<HttpResponse<SuccessBody<I>>>;
  } {
    return {
      call: <I extends DomainOperation<D>>(
        id: I,
        input: RequestInput<I>,
      ): Observable<HttpResponse<SuccessBody<I>>> => {
        return this.bindActor(
          defer(() => import('./generated/operations')).pipe(
            mergeMap((module) => {
              if (module.endpoints[id].area !== area) {
                throw new Error('Operation belongs to another domain.');
              }
              return this.perform<I>(module.endpoints[id], input);
            }),
          ),
        );
      },
    };
  }
  call<I extends ApiOperationId>(
    id: I,
    input: RequestInput<I>,
    abort?: AbortSignal,
  ): Observable<HttpResponse<SuccessBody<I>>> {
    return this.bindActor(
      this.bindActor(
        defer(() => import('./generated/operations')).pipe(
          mergeMap((module) => this.perform<I>(module.endpoints[id], input)),
        ),
        abort,
      ),
    );
  }
  transfer<I extends ApiOperationId>(
    id: I,
    input: RequestInput<I>,
  ): Observable<HttpEvent<Blob>> {
    return this.bindActor(
      defer(() => import('./generated/operations')).pipe(
        mergeMap((module) => {
          const operation = module.endpoints[id];
          if (
            operation.responseType !== 'blob' &&
            operation.requestMedia !== 'multipart/form-data'
          ) {
            throw Error('Not a binary operation');
          }
          const { url, body } = this.requestData(operation, input);
          return this.http.request(operation.method, url, {
            body,
            observe: 'events',
            responseType: 'blob',
            reportProgress: true,
          });
        }),
      ),
    );
  }
  private requestData<I extends ApiOperationId>(
    operation: (typeof endpoints)[I],
    input: RequestInput<I>,
  ): { url: string; body: unknown } {
    let path: string = operation.path;
    const params = input.path as Record<string, unknown> | undefined;
    path = path.replace(
      /\{([^}]+)\}/g,
      (_match: string, key: string): string => {
        const value = params?.[key];
        if (typeof value !== 'string' && typeof value !== 'number') {
          throw new Error('Missing path parameter.');
        }
        return encodeURIComponent(String(value));
      },
    );
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(input.query ?? {})) {
      if (value !== undefined && value !== null) {
        for (const item of Array.isArray(value) ? value : [value]) {
          query.append(key, String(item));
        }
      }
    }
    const suffix = query.toString();
    let body: unknown = input.body;
    if (operation.requestMedia === 'multipart/form-data') {
      const form = new FormData();
      for (const [key, value] of Object.entries(
        body as Record<string, unknown>,
      )) {
        if (value !== undefined && value !== null) {
          form.append(key, value instanceof Blob ? value : String(value));
        }
      }
      body = form;
    }
    return { url: path + (suffix ? '?' + suffix : ''), body };
  }
  private perform<I extends ApiOperationId>(
    operation: (typeof endpoints)[I],
    input: RequestInput<I>,
  ): Observable<HttpResponse<SuccessBody<I>>> {
    const { url, body } = this.requestData(operation, input);
    return this.http
      .request(operation.method, url, {
        body,
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(
        // Blob transport preserves downloads and permits safe JSON/proxy error handling.
        mergeMap(async (response): Promise<HttpResponse<SuccessBody<I>>> => {
          const text =
            operation.responseType === 'blob'
              ? null
              : await response.body?.text();
          const value: unknown =
            operation.responseType === 'blob'
              ? response.body
              : text
                ? JSON.parse(text)
                : null;
          return response.clone({ body: value as SuccessBody<I> });
        }),
        catchError((error: unknown) => {
          if (!(error instanceof HttpErrorResponse)) {
            return throwError(() => error);
          }
          return new Observable<never>((subscriber) => {
            void (async (): Promise<void> => {
              let errorBody: unknown = error.error;
              if (errorBody instanceof Blob) {
                try {
                  errorBody = JSON.parse(await errorBody.text());
                } catch {
                  errorBody = null;
                }
              }
              subscriber.error(
                failure(
                  error.status,
                  errorBody,
                  error.headers.get('x-request-id'),
                ),
              );
            })();
          });
        }),
      );
  }
}
