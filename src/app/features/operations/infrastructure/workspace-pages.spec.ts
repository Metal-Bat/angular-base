import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiFailure } from '../../../core/transport/api-failure';
import { ListNavigation } from '../../../core/resources/list-navigation';
import { WorkspaceApi } from './workspace-api';
import { WorkspacePages } from './workspace-pages';

describe('Confirmed operational lists', () => {
  const first = {
    items: [{ ref: 'owned', status: 'DRAFT' }],
    page: 2,
    size: 20,
    total: 30,
    totalPages: 2,
  };
  const list = vi.fn();
  let pages: WorkspacePages;
  beforeEach(() => {
    list.mockReset().mockResolvedValue(first);
    TestBed.configureTestingModule({
      providers: [
        WorkspacePages,
        { provide: WorkspaceApi, useValue: { list } },
      ],
    });
    pages = TestBed.inject(WorkspacePages);
  });
  it('retains the last confirmed rows, page and query through loading and a failed refresh', async () => {
    await pages.load('request', 2);
    const query = pages.appliedQuery();
    let reject!: (error: Error) => void;
    list.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const loading = pages.load('request', 1, 'available', undefined, {
      scope: 'mine',
      page: 1,
      size: 10,
    });
    expect(pages.cases()).toEqual(first.items);
    reject(Error('Unavailable'));
    await loading;
    expect(pages.state()).toBe('error');
    expect(pages.cases()).toEqual(first.items);
    expect(pages.page()).toBe(2);
    expect(pages.appliedQuery()).toEqual(query);
  });
  it('clears private confirmed rows when current authorization is denied', async () => {
    await pages.load('task');
    list.mockRejectedValueOnce(new ApiFailure(403, 1003, null, []));
    await pages.load('task');
    expect(pages.cases()).toEqual([]);
    expect(pages.appliedQuery()).toBeNull();
  });
  it('fences a late response after actor cleanup', async () => {
    let resolve!: (value: typeof first) => void;
    list.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const loading = pages.load('request');
    TestBed.inject(ActorState).reset();
    resolve(first);
    await loading;
    expect(pages.cases()).toEqual([]);
    expect(pages.appliedQuery()).toBeNull();
  });
  it('restores the remembered page and query rather than forcing a detail return to page one', async () => {
    TestBed.inject(ListNavigation).set({
      route_key: 'requests',
      query: {
        page: 3,
        size: 10,
        scope: 'mine',
        filters: [],
        sort_orders: [],
      },
    });
    await pages.load('request');
    expect(list.mock.calls[0][1]).toBe(3);
    expect(list.mock.calls[0][4]).toMatchObject({ size: 10, scope: 'mine' });
  });
  it('retains confirmed rows when an aborted read resolves too late', async () => {
    await pages.load('request');
    const controller = new AbortController();
    let resolve!: (value: typeof first) => void;
    list.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const loading = pages.load('request', 1, 'available', controller.signal);
    controller.abort();
    resolve({ ...first, items: [{ ref: 'cancelled', status: 'DRAFT' }] });
    await loading;
    expect(pages.cases()).toEqual(first.items);
    expect(pages.state()).toBe('ready');
  });
});
