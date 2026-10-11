import { WorkspaceDefaults } from '../../../core/resources/workspace-defaults';
import { jsonObject } from '../../../shared/domain/json-value';
import { JsonObject } from '../../forms/domain/runtime-document';
import { ListNavigation } from '../../../core/resources/list-navigation';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiFailure } from '../../../core/transport/api-failure';
import { WorkspaceApi } from './workspace-api';
import { Cartable, CaseRecord, CatalogItem } from '../domain/workspace-models';
@Injectable()
export class WorkspacePages {
  private readonly api = inject(WorkspaceApi);
  private readonly actor = inject(ActorState);
  private readonly defaults = inject(WorkspaceDefaults);
  private generation = 0;
  private readonly navigation = inject(ListNavigation);
  readonly appliedQuery = signal<JsonObject | null>(null);
  readonly catalog = signal<readonly CatalogItem[]>([]);
  readonly cases = signal<readonly CaseRecord[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  readonly error = signal('');
  constructor() {
    const unregister = this.actor.register((): void => {
      this.generation++;
      this.appliedQuery.set(null);
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
  private snapshot(
    kind: 'request' | 'task',
    cartable: Cartable,
    query?: JsonObject,
  ): JsonObject {
    const incoming = this.navigation.take(
      kind === 'request' ? 'requests' : 'work_items',
    );
    const snapshot = jsonObject(
      query ??
        incoming ??
        this.appliedQuery() ??
        (kind === 'request'
          ? {
              page: 1,
              size: this.defaults.size(),
              scope: 'mine',
              filters: [],
              sort_orders: [],
            }
          : {
              page: 1,
              size: this.defaults.size(),
              cartable,
              time_field: 'created_at',
            }),
    );
    return kind === 'task' && !query && !incoming
      ? { ...snapshot, cartable }
      : snapshot;
  }
  async load(
    kind: 'catalog' | 'request' | 'task',
    page = 1,
    cartable: Cartable = 'available',
    abort?: AbortSignal,
    query?: JsonObject,
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
        const effective = this.snapshot(kind, cartable, query);
        const result = await this.api.list(
          kind,
          page,
          cartable,
          abort,
          effective,
        );
        if (generation === this.generation) {
          this.appliedQuery.set({ ...effective, page: result.page });
        }
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
