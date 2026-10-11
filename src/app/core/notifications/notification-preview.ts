import { AuthSession } from '../auth/auth-session';
import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { ActorState } from '../auth/actor-state';
import { SessionContext } from '../auth/session-context';
import { InboxApi, InboxItem } from './inbox-api';
import {
  changedRef,
  INBOX_EVENTS,
  InboxConnection,
  resyncReason,
} from './inbox-events';
@Injectable({ providedIn: 'root' })
export class NotificationPreview {
  private readonly auth = inject(AuthSession);
  private readonly actor = inject(ActorState);
  private readonly context = inject(SessionContext);
  private readonly api = inject(InboxApi);
  private readonly connect = inject(INBOX_EVENTS);
  private generation = 0;
  private connection: InboxConnection | null = null;
  private reconnect: ReturnType<typeof setTimeout> | undefined;
  private periodic: ReturnType<typeof setInterval> | undefined;
  private retryMs = 3000;
  private abort = new AbortController();
  private pending: Promise<void> | null = null;
  private dirty = false;
  private baseline = false;
  private watermark = 0;
  private readonly seen = new Set<string>();
  private readonly candidates = new Set<string>();
  readonly status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly items = signal<readonly InboxItem[]>([]);
  readonly alerts = signal<readonly InboxItem[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly unreadCount = signal<number | null>(null);
  readonly revision = signal(0);
  constructor() {
    const release = this.actor.register(() => this.reset());
    effect(() => {
      const session = this.context.snapshot();
      untracked(() => {
        if (
          session.status === 'authenticated' &&
          !this.connection &&
          !this.reconnect
        ) {
          this.start();
        }
        if (session.status !== 'authenticated') {
          this.stop();
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.reset();
      release();
    });
  }
  private stop(): void {
    this.connection?.close();
    this.connection = null;
    clearTimeout(this.reconnect);
    this.reconnect = undefined;
    clearInterval(this.periodic);
    this.periodic = undefined;
    this.baseline = false;
  }
  private reset(): void {
    this.stop();
    this.abort.abort();
    this.abort = new AbortController();
    this.generation++;
    this.pending = null;
    this.dirty = false;
    this.watermark = 0;
    this.seen.clear();
    this.candidates.clear();
    this.alerts.set([]);
    this.items.set([]);
    this.unreadCount.set(null);
    this.status.set('idle');
    this.page.set(1);
    this.totalPages.set(0);
  }
  private start(): void {
    const epoch = this.actor.epoch;
    const connection = this.connect();
    if (!connection) {
      return;
    }
    this.connection = connection;
    const current = (): boolean =>
      this.connection === connection && this.actor.epoch === epoch;
    connection.addEventListener('inbox.resync', (raw: Event) => {
      if (!current()) {
        return;
      }
      try {
        const reason = resyncReason(raw as MessageEvent<string>);
        if (reason === 'connected' || reason === 'reconnected') {
          this.baseline = false;
        }
        this.retryMs = 3000;
        void this.load(this.page());
      } catch {
        this.retry(connection, epoch);
      }
    });
    connection.addEventListener('inbox.changed', (raw: Event) => {
      if (!current()) {
        return;
      }
      try {
        const ref = changedRef(raw as MessageEvent<string>);
        if (!this.seen.has(ref)) {
          this.seen.add(ref);
          if (this.seen.size > 2048) {
            this.seen.delete(this.seen.values().next().value!);
          }
          if (this.baseline && this.candidates.size < 256) {
            this.candidates.add(ref);
          }
        }
        void this.load(this.page());
      } catch {
        this.retry(connection, epoch);
      }
    });
    connection.onerror = (): void => {
      if (current()) {
        this.retry(connection, epoch);
      }
    };
    // Also reconcile persisted data if invalidation publication is lost.
    this.periodic = setInterval(() => {
      if (current()) {
        void this.load(this.page());
      }
    }, 60000);
  }
  private retry(connection: InboxConnection, epoch: number): void {
    if (this.connection !== connection) {
      return;
    }
    this.stop();
    this.candidates.clear();
    void this.auth.revalidate();
    const delay = this.retryMs;
    this.retryMs = Math.min(30000, this.retryMs * 2);
    this.reconnect = setTimeout(() => {
      this.reconnect = undefined;
      if (
        this.actor.epoch === epoch &&
        this.context.snapshot().status === 'authenticated'
      ) {
        this.start();
      }
    }, delay);
  }
  dismiss(ref: string): void {
    this.alerts.update((items) => items.filter((item) => item.ref_id !== ref));
  }
  load(index = 1): Promise<void> {
    this.page.set(index);
    this.dirty = true;
    if (this.pending) {
      return this.pending;
    }
    const generation = this.generation;
    const epoch = this.actor.epoch;
    const work = this.drain(generation, epoch).finally(() => {
      if (this.pending === work) {
        this.pending = null;
      }
    });
    this.pending = work;
    return work;
  }
  private async drain(generation: number, epoch: number): Promise<void> {
    const current = (): boolean =>
      generation === this.generation && this.actor.epoch === epoch;
    do {
      this.dirty = false;
      const index = this.page();
      this.status.set('loading');
      try {
        const [page, unread, history] = await Promise.all([
          this.api.search(
            { page: index, size: 20, unread: true },
            this.abort.signal,
          ),
          this.api.unread(this.abort.signal),
          this.baseline
            ? Promise.resolve(null)
            : this.api.search({ page: 1, size: 1 }, this.abort.signal),
        ]);
        if (!current()) {
          return;
        }
        this.items.set(page.items);
        this.unreadCount.set(unread);
        this.totalPages.set(page.totalPages);
        this.status.set('ready');
        this.revision.update((value) => value + 1);
        if (!this.baseline) {
          // Query only establishes history. Old unread rows never produce popups.
          this.watermark = Math.max(
            this.watermark,
            ...(history?.items ?? page.items).map((item) =>
              Date.parse(item.created_at),
            ),
          );
          this.baseline = true;
        }
        const refs = [...this.candidates];
        this.candidates.clear();
        for (const ref of refs) {
          try {
            const item = await this.api.detail(ref, this.abort.signal);
            if (!current()) {
              return;
            }
            if (
              item.target.available &&
              item.read_at === null &&
              Date.parse(item.created_at) > this.watermark
            ) {
              this.alerts.update((items) =>
                [item, ...items.filter((row) => row.ref_id !== ref)].slice(
                  0,
                  3,
                ),
              );
            }
          } catch {
            /* A revoked/stale target cannot create an alert. */
          }
        }
      } catch {
        if (current()) {
          this.unreadCount.set(null);
          this.status.set('error');
        }
      }
    } while (this.dirty && current());
  }
}
