import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiClient } from '../../../core/transport/api-client';
import { record } from '../../../core/transport/api-failure';
import { readData } from '../../../core/transport/response-adapters';
import type { components } from '../../../core/transport/generated/schema';
import { MetricProjection, metricWindow, readMetric } from '../domain/metrics';
export type MetricQuery = components['schemas']['MetricQuery'];
export type MetricDefinition = components['schemas']['MetricDefinition'];
@Injectable({ providedIn: 'root' })
export class AnalyticsApi {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  async catalog(): Promise<MetricDefinition[]> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call('catalog_api_v1_analytics_catalog_get', {}),
      ),
      (raw) => {
        if (!Array.isArray(raw) || raw.length > 32) {
          throw Error('Invalid metric catalog');
        }
        return raw.map((item) => {
          const row = record(item);
          if (
            row['version'] !== 1 ||
            typeof row['metric_key'] !== 'string' ||
            !['count', 'seconds'].includes(String(row['unit']))
          ) {
            throw Error('Invalid metric definition');
          }
          return item as MetricDefinition;
        });
      },
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async query(body: MetricQuery): Promise<MetricProjection> {
    metricWindow(body.start_date, body.end_date, body.timezone);
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call('query_metrics_api_v1_analytics_query_post', { body }),
      ),
      readMetric,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
}
