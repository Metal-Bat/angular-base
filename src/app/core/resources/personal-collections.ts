import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from '../transport/api-client';
import { record } from '../transport/api-failure';
import { Page, readData, readResultPage } from '../transport/response-adapters';
import { jsonObject } from '../../shared/domain/json-value';
import type { components } from '../transport/generated/schema';
export type SavedView = components['schemas']['SavedViewDTO'];
export type ViewInput = components['schemas']['SavedViewInput'];
export type Favorite = components['schemas']['FavoriteDTO'];
@Injectable({ providedIn: 'root' })
export class PersonalCollections {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  async views(page = 1): Promise<Page<SavedView>> {
    const epoch = this.actor.epoch;
    const result = readResultPage(
      await firstValueFrom(
        this.api.call('search_views_api_v1_me_saved_views_search_post', {
          body: { page, size: 100 },
        }),
      ),
      savedView,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async view(ref: string): Promise<SavedView> {
    const epoch = this.actor.epoch;
    const value = readData(
      await firstValueFrom(
        this.api.call('read_view_api_v1_me_saved_views__ref_id__get', {
          path: { ref_id: ref },
        }),
      ),
      savedView,
    );
    this.current(epoch);
    return value;
  }
  async save(body: ViewInput, ref?: string): Promise<SavedView> {
    const epoch = this.actor.epoch;
    const response = ref
      ? await firstValueFrom(
          this.api.call('update_view_api_v1_me_saved_views__ref_id__put', {
            path: { ref_id: ref },
            body,
          }),
        )
      : await firstValueFrom(
          this.api.call('create_view_api_v1_me_saved_views_post', { body }),
        );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return readData(response, savedView);
  }
  async apply(ref: string): Promise<components['schemas']['AppliedView']> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call('apply_view_api_v1_me_saved_views__ref_id__apply_post', {
          path: { ref_id: ref },
          body: {},
        }),
      ),
      appliedView,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    if (!result.compatible || !result.query) {
      throw Error('Incompatible saved view');
    }
    return result;
  }
  async remove(ref: string): Promise<void> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call('delete_view_api_v1_me_saved_views__ref_id__delete', {
        path: { ref_id: ref },
      }),
    );
    readData(response, empty);
    this.current(epoch);
  }
  async default(ref: string): Promise<SavedView> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call(
        'default_view_api_v1_me_saved_views__ref_id__default_post',
        { path: { ref_id: ref }, body: {} },
      ),
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return readData(response, savedView);
  }
  async favorites(page = 1): Promise<Page<Favorite>> {
    const epoch = this.actor.epoch;
    const result = readResultPage(
      await firstValueFrom(
        this.api.call('search_favorites_api_v1_me_favorites_search_post', {
          body: { page, size: 20 },
        }),
      ),
      (raw) => {
        const row = record(raw);
        const target = record(row['target']);
        if (
          typeof row['ref_id'] !== 'string' ||
          typeof target['label'] !== 'string' ||
          typeof target['locator'] !== 'string'
        ) {
          throw Error('Invalid favorite');
        }
        return raw as Favorite;
      },
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async favorite(body: components['schemas']['FavoriteInput']): Promise<void> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call('create_favorite_api_v1_me_favorites_post', { body }),
    );
    readData(response, favorite);
    this.current(epoch);
  }
  async unfavorite(ref: string): Promise<void> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call('delete_favorite_api_v1_me_favorites__ref_id__delete', {
        path: { ref_id: ref },
      }),
    );
    readData(response, empty);
    this.current(epoch);
  }
  private current(epoch: number): void {
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
  }
}

function empty(raw: unknown): null {
  if (raw !== null) {
    throw Error('Invalid empty response');
  }
  return null;
}
function appliedView(raw: unknown): components['schemas']['AppliedView'] {
  const row = record(raw);
  if (
    typeof row['compatible'] !== 'boolean' ||
    !['compatible', 'schema_changed'].includes(String(row['reason'])) ||
    !['business_requests', 'work_items', 'forms', 'workflows'].includes(
      String(row['resource_kind']),
    ) ||
    !Array.isArray(row['column_keys']) ||
    !row['column_keys'].every((key: unknown) => typeof key === 'string')
  ) {
    throw Error('Invalid saved view');
  }
  if (row['query'] !== null && row['query'] !== undefined) {
    jsonObject(row['query']);
  }
  return raw as components['schemas']['AppliedView'];
}
function savedView(raw: unknown): SavedView {
  const row = record(raw);
  appliedView(raw);
  if (
    typeof row['ref_id'] !== 'string' ||
    !row['ref_id'] ||
    typeof row['name'] !== 'string' ||
    typeof row['is_default'] !== 'boolean' ||
    !Number.isSafeInteger(row['schema_version']) ||
    !Number.isSafeInteger(row['page_size']) ||
    Number(row['page_size']) < 1 ||
    Number(row['page_size']) > 100 ||
    row['query'] === null ||
    row['query'] === undefined
  ) {
    throw Error('Invalid saved view');
  }
  return raw as SavedView;
}
function favorite(raw: unknown): Favorite {
  const row = record(raw);
  const target = record(row['target']);
  if (
    typeof row['ref_id'] !== 'string' ||
    typeof target['label'] !== 'string' ||
    typeof target['locator'] !== 'string'
  ) {
    throw Error('Invalid favorite');
  }
  return raw as Favorite;
}
