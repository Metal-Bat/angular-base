import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../transport/api-client';
import { record } from '../transport/api-failure';
import { Page, readData, readResultPage } from '../transport/response-adapters';
import type { components } from '../transport/generated/inbox-contract';
export type InboxItem = components['schemas']['InboxDTO'];
export type InboxQuery = components['schemas']['InboxQuery'];
export const inboxStreamPath = '/api/v1/inbox/events';
function nullableString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}
const routes: Record<string, string | null> = {
  case: 'business_requests',
  work_item: 'work_items',
  ai_approval: 'work_items',
  report: 'reports',
  account: 'me',
  support: 'support_incidents',
  calendar: 'calendar_events',
  operation: 'processes',
};
function validTargetRoute(target: Record<string, unknown>): boolean {
  const kind = target['kind'];
  return (
    typeof kind === 'string' &&
    Object.hasOwn(routes, kind) &&
    (target['route_key'] === routes[kind] ||
      (kind === 'operation' &&
        target['available'] === false &&
        target['route_key'] === null))
  );
}
export function decodeInbox(raw: unknown): InboxItem {
  const item = record(raw);
  const target = record(item['target']);
  if (
    item['schema_version'] !== 1 ||
    typeof item['ref_id'] !== 'string' ||
    !/^[A-Za-z0-9_-]{1,256}$/.test(item['ref_id']) ||
    typeof item['subject'] !== 'string' ||
    typeof item['status'] !== 'string' ||
    typeof item['created_at'] !== 'string' ||
    !Number.isFinite(Date.parse(item['created_at'])) ||
    !nullableString(item['content']) ||
    !nullableString(item['read_at']) ||
    typeof target['available'] !== 'boolean'
  ) {
    throw Error('Invalid inbox response');
  }
  if (
    !validTargetRoute(target) ||
    (target['ref_id'] !== null &&
      (typeof target['ref_id'] !== 'string' ||
        !/^[A-Za-z0-9_-]{1,256}$/.test(target['ref_id']))) ||
    (target['available'] && !target['ref_id'])
  ) {
    throw Error('Invalid inbox destination');
  }
  return raw as InboxItem;
}
@Injectable({ providedIn: 'root' })
export class InboxApi {
  private readonly api = inject(ApiClient);
  async search(
    query: InboxQuery,
    signal?: AbortSignal,
    report = false,
  ): Promise<Page<InboxItem>> {
    return readResultPage(
      await firstValueFrom(
        this.api.call(
          report
            ? 'search_api_v1_inbox_report_post'
            : 'search_api_v1_inbox_search_post',
          { body: query },
          signal,
        ),
      ),
      decodeInbox,
    );
  }
  async unread(signal?: AbortSignal): Promise<number> {
    return readData(
      await firstValueFrom(
        this.api.call('unread_api_v1_inbox_unread_get', {}, signal),
      ),
      (raw) => {
        const total = record(raw)['total'];
        if (!Number.isSafeInteger(total) || Number(total) < 0) {
          throw Error('Invalid unread total');
        }
        return Number(total);
      },
    );
  }
  async detail(ref: string, signal?: AbortSignal): Promise<InboxItem> {
    return readData(
      await firstValueFrom(
        this.api.call(
          'detail_api_v1_inbox__ref_id__get',
          { path: { ref_id: ref } },
          signal,
        ),
      ),
      decodeInbox,
    );
  }
  async read(ref: string): Promise<InboxItem> {
    return readData(
      await firstValueFrom(
        this.api.call('mark_read_api_v1_inbox__ref_id__read_post', {
          path: { ref_id: ref },
          body: {},
        }),
      ),
      decodeInbox,
    );
  }
}
