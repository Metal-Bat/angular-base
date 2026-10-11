import { InjectionToken } from '@angular/core';
import { record } from '../transport/api-failure';
import { inboxStreamPath } from './inbox-api';
export type InboxConnection = Pick<
  EventSource,
  'addEventListener' | 'close' | 'onerror'
>;
export const INBOX_EVENTS = new InjectionToken<() => InboxConnection | null>(
  'INBOX_EVENTS',
  {
    providedIn: 'root',
    factory:
      (): (() => InboxConnection | null) => (): InboxConnection | null =>
        typeof EventSource === 'undefined'
          ? null
          : new EventSource(inboxStreamPath, { withCredentials: true }),
  },
);
export function changedRef(event: MessageEvent<string>): string {
  if (event.data.length > 1024) {
    throw Error('Invalid inbox signal');
  }
  const value = record(JSON.parse(event.data));
  const ref = value['notification_ref_id'];
  if (
    Object.keys(value).length !== 2 ||
    value['schema_version'] !== 1 ||
    typeof ref !== 'string' ||
    !/^[A-Za-z0-9_-]{1,256}$/.test(ref) ||
    event.lastEventId !== ref
  ) {
    throw Error('Invalid inbox signal');
  }
  return ref;
}
export function resyncReason(event: MessageEvent<string>): string {
  if (event.data.length > 1024) {
    throw Error('Invalid resync signal');
  }
  const value = record(JSON.parse(event.data));
  const reason = value['reason'];
  if (
    Object.keys(value).length !== 2 ||
    value['schema_version'] !== 1 ||
    typeof reason !== 'string' ||
    ![
      'connected',
      'reconnected',
      'periodic',
      'event_limit',
      'lifetime',
    ].includes(reason)
  ) {
    throw Error('Invalid resync signal');
  }
  return reason;
}
