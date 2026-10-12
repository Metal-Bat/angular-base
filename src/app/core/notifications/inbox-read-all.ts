import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../auth/actor-state';
import { InboxApi, InboxQuery } from './inbox-api';
import { NotificationPreview } from './notification-preview';

@Injectable({ providedIn: 'root' })
export class InboxReadAll {
  private readonly api = inject(InboxApi);
  private readonly actor = inject(ActorState);
  private readonly preview = inject(NotificationPreview);
  readonly busy = signal(false);
  readonly completed = signal(0);
  readonly message = signal('');
  readonly failed = signal(false);

  constructor() {
    const release = this.actor.register(() => {
      this.busy.set(false);
      this.completed.set(0);
      this.message.set('');
      this.failed.set(false);
    });
    inject(DestroyRef).onDestroy(release);
  }

  async run(): Promise<void> {
    if (this.busy()) {
      return;
    }
    const epoch = this.actor.epoch;
    const abort = this.actor.abortSignal;
    const current = (): boolean => this.actor.epoch === epoch;
    this.busy.set(true);
    this.completed.set(0);
    this.failed.set(false);
    this.message.set('Marking notifications as read…');
    try {
      const query: InboxQuery = {
        page: 1,
        size: 20,
        unread: true,
        sort_orders: [{ field_name: 'created_at', operation: 'desc' }],
      };
      let page = await this.api.search(query, abort);
      if (!current()) {
        return;
      }
      const limit = page.total;
      // Use server time from the newest persisted row; later arrivals stay unread.
      const newest = page.items[0]?.created_at;
      if (newest) {
        query.filters = [
          { field_name: 'created_at', operation: 'lte', value: newest },
        ];
      }
      let visited = 0;
      while (page.items.length) {
        for (const item of page.items) {
          if (!current()) {
            return;
          }
          if (++visited > limit) {
            throw Error('Inbox changed during mark-read');
          }
          const fresh = await this.api.detail(item.ref_id, abort);
          if (!current()) {
            return;
          }
          if (fresh.read_at === null) {
            const saved = await this.api.read(fresh.ref_id);
            if (!current()) {
              return;
            }
            if (saved.read_at === null) {
              throw Error('Read metadata missing');
            }
            this.completed.update((value) => value + 1);
          }
          this.preview.dismiss(item.ref_id);
        }
        // Always drain page one: successful reads shrink the unread result.
        page = await this.api.search(query, abort);
        if (!current()) {
          return;
        }
      }
      this.message.set('Existing notifications are marked as read.');
    } catch {
      if (current()) {
        this.failed.set(true);
        this.message.set(
          'Some notifications may remain unread. Refresh and try again.',
        );
      }
    } finally {
      if (current()) {
        await this.preview.load(1);
        if (current()) {
          this.busy.set(false);
        }
      }
    }
  }
}
