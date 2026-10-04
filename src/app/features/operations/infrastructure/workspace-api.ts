import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { record } from '../../../core/transport/api-failure';
import { ApiClient } from '../../../core/transport/api-client';
import {
  Page,
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import { JsonObject, JsonValue } from '../../forms/domain/runtime-document';
import {
  Cartable,
  CaseKind,
  CaseRecord,
  CatalogItem,
} from '../domain/workspace-models';
import { caseRecord, catalogItem, stringField } from './workspace-decoders';
@Injectable({ providedIn: 'root' })
export class WorkspaceApi {
  private readonly api = inject(ApiClient);
  async process(reference: string): Promise<{ status: string }> {
    return readData(
      await firstValueFrom(
        this.api.call('get_process_api_v1_processes__ref_id__get', {
          path: { ref_id: reference },
        }),
      ),
      (value) => ({ status: stringField(record(value), 'status') }),
    );
  }
  async catalog(page = 1): Promise<Page<CatalogItem>> {
    return readResultPage(
      await firstValueFrom(
        this.api.call(
          'search_eligible_request_types_api_v1_request_types_eligible_search_post',
          {
            body: {
              page,
              size: 20,
              supported_render_dialects: ['bpms.render/1'],
            },
          },
        ),
      ),
      catalogItem,
    );
  }
  async list(
    kind: CaseKind,
    page = 1,
    cartable: Cartable = 'available',
    abort?: AbortSignal,
  ): Promise<Page<CaseRecord>> {
    const response =
      kind === 'request'
        ? await firstValueFrom(
            this.api.call(
              'search_requests_api_v1_business_requests_search_post',
              { body: { page, size: 20, filters: [], sort_orders: [] } },
              abort,
            ),
          )
        : await firstValueFrom(
            this.api.call(
              'search_work_items_api_v1_work_items_search_post',
              {
                body: { page, size: 20, cartable },
              },
              abort,
            ),
          );
    return readResultPage(response, caseRecord);
  }
  async get(kind: CaseKind, reference: string): Promise<CaseRecord> {
    const response =
      kind === 'request'
        ? await firstValueFrom(
            this.api.call('get_request_api_v1_business_requests__ref_id__get', {
              path: { ref_id: reference },
            }),
          )
        : await firstValueFrom(
            this.api.call('get_work_item_api_v1_work_items__ref_id__get', {
              path: { ref_id: reference },
            }),
          );
    return readData(response, caseRecord);
  }
  async create(reference: string): Promise<CaseRecord> {
    return readData(
      await firstValueFrom(
        this.api.call('create_request_api_v1_business_requests_post', {
          body: { request_type_ref_id: reference, data: {} },
        }),
      ),
      caseRecord,
    );
  }
  async save(
    kind: CaseKind,
    reference: string,
    data: JsonObject,
    view: string,
    deleted: readonly string[],
    key: string | null,
  ): Promise<CaseRecord> {
    const response =
      kind === 'request'
        ? await firstValueFrom(
            this.api.call(
              'update_request_api_v1_business_requests__ref_id__put',
              { path: { ref_id: reference }, body: { data } },
            ),
          )
        : await firstValueFrom(
            this.api.call(
              'save_work_item_api_v1_work_items__ref_id__save_post',
              {
                path: { ref_id: reference },
                body: {
                  command_key: key!,
                  data,
                  view_key: view,
                  delete_paths: [...deleted],
                },
              },
            ),
          );
    return readData(response, caseRecord);
  }
  async submit(reference: string, key: string): Promise<CaseRecord> {
    return readData(
      await firstValueFrom(
        this.api.call(
          'submit_request_api_v1_business_requests__ref_id__submit_post',
          { path: { ref_id: reference }, body: { submit_key: key } },
        ),
      ),
      caseRecord,
    );
  }
  async lifecycle(
    reference: string,
    action: 'claim' | 'release' | 'start',
    key: string,
  ): Promise<CaseRecord> {
    const operation = {
      claim: 'claim_work_item_api_v1_work_items__ref_id__claim_post',
      release: 'release_work_item_api_v1_work_items__ref_id__release_post',
      start: 'start_work_item_api_v1_work_items__ref_id__start_post',
    } as const;
    return readData(
      await firstValueFrom(
        this.api.call(operation[action], {
          path: { ref_id: reference },
          body: { command_key: key },
        }),
      ),
      caseRecord,
    );
  }
  async decide(
    reference: string,
    action: 'complete' | 'reject' | 'return',
    key: string,
    data: JsonObject,
    view: string,
    deleted: readonly string[],
    outcome: string,
    comment: string,
  ): Promise<CaseRecord> {
    const operation = {
      complete: 'complete_work_item_api_v1_work_items__ref_id__complete_post',
      reject: 'reject_work_item_api_v1_work_items__ref_id__reject_post',
      return: 'return_work_item_api_v1_work_items__ref_id__return_post',
    } as const;
    return readData(
      await firstValueFrom(
        this.api.call(operation[action], {
          path: { ref_id: reference },
          body: {
            command_key: key,
            data,
            view_key: view,
            delete_paths: [...deleted],
            outcome_key: outcome,
            comment: comment || null,
            feedback: [],
          },
        }),
      ),
      caseRecord,
    );
  }
  async override(
    kind: CaseKind,
    reference: string,
    scope: string,
    operation: 'set' | 'reset',
    value: JsonValue,
    reason: string,
  ): Promise<unknown> {
    const endpoint =
      kind === 'request'
        ? 'override_calculation_api_v1_business_requests__ref_id__overrides_post'
        : 'override_calculation_api_v1_work_items__ref_id__overrides_post';
    return readData(
      await firstValueFrom(
        this.api.call(endpoint, {
          path: { ref_id: reference },
          body: { scope, operation, value, reason },
        }),
      ),
      (data) => data,
    );
  }
}
