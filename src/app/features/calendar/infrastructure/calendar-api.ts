import { inject, Injectable } from '@angular/core';
import { catchError, firstValueFrom, fromEvent, takeUntil } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiClient } from '../../../core/transport/api-client';
import { ApiFailure, record } from '../../../core/transport/api-failure';
import { CalendarSearchDenied } from '../application/calendar-port';
import {
  Page,
  readData,
  readResultPage,
} from '../../../core/transport/response-adapters';
import type { components } from '../../../core/transport/generated/schema';
import { CalendarEvent, eventValid } from '../domain/calendar-events';
export type CalendarItem = components['schemas']['CalendarItemDTO'];
export type CalendarInput = components['schemas']['CalendarInput'];
export type CalendarQuery = components['schemas']['CalendarQuery'];
export function calendarEvent(raw: unknown): {
  item: CalendarItem;
  event: CalendarEvent;
} {
  const row = record(raw);
  const schedule = record(row['schedule']);
  if (
    typeof row['ref_id'] !== 'string' ||
    typeof row['title'] !== 'string' ||
    typeof row['editable'] !== 'boolean' ||
    !['manual', 'work_item'].includes(String(row['source_kind']))
  ) {
    throw Error('Invalid calendar item');
  }
  const manual = row['source_kind'] === 'manual';
  if (
    row['route_key'] !== (manual ? 'calendar_events' : 'work_items') ||
    (schedule['kind'] === 'deadline') === manual ||
    (!manual && row['editable'])
  ) {
    throw Error('Invalid calendar source authority');
  }
  const base = {
    key: row['ref_id'],
    title: row['title'],
    source:
      row['source_kind'] === 'manual'
        ? ('personal' as const)
        : ('workflow' as const),
  };
  let event: CalendarEvent;
  switch (schedule['kind']) {
    case 'all_day':
      event = {
        ...base,
        kind: 'all_day',
        start: String(schedule['start_date']),
        end: String(schedule['end_date']),
      };
      break;
    case 'timed':
      event = {
        ...base,
        kind: 'timed',
        start: String(schedule['start_at']),
        end: String(schedule['end_at']),
        timezone: String(schedule['timezone']),
      };
      break;
    case 'deadline':
      event = {
        ...base,
        kind: 'deadline',
        start: String(schedule['due_at']),
        timezone: String(schedule['timezone']),
      };
      break;
    default:
      throw Error('Invalid calendar schedule');
  }
  if (!eventValid(event)) {
    throw Error('Invalid calendar interval');
  }
  return { item: raw as CalendarItem, event };
}
function readReminders(raw: unknown): components['schemas']['ReminderDTO'][] {
  if (!Array.isArray(raw) || raw.length > 100) {
    throw Error('Invalid reminders');
  }
  return raw.map((item) => {
    const row = record(item);
    if (
      typeof row['ref_id'] !== 'string' ||
      typeof row['due_at'] !== 'string' ||
      !['PENDING', 'SENT', 'CANCELLED', 'EXPIRED'].includes(
        String(row['status']),
      )
    ) {
      throw Error('Invalid reminder');
    }
    return item as components['schemas']['ReminderDTO'];
  });
}
@Injectable({ providedIn: 'root' })
export class CalendarApi {
  private readonly api = inject(ApiClient);
  private readonly actor = inject(ActorState);
  async search(
    body: CalendarQuery,
    signal?: AbortSignal,
  ): Promise<Page<{ item: CalendarItem; event: CalendarEvent }>> {
    signal?.throwIfAborted();
    const epoch = this.actor.epoch;
    const request = this.api
      .call('search_api_v1_calendar_events_search_post', { body })
      .pipe(
        catchError((error: unknown) => {
          throw error instanceof ApiFailure &&
            [401, 403].includes(error.httpStatus)
            ? new CalendarSearchDenied()
            : error;
        }),
      );
    const value = readResultPage(
      await firstValueFrom(
        signal ? request.pipe(takeUntil(fromEvent(signal, 'abort'))) : request,
      ),
      calendarEvent,
    );
    if (epoch !== this.actor.epoch) {
      throw new CalendarSearchDenied();
    }
    return value;
  }
  async detail(ref: string): Promise<CalendarItem> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call('detail_api_v1_calendar_events__ref_id__get', {
          path: { ref_id: ref },
        }),
      ),
      (raw) => calendarEvent(raw).item,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async save(body: CalendarInput, ref?: string): Promise<CalendarItem> {
    const epoch = this.actor.epoch;
    const response = ref
      ? await firstValueFrom(
          this.api.call('update_api_v1_calendar_events__ref_id__put', {
            path: { ref_id: ref },
            body,
          }),
        )
      : await firstValueFrom(
          this.api.call('create_api_v1_calendar_events_post', { body }),
        );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return readData(response, (raw) => calendarEvent(raw).item);
  }
  async remove(ref: string): Promise<void> {
    await firstValueFrom(
      this.api.call('delete_api_v1_calendar_events__ref_id__delete', {
        path: { ref_id: ref },
      }),
    );
  }
  async work(ref: string): Promise<{ ref_id: string; due_at: string | null }> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call('get_work_item_api_v1_work_items__ref_id__get', {
          path: { ref_id: ref },
        }),
      ),
      (raw) => {
        const row = record(raw);
        if (
          typeof row['ref_id'] !== 'string' ||
          (row['due_at'] !== null && typeof row['due_at'] !== 'string')
        ) {
          throw Error('Invalid work deadline');
        }
        return { ref_id: row['ref_id'], due_at: row['due_at'] };
      },
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async configure(
    ref: string,
    body: components['schemas']['ReminderInput'],
  ): Promise<components['schemas']['ReminderDTO'][]> {
    const epoch = this.actor.epoch;
    const result = readData(
      await firstValueFrom(
        this.api.call(
          'configure_reminders_api_v1_calendar_work_reminders__ref_id__put',
          { path: { ref_id: ref }, body },
        ),
      ),
      readReminders,
    );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return result;
  }
  async cancel(ref: string): Promise<void> {
    await firstValueFrom(
      this.api.call(
        'cancel_reminders_api_v1_calendar_work_reminders__ref_id__delete',
        { path: { ref_id: ref } },
      ),
    );
  }
  async reminders(
    item: CalendarItem,
  ): Promise<components['schemas']['ReminderDTO'][]> {
    const epoch = this.actor.epoch;
    const response =
      item.route_key === 'work_items'
        ? await firstValueFrom(
            this.api.call(
              'work_reminders_api_v1_calendar_work_reminders__ref_id__get',
              { path: { ref_id: item.ref_id } },
            ),
          )
        : await firstValueFrom(
            this.api.call(
              'event_reminders_api_v1_calendar_events__ref_id__reminders_get',
              { path: { ref_id: item.ref_id } },
            ),
          );
    if (epoch !== this.actor.epoch) {
      throw Error('Access changed');
    }
    return readData(response, readReminders);
  }
}
