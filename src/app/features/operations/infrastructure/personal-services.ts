import { InboxApi, InboxItem } from '../../../core/notifications/inbox-api';
import { HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import {
  ApiOperationId,
  RequestBody,
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
  NotificationOptions,
  PersonalServicesPort,
  ServiceItem,
  ServiceKind,
} from '../application/personal-services-port';
const query = (
  page: number,
  options?: NotificationOptions,
): RequestBody<'search_reports_api_v1_reports_search_post'> => ({
  page,
  size: 20,
  filters: [
    ...(options?.read && options.read !== 'all'
      ? [
          {
            field_name: 'read_at',
            operation:
              options.read === 'unread'
                ? ('isNull' as const)
                : ('isNotNull' as const),
            value: null,
          },
        ]
      : []),
    ...(options?.search
      ? [
          {
            field_name: 'subject',
            operation: 'contains' as const,
            value: options.search,
          },
        ]
      : []),
  ],
  sort_orders: [],
});
@Injectable({ providedIn: 'root' })
export class PersonalServices implements PersonalServicesPort {
  private readonly api = inject(ApiClient);
  private readonly inbox = inject(InboxApi);
  private notification(value: InboxItem): ServiceItem {
    return {
      ref: value.ref_id,
      title: value.subject,
      status: value.status,
      content: value.content ?? '',
      createdAt: value.created_at,
      read: value.read_at !== null,
      request: null,
      process: null,
      password: null,
      target: {
        kind: value.target.kind,
        available: value.target.available,
        ref_id: value.target.ref_id ?? null,
      },
    };
  }
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
      createdAt:
        typeof value['created_at'] === 'string' ? value['created_at'] : null,
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
    options?: NotificationOptions,
  ): Promise<Page<ServiceItem>> {
    if (kind === 'notifications') {
      const result = await this.inbox.search(
        {
          ...query(page, options),
          unread: options?.read === 'all' ? null : options?.read === 'unread',
        },
        signal,
        report,
      );
      return {
        ...result,
        items: result.items.map((item) => this.notification(item)),
      };
    }
    const id = 'search_reports_api_v1_reports_search_post';
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
    if (kind === 'notifications') {
      return this.notification(await this.inbox.detail(ref, signal));
    }
    return readData(
      await this.request(
        'get_report_api_v1_reports__ref_id__get',
        { path: { ref_id: ref } },
        signal,
      ),
      (raw) => this.decode(kind, raw),
    );
  }
  async read(ref: string): Promise<ServiceItem> {
    return this.notification(await this.inbox.read(ref));
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
