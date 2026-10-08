import { computed, DestroyRef, inject, signal } from '@angular/core';
import {
  emptyQuery,
  ListQuery,
  queryBody,
} from '../../../../shared/domain/list-query';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { ResourceKey } from '../../domain/authoring';
import { resourceLabel } from './resource-values';
import { CatalogState } from './catalog-state';
export class CatalogParents extends CatalogState {
  readonly parentCatalog = (
    {
      'form-versions': 'forms',
      'workflow-versions': 'workflows',
      'client-releases': 'clients',
      'form-component-versions': 'form-components',
      'form-data-type-versions': 'form-data-types',
    } as Partial<Record<ResourceKey, ResourceKey>>
  )[this.key];
  readonly parentSpec = this.parentCatalog
    ? this.api.spec(this.parentCatalog)
    : null;
  readonly parentModal = signal(false);
  readonly parentBusy = signal(false);
  readonly parentItems = signal<readonly JsonObject[]>([]);
  readonly parentQuery = signal<ListQuery>(emptyQuery());
  readonly parentPages = signal(0);
  readonly parentLabel = signal('');
  readonly parentError = signal('');
  readonly canScope = computed(() =>
    this.spec.queryFields.every(
      (field) =>
        typeof this.query()[field.key] === 'string' &&
        String(this.query()[field.key]).length > 0,
    ),
  );
  private parentGeneration = 0;
  constructor() {
    super();
    const release = this.actor.register(() => this.clearParents());
    inject(DestroyRef).onDestroy(() => {
      this.clearParents();
      release();
    });
    const reference = this.query()[this.spec.queryFields[0]?.key];
    if (this.parentCatalog && typeof reference === 'string') {
      const epoch = this.actor.epoch;
      void this.api
        .get(this.parentCatalog, reference)
        .then((row) => {
          if (this.actor.epoch === epoch) {
            this.parentLabel.set(resourceLabel(row));
          }
        })
        .catch(() => {});
    }
  }
  private clearParents(): void {
    this.parentGeneration++;
    this.parentModal.set(false);
    this.parentBusy.set(false);
    this.parentItems.set([]);
    this.parentLabel.set('');
    this.parentQuery.set(emptyQuery());
    this.parentError.set('');
  }
  chooseParents(): void {
    this.parentModal.set(true);
    void this.loadParents(emptyQuery());
  }
  async loadParents(query = this.parentQuery()): Promise<void> {
    if (!this.parentCatalog) {
      return;
    }
    const generation = ++this.parentGeneration;
    this.parentBusy.set(true);
    this.parentError.set('');
    try {
      const page = await this.api.search(
        this.parentCatalog,
        query.page,
        queryBody(query) as JsonObject,
      );
      if (generation !== this.parentGeneration) {
        return;
      }
      this.parentItems.set(page.items);
      this.parentQuery.set({ ...structuredClone(query), page: page.page });
      this.parentPages.set(page.totalPages);
    } catch {
      if (generation === this.parentGeneration) {
        this.parentError.set(
          'The catalog is unavailable. Check required filters and permissions.',
        );
      }
    } finally {
      if (generation === this.parentGeneration) {
        this.parentBusy.set(false);
      }
    }
  }
  parentPageTo(page: number): void {
    void this.loadParents({ ...this.parentQuery(), page });
  }
  chooseParent(row: Record<string, unknown>): void {
    const field = this.spec.queryFields[0];
    if (!field || typeof row['ref_id'] !== 'string') {
      return;
    }
    this.query.set({ [field.key]: row['ref_id'] });
    this.parentLabel.set(resourceLabel(row as JsonObject));
    this.parentModal.set(false);
    this.appliedQuery.set(null);
    this.listQuery.set(emptyQuery());
    this.items.set([]);
    this.reset();
    this.applyScope();
  }
}
