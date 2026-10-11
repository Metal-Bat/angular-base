import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from '../transport/api-client';
import { record } from '../transport/api-failure';
import { readData } from '../transport/response-adapters';
import type { components } from '../transport/generated/schema';
type Reference = components['schemas']['ResourceReference'];
export type ResourceLink = components['schemas']['ResourceLink'];
function link(raw: unknown): ResourceLink {
  const row = record(raw);
  if (
    typeof row['ref_id'] !== 'string' ||
    typeof row['label'] !== 'string' ||
    typeof row['locator'] !== 'string' ||
    row['available'] !== true ||
    row['route_key'] !== row['kind']
  ) {
    throw Error('Unavailable resource');
  }
  return raw as ResourceLink;
}
/** Public seam for selected summaries and stable resource locators, never execution authority. */
@Injectable({ providedIn: 'root' })
export class ResourceLinks {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  async mint(reference: Reference): Promise<ResourceLink> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call(
          'mint_link_api_v1_resource_links_post',
          {
            body: reference,
          },
          this.actor.abortSignal,
        ),
      ),
      link,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async resolve(locator: string): Promise<ResourceLink> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call(
          'resolve_link_api_v1_resource_links_resolve_post',
          {
            body: { locator },
          },
          this.actor.abortSignal,
        ),
      ),
      link,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async selected(
    resources: Reference[],
  ): Promise<components['schemas']['ResourceSummary'][]> {
    if (!resources.length || resources.length > 50) {
      throw Error('Unavailable selection');
    }
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call(
          'selected_api_v1_resource_links_selected_post',
          {
            body: { resources },
          },
          this.actor.abortSignal,
        ),
      ),
      (raw) => {
        if (!Array.isArray(raw) || raw.length !== resources.length) {
          throw Error('Unavailable selection');
        }
        return raw.map((value, index) => {
          const row = record(value);
          if (
            row['kind'] !== resources[index].kind ||
            row['available'] !== true ||
            typeof row['ref_id'] !== 'string' ||
            typeof row['label'] !== 'string'
          ) {
            throw Error('Unavailable selection');
          }
          return value as components['schemas']['ResourceSummary'];
        });
      },
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
}
