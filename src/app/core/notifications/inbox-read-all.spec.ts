import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { InboxApi, InboxItem } from './inbox-api';
import { InboxReadAll } from './inbox-read-all';
import { NotificationPreview } from './notification-preview';
import { Page } from '../transport/response-adapters';

const item = (ref: string, read = false): InboxItem => ({
  schema_version: 1,
  ref_id: ref,
  template_key: 'account',
  template_version: '1',
  locale: 'en',
  subject: 'Notice',
  content: null,
  priority: 1,
  status: 'ACTIVE',
  created_at: '2026-10-12T03:00:00Z',
  read_at: read ? '2026-10-12T04:00:00Z' : null,
  target: {
    kind: 'account',
    route_key: 'me',
    available: true,
    ref_id: 'actor',
  },
});
const page = (items: InboxItem[], total = items.length): Page<InboxItem> => ({
  items,
  total,
  totalPages: Math.ceil(total / 20),
  page: 1,
  size: 20,
});
describe('Actor-owned mark all notifications read', () => {
  let api: {
    search: ReturnType<typeof vi.fn>;
    detail: ReturnType<typeof vi.fn>;
    read: ReturnType<typeof vi.fn>;
  };
  let preview: {
    load: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };
  beforeEach(() => {
    api = {
      search: vi.fn(),
      detail: vi.fn(async (ref: string): Promise<InboxItem> =>
        item(ref + '_current'),
      ),
      read: vi.fn(async (ref: string): Promise<InboxItem> =>
        item(ref + '_saved', true),
      ),
    };
    preview = { load: vi.fn().mockResolvedValue(undefined), dismiss: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: InboxApi, useValue: api },
        { provide: NotificationPreview, useValue: preview },
      ],
    });
  });
  it('drains page one across pages, rereads refs and excludes newer arrivals', async () => {
    const first = Array.from({ length: 20 }, (_, index): InboxItem =>
      item('n' + index),
    );
    api.search
      .mockResolvedValueOnce(page(first, 21))
      .mockResolvedValueOnce(page([item('last')]))
      .mockResolvedValueOnce(page([]));
    const action = TestBed.inject(InboxReadAll);
    await action.run();
    expect(action.completed()).toBe(21);
    expect(action.failed()).toBe(false);
    expect(api.read).toHaveBeenCalledWith('last_current');
    expect(
      api.search.mock.calls.every(
        ([query]): boolean => query.page === 1 && query.unread === true,
      ),
    ).toBe(true);
    expect(api.search.mock.calls[1][0].filters).toEqual([
      {
        field_name: 'created_at',
        operation: 'lte',
        value: first[0].created_at,
      },
    ]);
    expect(preview.load).toHaveBeenCalledWith(1);
    expect(action.busy()).toBe(false);
  });
  it('reports partial failure, reconciles counts and never retries a failed mutation', async () => {
    api.search.mockResolvedValue(page([item('one'), item('two')]));
    api.read
      .mockResolvedValueOnce(item('one_saved', true))
      .mockRejectedValueOnce(Error('Unknown result'));
    const action = TestBed.inject(InboxReadAll);
    await action.run();
    expect(action.completed()).toBe(1);
    expect(action.failed()).toBe(true);
    expect(action.message()).toContain('may remain unread');
    expect(api.read).toHaveBeenCalledTimes(2);
    expect(preview.load).toHaveBeenCalledTimes(1);
  });
  it('does not mutate notifications already read by another client', async () => {
    api.search
      .mockResolvedValueOnce(page([item('one')]))
      .mockResolvedValueOnce(page([]));
    api.detail.mockResolvedValue(item('one_current', true));
    await TestBed.inject(InboxReadAll).run();
    expect(api.read).not.toHaveBeenCalled();
    expect(preview.dismiss).toHaveBeenCalledWith('one');
  });
  it('fences account changes and rejects concurrent starts', async () => {
    let finish!: (value: InboxItem) => void;
    api.search.mockResolvedValue(page([item('one')]));
    api.detail.mockImplementation(
      (): Promise<InboxItem> =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const action = TestBed.inject(InboxReadAll);
    const work = action.run();
    await vi.waitFor(() => expect(api.detail).toHaveBeenCalledTimes(1));
    await action.run();
    expect(api.search).toHaveBeenCalledTimes(1);
    TestBed.inject(ActorState).reset();
    finish(item('one_current'));
    await work;
    expect(api.read).not.toHaveBeenCalled();
    expect(preview.load).not.toHaveBeenCalled();
    expect(action.message()).toBe('');
    expect(action.busy()).toBe(false);
  });
});
