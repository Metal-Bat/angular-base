import { HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import {
  ApiOperationId,
  RequestInput,
  SuccessBody,
} from '../../../core/transport/api-types';
import {
  Page,
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import { record } from '../../../core/transport/api-failure';
import { stringField } from './workspace-decoders';
import {
  PersonalServicesPort,
  ServiceItem,
  ServiceKind,
} from '../application/personal-services-port';
const query = (
  page: number,
): { page: number; size: number; filters: never[]; sort_orders: never[] } => ({
  page,
  size: 20,
  filters: [],
  sort_orders: [],
});
@Injectable({ providedIn: 'root' })
export class PersonalServices implements PersonalServicesPort {
  private readonly api = inject(ApiClient);
  private request<I extends ApiOperationId>(
    id: I,
    input: RequestInput<I>,
    signal?: AbortSignal,
  ): Promise<HttpResponse<SuccessBody<I>>> {
    if (signal?.aborted) {
      return Promise.reject(Error('Cancelled'));
    }
    const response = this.api.call(id, input);
    return firstValueFrom(
      signal ? response.pipe(takeUntil(fromEvent(signal, 'abort'))) : response,
    );
  }
  decode(kind: ServiceKind, raw: unknown): ServiceItem {
    const value = record(raw);
    return {
      ref: stringField(value, 'ref_id'),
      title: String(
        kind === 'reports'
          ? (value['file_name'] ?? value['definition_key'])
          : value['subject'],
      ),
      status: stringField(value, 'status'),
      request:
        typeof value['request_ref_id'] === 'string'
          ? value['request_ref_id']
          : null,
      process:
        typeof value['process_ref_id'] === 'string'
          ? value['process_ref_id']
          : null,
      content:
        kind === 'notifications'
          ? String(value['content'] ?? '')
          : String(value['error_code'] ?? ''),
      read: value['read_at'] !== null && value['read_at'] !== undefined,
      password:
        typeof value['zip_password'] === 'string'
          ? value['zip_password']
          : null,
    };
  }
  async list(
    kind: ServiceKind,
    page = 1,
    report = false,
    signal?: AbortSignal,
  ): Promise<Page<ServiceItem>> {
    const id =
      kind === 'reports'
        ? 'search_reports_api_v1_reports_search_post'
        : report
          ? 'report_notifications_api_v1_notifications_report_post'
          : 'search_notifications_api_v1_notifications_search_post';
    return readResultPage(
      await this.request(id, { body: query(page) }, signal),
      (raw) => this.decode(kind, raw),
    );
  }
  async detail(
    kind: ServiceKind,
    ref: string,
    signal?: AbortSignal,
  ): Promise<ServiceItem> {
    return readData(
      await this.request(
        kind === 'reports'
          ? 'get_report_api_v1_reports__ref_id__get'
          : 'notification_detail_api_v1_notifications__ref_id__get',
        { path: { ref_id: ref } },
        signal,
      ),
      (raw) => this.decode(kind, raw),
    );
  }
  async read(ref: string): Promise<ServiceItem> {
    return readData(
      await this.request(
        'mark_notification_read_api_v1_notifications__ref_id__read_post',
        { path: { ref_id: ref } },
      ),
      (raw) => this.decode('notifications', raw),
    );
  }
  async remove(ref: string): Promise<void> {
    const response = await this.request(
      'delete_report_api_v1_reports__ref_id__delete',
      { path: { ref_id: ref } },
    );
    if (response.status !== 204) {
      readData(response, () => undefined);
    }
  }
  async history(
    kind: 'request' | 'task' | 'report',
    ref: string,
    page: number,
  ): Promise<Page<{ revision: string; date: string; action: string }>> {
    const operations = {
      request: 'request_history_api_v1_business_requests__ref_id__history_post',
      task: 'work_item_history_api_v1_work_items__ref_id__history_post',
      report: 'report_history_api_v1_reports__ref_id__history_post',
    } as const;
    return readResultPage(
      await this.request(operations[kind], {
        path: { ref_id: ref },
        body: query(page),
      }),
      (raw) => {
        const value = record(raw);
        return {
          revision: String(value['version'] ?? ''),
          date: String(value['changed_at'] ?? value['created_at'] ?? ''),
          action: String(value['action'] ?? value['operation'] ?? ''),
        };
      },
    );
  }
}
