import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiFailure } from '../../../core/transport/api-failure';
import { WorkspaceApi } from './workspace-api';
import { Cartable, CaseRecord, CatalogItem } from '../domain/workspace-models';
@Injectable()
export class WorkspacePages {
  private readonly api = inject(WorkspaceApi);
  private readonly actor = inject(ActorState);
  private generation = 0;
  readonly catalog = signal<readonly CatalogItem[]>([]);
  readonly cases = signal<readonly CaseRecord[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly error = signal('');
  constructor() {
    const unregister = this.actor.register((): void => {
      this.generation++;
      this.catalog.set([]);
      this.cases.set([]);
      this.state.set('error');
      this.error.set('Access changed. Reload this page.');
    });
    inject(DestroyRef).onDestroy((): void => {
      this.generation++;
      unregister();
    });
  }
  async load(
    kind: 'catalog' | 'request' | 'task',
    page = 1,
    cartable: Cartable = 'available',
    abort?: AbortSignal,
  ): Promise<void> {
    const generation = ++this.generation;
    this.state.set('loading');
    this.error.set('');
    this.catalog.set([]);
    this.cases.set([]);
    try {
      if (kind === 'catalog') {
        const result = await this.api.catalog(page);
        if (generation !== this.generation) {
          return;
        }
        this.catalog.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
      } else {
        const result = await this.api.list(kind, page, cartable, abort);
        if (generation !== this.generation) {
          return;
        }
        this.cases.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
      }
      this.state.set('ready');
    } catch (error) {
      if (generation === this.generation) {
        if (abort?.aborted) {
          this.state.set('ready');
          return;
        }
        this.state.set('error');
        this.error.set(
          error instanceof ApiFailure
            ? error.message
            : 'The service is unavailable.',
        );
        if (abort) {
          throw error;
        }
      }
    }
  }
}
