import { AuthSession } from '../auth/auth-session';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { SessionContext } from '../auth/session-context';
import { Page } from '../transport/response-adapters';
import { InboxApi, InboxItem } from './inbox-api';
import { INBOX_EVENTS } from './inbox-events';
import { NotificationPreview } from './notification-preview';
const item = (
  ref = 'notice',
  createdAt = '2026-10-09T00:00:00Z',
): InboxItem => ({
  schema_version: 1,
  ref_id: ref,
  template_key: 'account',
  template_version: '1',
  locale: 'en',
  subject: 'Review requested',
  content: null,
  priority: 1,
  status: 'ACTIVE',
  read_at: null,
  created_at: createdAt,
  target: {
    kind: 'account',
    route_key: 'me',
    available: true,
    ref_id: 'actor',
  },
});
const page = (items: InboxItem[]): Page<InboxItem> => ({
  items,
  page: 1,
  size: 20,
  total: items.length,
  totalPages: 1,
});
describe('One actor-owned live notification connection', () => {
  let events: EventTarget;
  let close: ReturnType<typeof vi.fn>;
  let search: ReturnType<typeof vi.fn>;
  let unread: ReturnType<typeof vi.fn>;
  let detail: ReturnType<typeof vi.fn>;
  let connect: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    events = new EventTarget();
    close = vi.fn();
    search = vi.fn().mockResolvedValue(page([item()]));
    unread = vi.fn().mockResolvedValue(31);
    detail = vi.fn().mockResolvedValue(item('new', '2026-10-09T01:00:00Z'));
    connect = vi.fn(
      (): {
        addEventListener: EventTarget['addEventListener'];
        close: typeof close;
        onerror: null;
      } => ({
        addEventListener: events.addEventListener.bind(events),
        close,
        onerror: null,
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthSession,
          useValue: { revalidate: (): Promise<void> => Promise.resolve() },
        },
        { provide: InboxApi, useValue: { search, unread, detail } },
        { provide: INBOX_EVENTS, useValue: connect },
      ],
    });
  });
  function event(name: string, data: unknown, id = ''): void {
    events.dispatchEvent(
      new MessageEvent(name, { data: JSON.stringify(data), lastEventId: id }),
    );
  }
  async function connected(): Promise<NotificationPreview> {
    const service = TestBed.inject(NotificationPreview);
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: [],
    });
    TestBed.tick();
    event('inbox.resync', { schema_version: 1, reason: 'connected' });
    await service.load();
    return service;
  }
  it('uses the separate authoritative unread total and never alerts from the initial unread page', async () => {
    const service = await connected();
    expect(service.unreadCount()).toBe(31);
    expect(service.alerts()).toEqual([]);
    await service.load();
    expect(connect).toHaveBeenCalledTimes(1);
    expect(service.items()[0].subject).toBe('Review requested');
  });
  it('reconciles changes arriving during a snapshot and suppresses duplicate alerts', async () => {
    const service = await connected();
    let resolve!: (value: ReturnType<typeof page>) => void;
    search.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    const pending = service.load();
    event(
      'inbox.changed',
      { schema_version: 1, notification_ref_id: 'new' },
      'new',
    );
    resolve(page([item()]));
    await pending;
    expect(search.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(service.alerts().length).toBe(1);
    event(
      'inbox.changed',
      { schema_version: 1, notification_ref_id: 'new' },
      'new',
    );
    await service.load();
    expect(detail).toHaveBeenCalledTimes(1);
  });
  it('fences old actor callbacks and pending reads immediately', async () => {
    const service = await connected();
    let resolve!: (value: ReturnType<typeof page>) => void;
    search.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    const pending = service.load();
    TestBed.inject(ActorState).reset();
    resolve(page([item('old')]));
    event(
      'inbox.changed',
      { schema_version: 1, notification_ref_id: 'old' },
      'old',
    );
    await pending;
    expect(close).toHaveBeenCalled();
    expect(service.status()).toBe('idle');
    expect(service.items()).toEqual([]);
    expect(service.alerts()).toEqual([]);
  });
  it('does not replay unread rows as alerts on reconnection or leak malformed events', async () => {
    const service = await connected();
    event(
      'inbox.resync',
      { schema_version: 1, reason: 'reconnected' },
      'previous',
    );
    await service.load();
    expect(service.alerts()).toEqual([]);
    expect(close).not.toHaveBeenCalled();
    event(
      'inbox.changed',
      { schema_version: 1, notification_ref_id: 'new', private_body: 'secret' },
      'new',
    );
    expect(close).toHaveBeenCalled();
    expect(detail).not.toHaveBeenCalled();
  });
});
