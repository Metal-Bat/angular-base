import { inject, Injectable, signal } from '@angular/core';

export type ResolvedSession =
  | { readonly status: 'signed-out' }
  | {
      readonly status: 'authenticated';
      readonly permissions: readonly string[];
    };

export type SessionSnapshot =
  ResolvedSession | { readonly status: 'unresolved' };

import { ActorState } from './actor-state';

// Authoritative permissions loaded from the authenticated server session.
@Injectable({ providedIn: 'root' })
export class SessionContext {
  private readonly actorState = inject(ActorState);
  private readonly state = signal<SessionSnapshot>({ status: 'unresolved' });
  readonly snapshot = this.state.asReadonly();

  resolve(session: ResolvedSession): void {
    this.beginResolution();
    this.state.set(
      session.status === 'authenticated'
        ? { status: 'authenticated', permissions: [...session.permissions] }
        : { status: 'signed-out' },
    );
  }

  updatePermissions(permissions: readonly string[]): void {
    const current = this.state();
    if (current.status === 'authenticated') {
      if (current.permissions.join('\n') !== permissions.join('\n')) {
        this.actorState.reset();
      }
      this.state.set({
        status: 'authenticated',
        permissions: [...permissions],
      });
    }
  }

  clear(): void {
    try {
      this.actorState.reset();
    } finally {
      this.state.set({ status: 'signed-out' });
    }
  }

  beginResolution(): void {
    this.state.set({ status: 'unresolved' });
    this.actorState.reset();
  }
}
