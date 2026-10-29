import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { ActorState } from '../../../core/auth/actor-state';
import { record } from '../../../core/transport/api-failure';
import { readData } from '../../../core/transport/response-adapters';
import {
  AgentMetadataPort,
  AgentModel,
  AgentProvider,
} from '../application/agent-metadata-port';
const boolean = (row: Record<string, unknown>, key: string): boolean => {
  if (typeof row[key] !== 'boolean') {
    throw Error('Invalid agent metadata');
  }
  return row[key];
};
const string = (row: Record<string, unknown>, key: string): string => {
  if (typeof row[key] !== 'string') {
    throw Error('Invalid agent metadata');
  }
  return row[key];
};
const nullable = (row: Record<string, unknown>, key: string): string | null =>
  row[key] === null ? null : string(row, key);
@Injectable({ providedIn: 'root' })
export class AgentMetadataApi implements AgentMetadataPort {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  async provider(key: string): Promise<AgentProvider> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call(
        'provider_metadata_api_v1_ai_agents_providers__provider_key__metadata_get',
        { path: { provider_key: key } },
      ),
    );
    const value = readData(response, (raw) => {
      const row = record(raw);
      if (row['key'] !== key) {
        throw Error('Agent provider changed');
      }
      return {
        key,
        available: boolean(row, 'available'),
        unavailable_reason: nullable(row, 'unavailable_reason'),
        supports_tools: boolean(row, 'supports_tools'),
        supports_structured_output: boolean(row, 'supports_structured_output'),
        strict_spend_supported: boolean(row, 'strict_spend_supported'),
        governed_execution: boolean(row, 'governed_execution'),
      };
    });
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return value;
  }
  async model(connection: string, model: string): Promise<AgentModel> {
    const epoch = this.actor.epoch;
    const response = await firstValueFrom(
      this.api.call(
        'model_metadata_api_v1_ai_agents_connections__connection_ref__models__model_id__metadata_get',
        { path: { connection_ref: connection, model_id: model } },
      ),
    );
    const value = readData(response, (raw) => {
      const row = record(raw);
      if (
        row['connection_ref'] !== connection ||
        row['model_id'] !== model ||
        row['source'] !== 'configured'
      ) {
        throw Error('Agent model changed');
      }
      return {
        connection_ref: connection,
        connection_name: string(row, 'connection_name'),
        model_id: model,
        provider: string(row, 'provider'),
        source: 'configured' as const,
        can_execute: boolean(row, 'can_execute'),
        supports_tools: boolean(row, 'supports_tools'),
        supports_structured_output: boolean(row, 'supports_structured_output'),
        region: nullable(row, 'region'),
        provider_retention: string(row, 'provider_retention'),
      };
    });
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return value;
  }
}
