import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiClient } from '../../../core/transport/api-client';
import { record } from '../../../core/transport/api-failure';
import {
  Page,
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import {
  Incident,
  IncidentHistory,
  SupportPort,
} from '../application/support-port';
function incident(raw: unknown): Incident {
  const row = record(raw);
  if (
    typeof row['ref_id'] !== 'string' ||
    typeof row['support_ref'] !== 'string' ||
    !['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].includes(String(row['state'])) ||
    !Number.isSafeInteger(row['error_code']) ||
    !Number.isSafeInteger(row['occurrence_count'])
  ) {
    throw Error('Invalid incident');
  }
  return raw as Incident;
}
@Injectable({ providedIn: 'root' })
export class SupportApi implements SupportPort {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  async search(page: number): Promise<Page<Incident>> {
    const epoch = this.actor.epoch;
    const value = readResultPage(
      await firstValueFrom(
        this.api.call('search_api_v1_support_incidents_search_post', {
          body: { page, size: 20, filters: [], sort_orders: [] },
        }),
      ),
      incident,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return value;
  }
  async detail(ref: string): Promise<Incident> {
    const epoch = this.actor.epoch;
    const value = readData(
      await firstValueFrom(
        this.api.call('detail_api_v1_support_incidents__ref_id__get', {
          path: { ref_id: ref },
        }),
      ),
      incident,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return value;
  }
  async history(ref: string): Promise<readonly IncidentHistory[]> {
    const epoch = this.actor.epoch;
    const rows: IncidentHistory[] = [];
    for (let page = 1; page <= 10; page++) {
      const value = readResultPage(
        await firstValueFrom(
          this.api.call(
            'history_api_v1_support_incidents__ref_id__history_post',
            { path: { ref_id: ref }, body: { page, size: 100 } },
          ),
        ),
        (raw) => {
          const row = record(raw);
          if (
            typeof row['operation'] !== 'string' ||
            typeof row['changed_at'] !== 'string'
          ) {
            throw Error('Invalid history');
          }
          return raw as IncidentHistory;
        },
      );
      if (epoch !== this.actor.epoch) {
        throw Error('Access changed');
      }
      rows.push(...value.items);
      if (page >= value.totalPages) {
        return rows;
      }
    }
    throw Error('History is incomplete');
  }
  async act(ref: string, resolve: boolean): Promise<Incident> {
    const epoch = this.actor.epoch;
    const response = resolve
      ? await firstValueFrom(
          this.api.call(
            'resolve_api_v1_support_incidents__ref_id__resolve_post',
            { path: { ref_id: ref }, body: {} },
          ),
        )
      : await firstValueFrom(
          this.api.call(
            'acknowledge_api_v1_support_incidents__ref_id__acknowledge_post',
            { path: { ref_id: ref }, body: {} },
          ),
        );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return readData(response, incident);
  }
}
