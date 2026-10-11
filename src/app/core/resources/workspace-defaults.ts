import { HttpClient } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { readData } from '../transport/response-adapters';
import { record } from '../transport/api-failure';
import { canEnterArea, hasPermissions } from '../permissions/area-access';
type Workspace = {
  page_size: number;
  landing_key: 'requests' | 'work_items' | 'studio' | 'dashboard';
};
@Injectable({ providedIn: 'root' })
export class WorkspaceDefaults {
  private readonly actor = inject(ActorState);
  readonly value = signal<Workspace | null>(null);
  constructor() {
    const release = this.actor.register(() => this.value.set(null));
    inject(DestroyRef).onDestroy(release);
  }
  accept(raw: unknown): void {
    const row = record(raw);
    if (
      !Number.isInteger(row['page_size']) ||
      Number(row['page_size']) < 1 ||
      Number(row['page_size']) > 100 ||
      !['requests', 'work_items', 'studio', 'dashboard'].includes(
        String(row['landing_key']),
      )
    ) {
      throw Error('Invalid workspace defaults');
    }
    this.value.set(raw as Workspace);
  }
  async load(http: HttpClient): Promise<void> {
    const epoch = this.actor.epoch;
    try {
      const settings = readData(
        await firstValueFrom(
          http
            .get<unknown>('/api/v1/me/preferences', { observe: 'response' })
            .pipe(timeout(15000)),
        ),
        record,
      );
      if (epoch === this.actor.epoch) {
        this.accept(settings['workspace']);
      }
    } catch {
      if (epoch === this.actor.epoch) {
        this.value.set(null);
      }
    }
  }
  size(): number {
    return this.value()?.page_size ?? 20;
  }
  destination(permissions: readonly string[]): string | null {
    const key = this.value()?.landing_key;
    if (key === 'studio') {
      return canEnterArea(permissions, 'studio') ? '/studio' : null;
    }
    if (!key || !hasPermissions(permissions, ['requests.start'])) {
      return null;
    }
    return {
      requests: '/operations/requests',
      work_items: '/operations/tasks',
      dashboard: '/operations/dashboard',
    }[key];
  }
}
