import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { cartables } from '../domain/workspace-models';
import { WorkspaceApi } from './workspace-api';

describe('Workspace wire contracts', () => {
  it.each(cartables)(
    'uses the declared %s cartable without invented filters',
    async (cartable) => {
      const call = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {
              success: true,
              result: {
                items: [],
                page: 2,
                size: 20,
                total: 0,
                total_pages: 0,
              },
            },
          }),
        ),
      );
      TestBed.configureTestingModule({
        providers: [{ provide: ApiClient, useValue: { call } }],
      });
      await TestBed.inject(WorkspaceApi).list('task', 2, cartable);
      expect(call).toHaveBeenCalledWith(
        'search_work_items_api_v1_work_items_search_post',
        {
          body: { page: 2, size: 20, cartable },
        },
        undefined,
      );
    },
  );
  it.each(['complete', 'reject', 'return'] as const)(
    'sends %s to its exact command endpoint',
    async (action) => {
      const call = vi.fn().mockReturnValue(
        of(
          new HttpResponse({
            body: {
              success: true,
              data: {
                ref_id: 'task/new',
                status: 'COMPLETED',
                kind: 'HUMAN_TASK',
              },
            },
          }),
        ),
      );
      TestBed.configureTestingModule({
        providers: [{ provide: ApiClient, useValue: { call } }],
      });
      await TestBed.inject(WorkspaceApi).decide(
        'task/current',
        action,
        'stable-key',
        { amount: 2 },
        'review',
        ['/optional'],
        'EXPLICIT_OUTCOME',
        'Reviewer comment',
      );
      expect(call).toHaveBeenCalledWith(
        `${action}_work_item_api_v1_work_items__ref_id__${action}_post`,
        {
          path: { ref_id: 'task/current' },
          body: {
            command_key: 'stable-key',
            data: { amount: 2 },
            view_key: 'review',
            delete_paths: ['/optional'],
            outcome_key: 'EXPLICIT_OUTCOME',
            comment: 'Reviewer comment',
            feedback: [],
          },
        },
      );
    },
  );
});
