import { HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import {
  ApiOperationId,
  RequestInput,
} from '../../../core/transport/api-types';
import { endpoints } from '../../../core/transport/generated/operations';
import { record } from '../../../core/transport/api-failure';
import {
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import { ListQuery, queryBody } from '../../../shared/domain/list-query';
import { RecordsPort } from '../application/records-port';
import {
  RecordDefinition,
  RecordPage,
  RecordRow,
  redactRecord,
} from '../domain/records';
@Injectable({ providedIn: 'root' })
export class RecordsApi implements RecordsPort {
  private readonly api = inject(ApiClient);
  private request(
    name: string,
    body?: RecordRow,
    path?: Record<string, string>,
    query?: Record<string, string>,
    abort?: AbortSignal,
  ): Promise<HttpResponse<unknown>> {
    if (!(name in endpoints)) {
      throw Error('Unsupported resource operation');
    }
    const id = name as ApiOperationId;
    return firstValueFrom(
      this.api.call(
        id,
        {
          ...(body ? { body } : {}),
          ...(path ? { path } : {}),
          ...(query ? { query } : {}),
        } as RequestInput<typeof id>,
        abort,
      ),
    );
  }
  async list(
    definition: RecordDefinition,
    query: ListQuery,
    path?: Record<string, string>,
    abort?: AbortSignal,
  ): Promise<RecordPage> {
    return readResultPage(
      await this.request(
        definition.operations.search,
        queryBody(
          query,
          definition.fixed,
          definition.extras.map((e) => e.key),
        ) as RecordRow,
        path,
        definition.selector ? { response_format: 'page' } : undefined,
        abort,
      ),
      (raw) => redactRecord(record(raw) as RecordRow) as RecordRow,
    );
  }
  async detail(
    definition: RecordDefinition,
    reference: string,
    abort?: AbortSignal,
  ): Promise<RecordRow> {
    if (!definition.operations.get) {
      throw Error('Detail is unavailable');
    }
    const response = await this.request(
      definition.operations.get,
      undefined,
      { ref_id: reference },
      undefined,
      abort,
    );
    // Owned report detail can include a transient download password. Other data is redacted.
    return readData(response, (raw) =>
      definition.key === 'reports'
        ? (record(raw) as RecordRow)
        : (redactRecord(record(raw) as RecordRow) as RecordRow),
    );
  }
  async command(
    operation: string,
    body?: RecordRow,
    path?: Record<string, string>,
  ): Promise<RecordRow | null> {
    return readData(await this.request(operation, body, path), (raw) =>
      raw === null
        ? null
        : (redactRecord(record(raw) as RecordRow) as RecordRow),
    );
  }
}
