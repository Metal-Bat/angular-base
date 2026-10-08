import {
  HttpErrorResponse,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from './api-client';
import { ApiOperationId, RequestInput } from './api-types';
import { failure } from './api-failure';
export function safeFilename(value: string): string {
  return (
    Array.from(value, (character) =>
      character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
        ? '_'
        : character,
    )
      .join('')
      .replace(/[\u202a-\u202e\u2066-\u2069/\\:*?"<>|]/g, '_')
      .slice(0, 180)
      .replace(/^\.+/, '_') || 'download'
  );
}
export function responseFilename(disposition: string | null): string {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return safeFilename(decodeURIComponent(encoded));
    } catch {
      /* use bounded fallback */
    }
  }
  return safeFilename(
    disposition?.match(/filename="([^"]*)"/i)?.[1] ?? 'download',
  );
}
@Injectable()
export class BinaryTransfer {
  private readonly api = inject(ApiClient);
  readonly progress = signal<number | null>(null);
  readonly busy = signal(false);
  private subscription: Subscription | null = null;
  private cancelPending: (() => void) | null = null;
  private readonly urls = new Set<string>();
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      release();
      this.clear();
    });
  }
  run<I extends ApiOperationId>(
    id: I,
    input: RequestInput<I>,
  ): Promise<HttpResponse<Blob>> {
    if (this.busy()) {
      return Promise.reject(Error('A transfer is already running'));
    }
    this.busy.set(true);
    this.progress.set(null);
    return new Promise((resolve, reject) => {
      const finish = (): void => {
        this.busy.set(false);
        this.cancelPending = null;
      };
      this.cancelPending = (): void => {
        finish();
        reject(Error('Transfer cancelled'));
      };
      this.subscription = this.api.transfer(id, input).subscribe({
        next: (event) => {
          if (
            event.type === HttpEventType.UploadProgress ||
            event.type === HttpEventType.DownloadProgress
          ) {
            this.progress.set(
              event.total
                ? Math.min(100, Math.round((event.loaded * 100) / event.total))
                : null,
            );
          }
          if (event instanceof HttpResponse) {
            finish();
            resolve(event);
          }
        },
        error: (error: unknown): void => {
          finish();
          void (async (): Promise<void> => {
            if (!(error instanceof HttpErrorResponse)) {
              reject(error);
              return;
            }
            let body: unknown = error.error;
            if (body instanceof Blob) {
              try {
                body = JSON.parse(await body.text());
              } catch {
                body = null;
              }
            }
            reject(
              failure(error.status, body, error.headers.get('x-request-id')),
            );
          })();
        },
        complete: (): void => {
          if (this.busy()) {
            this.cancelPending?.();
          }
        },
      });
    });
  }
  cancel(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.cancelPending?.();
  }
  download(response: HttpResponse<Blob>): void {
    if (!response.body) {
      throw Error('Empty download');
    }
    const url = URL.createObjectURL(response.body);
    this.urls.add(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = responseFilename(
      response.headers.get('content-disposition'),
    );
    link.click();
    setTimeout((): void => {
      if (this.urls.delete(url)) {
        URL.revokeObjectURL(url);
      }
    }, 1000);
  }
  private clear(): void {
    this.cancel();
    this.progress.set(null);
    for (const url of this.urls) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }
}
