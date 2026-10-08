import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../auth/actor-state';
import { ApiFailure, failure } from '../transport/api-failure';

export type ErrorNotice = { id: number; code: string; message: string };

@Injectable({ providedIn: 'root' })
export class RequestErrors {
  private sequence = 0;
  private readonly current = signal<ErrorNotice | null>(null);
  readonly notice = this.current.asReadonly();

  constructor() {
    const release = inject(ActorState).register(() => this.current.set(null));
    inject(DestroyRef).onDestroy(release);
  }

  envelope(status: number, body: unknown, requestId: string | null): void {
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      body.success === false
    ) {
      this.show(failure(status, body, requestId));
    }
  }

  show(error: ApiFailure, message = error.message): void {
    const code = error.applicationCode;
    if (
      code === null ||
      (typeof code === 'number' && !Number.isFinite(code)) ||
      (typeof code === 'string' && !code.trim())
    ) {
      return;
    }
    this.current.set({
      id: ++this.sequence,
      code: String(code),
      message,
    });
  }

  dismiss(id: number): void {
    if (this.current()?.id === id) {
      this.current.set(null);
    }
  }
}
