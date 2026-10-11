import { DestroyRef, inject, Injectable } from '@angular/core';
import { ActorState } from '../auth/actor-state';
type Descriptor = {
  route_key: 'requests' | 'work_items';
  query: Record<string, unknown>;
};
/** One-use account-owned navigation state; private filters never enter a URL or storage. */
@Injectable({ providedIn: 'root' })
export class ListNavigation {
  private current: Descriptor | null = null;
  constructor() {
    const release = inject(ActorState).register(() => {
      this.current = null;
    });
    inject(DestroyRef).onDestroy(release);
  }
  set(value: Descriptor): void {
    this.current = structuredClone(value);
  }
  take(route: Descriptor['route_key']): Descriptor['query'] | null {
    if (this.current?.route_key !== route) {
      return null;
    }
    const value = this.current.query;
    this.current = null;
    return structuredClone(value);
  }
}
