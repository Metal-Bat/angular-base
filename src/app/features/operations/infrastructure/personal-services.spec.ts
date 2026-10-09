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
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const service = TestBed.inject(PersonalServices);
    const result = await service.list('notifications', 1, false, undefined, {
      read: 'unread',
      search: 'Review',
    });
    expect(result.total).toBe(31);
    expect(call).toHaveBeenLastCalledWith(
      'search_notifications_api_v1_notifications_search_post',
      {
        body: {
          page: 1,
          size: 20,
          filters: [
            { field_name: 'read_at', operation: 'isNull', value: null },
            { field_name: 'subject', operation: 'contains', value: 'Review' },
          ],
          sort_orders: [],
        },
      },
    );
    await service.list('notifications', 2, false, undefined, {
      read: 'read',
      search: '',
    });
    expect(call.mock.calls[1][1].body.filters).toEqual([
      { field_name: 'read_at', operation: 'isNotNull', value: null },
    ]);
    await service.list('reports', 1, false, undefined, {
      read: 'unread',
      search: 'Review',
    });
    expect(call.mock.calls[2][1].body.filters).toEqual([]);
  });
});
