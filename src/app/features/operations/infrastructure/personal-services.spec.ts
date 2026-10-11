import { InboxApi } from '../../../core/notifications/inbox-api';
import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { PersonalServices } from './personal-services';
describe('Existing notification search contract', () => {
  it('sends only applied typed filters and retains the authoritative result total', async () => {
    const call = vi.fn(
      (id: string, input: { body: { filters: unknown[] } }) => {
        expect(id).toMatch(/search_/);
        expect(input.body.filters).toBeInstanceOf(Array);
        return of(
          new HttpResponse({
            body: {
              success: true,
              result: {
                items: [],
                page: 1,
                size: 20,
                total: 31,
                total_pages: 2,
              },
            },
          }),
        );
      },
    );
    const search = vi.fn().mockResolvedValue({
      items: [],
      page: 1,
      size: 20,
      total: 31,
      totalPages: 2,
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiClient, useValue: { call } },
        { provide: InboxApi, useValue: { search } },
      ],
    });
    const service = TestBed.inject(PersonalServices);
    const result = await service.list('notifications', 1, false, undefined, {
      read: 'unread',
      search: 'Review',
    });
    expect(result.total).toBe(31);
    expect(search).toHaveBeenLastCalledWith(
      {
        page: 1,
        size: 20,
        unread: true,
        filters: [
          { field_name: 'read_at', operation: 'isNull', value: null },
          { field_name: 'subject', operation: 'contains', value: 'Review' },
        ],
        sort_orders: [],
      },
      undefined,
      false,
    );
    await service.list('notifications', 2, false, undefined, {
      read: 'read',
      search: '',
    });
    expect(search.mock.calls[1][0].filters).toEqual([
      { field_name: 'read_at', operation: 'isNotNull', value: null },
    ]);
    await service.list('reports', 1, false, undefined, {
      read: 'unread',
      search: 'Review',
    });
    expect(call.mock.calls[0][1].body.filters).toEqual([]);
  });
  it('reads current unified targets instead of the legacy case-only serializer', async () => {
    const call = vi.fn();
    const detail = vi.fn().mockResolvedValue({
      ref_id: 'current',
      subject: 'Account notice',
      status: 'ACTIVE',
      content: null,
      read_at: null,
      created_at: '2026-10-09T00:00:00Z',
      target: {
        kind: 'account',
        route_key: 'me',
        available: true,
        ref_id: 'actor',
      },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: ApiClient, useValue: { call } },
        { provide: InboxApi, useValue: { detail } },
      ],
    });
    const value = await TestBed.inject(PersonalServices).detail(
      'notifications',
      'old',
    );
    expect(value.target?.ref_id).toBe('actor');
    expect(value.ref).toBe('current');
    expect(detail).toHaveBeenCalledWith('old', undefined);
    expect(call).not.toHaveBeenCalled();
  });
});
