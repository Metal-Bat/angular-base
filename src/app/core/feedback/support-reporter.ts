import { HttpClient, HttpContext } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { SessionContext } from '../auth/session-context';
import { readData } from '../transport/response-adapters';
import { record } from '../transport/api-failure';
import {
  isSupportReference,
  SUPPORT_INTAKE,
  SupportReceipt,
} from './support-context';
export { SUPPORT_INTAKE, isSupportReference } from './support-context';
export type { SupportReceipt } from './support-context';
import type { components } from '../transport/generated/schema';
type ClientFailure = components['schemas']['ClientFailure'];
@Injectable({ providedIn: 'root' })
export class SupportReporter {
  private readonly http = inject(HttpClient);
  private readonly actor = inject(ActorState);
  private readonly session = inject(SessionContext);
  private readonly router = inject(Router, { optional: true });
  private readonly seen = new Map<string, number>();
  private attempts = 0;
  private window = 0;
  constructor() {
    const release = this.actor.register(() => {
      this.seen.clear();
      this.attempts = 0;
      this.window = 0;
    });
    inject(DestroyRef).onDestroy(release);
  }
  private screen(): ClientFailure['screen_key'] {
    const url = this.router?.url.split('?')[0] ?? '';
    if (url.startsWith('/operations/calendar')) {
      return 'calendar';
    }
    if (url.startsWith('/operations/tasks')) {
      return 'work_items';
    }
    if (url.startsWith('/operations/requests')) {
      return 'requests';
    }
    if (url.startsWith('/studio/')) {
      return 'designer';
    }
    if (url.startsWith('/operations/reports')) {
      return 'reports';
    }
    if (url.startsWith('/account')) {
      return 'preferences';
    }
    return 'support';
  }
  async report(
    code: ClientFailure['error_code'],
    requestId?: string | null,
  ): Promise<SupportReceipt | null> {
    if (this.session.snapshot().status !== 'authenticated') {
      return null;
    }
    const now = Date.now();
    const screen = this.screen();
    const key = screen + ':' + code;
    if (now - this.window >= 60000) {
      this.window = now;
      this.attempts = 0;
      this.seen.clear();
    }
    if (this.attempts >= 5 || now - (this.seen.get(key) ?? 0) < 10000) {
      return null;
    }
    this.attempts++;
    this.seen.set(key, now);
    const epoch = this.actor.epoch;
    const body: ClientFailure = {
      screen_key: screen,
      build: 'frontend-0.2.0',
      error_code: code,
      request_id: isSupportReference(requestId)
        ? requestId
        : crypto.randomUUID(),
    };
    try {
      const response = await firstValueFrom(
        this.http
          .post<unknown>('/api/v1/support/client-failures', body, {
            observe: 'response',
            context: new HttpContext().set(SUPPORT_INTAKE, true),
          })
          .pipe(timeout(10000)),
      );
      const result = readData(response, (raw) => {
        const row = record(raw);
        if (
          typeof row['persisted'] !== 'boolean' ||
          (row['support_ref'] !== null &&
            !isSupportReference(row['support_ref']))
        ) {
          throw Error('Invalid receipt');
        }
        return raw as SupportReceipt;
      });
      return epoch === this.actor.epoch ? result : null;
    } catch {
      return epoch === this.actor.epoch
        ? { persisted: false, support_ref: null }
        : null;
    }
  }
}
