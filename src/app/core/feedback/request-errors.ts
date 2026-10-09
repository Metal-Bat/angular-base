import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../auth/actor-state';
import { ApiFailure, failure } from '../transport/api-failure';

export type ErrorNotice = {
  id: number;
  code: string;
  message: string;
  requestReference: string | null;
  kind:
    | 'validation'
    | 'forbidden'
    | 'stale'
    | 'uncertain'
    | 'technical'
    | 'failure';
};
export function safeRequestReference(value: unknown): string | null {
  return typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value)
    ? value
    : null;
}

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
    const raw = error.applicationCode;
    const code =
      typeof raw === 'number' && Number.isFinite(raw)
        ? String(raw)
        : typeof raw === 'string' &&
            /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(raw)
          ? raw
          : '';
    const reference = safeRequestReference(error.requestId);
    const kind = error.uncertain
      ? 'uncertain'
      : error.httpStatus === 403
        ? 'forbidden'
        : error.httpStatus === 409
          ? 'stale'
          : error.httpStatus === 422
            ? 'validation'
            : error.httpStatus >= 500 || error.httpStatus === 0
              ? 'technical'
              : 'failure';
    if (!code && !(reference && kind === 'technical')) {
      return;
    }
    this.current.set({
      id: ++this.sequence,
      code,
      message:
        message === error.message && kind === 'stale'
          ? 'This resource changed. Reload it before making another change.'
          : message === error.message && kind === 'validation'
            ? 'Check the highlighted fields before continuing.'
            : message,
      requestReference: reference,
      kind,
    });
  }

  dismiss(id: number): void {
    if (this.current()?.id === id) {
      this.current.set(null);
    }
  }
}
