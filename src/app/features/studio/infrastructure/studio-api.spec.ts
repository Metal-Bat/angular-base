import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/transport/api-client';
import { StudioApi } from './studio-api';

describe('Studio list contracts', () => {
  const call = vi.fn();
  beforeEach(() => {
    call.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
  });
  it('decodes the actual synchronous report page and preserves filters and parent scope', async () => {
    call.mockReturnValue(
      of(
        new HttpResponse({
          status: 200,
          body: {
            success: true,
            result: {
              items: [{ ref_id: 'version', number: 2, status: 'PUBLISHED' }],
              page: 3,
              size: 35,
              total: 80,
              total_pages: 3,
            },
          },
        }),
      ),
    );
    const query = {
      page: 1,
      size: 35,
      form_ref_id: 'current-parent',
      filters: [{ field_name: 'number', operation: 'gte', value: 2 }],
      sort_orders: [{ field_name: 'number', operation: 'desc' }],
    };
    const result = await TestBed.inject(StudioApi).search(
      'form-versions',
      3,
      query,
      true,
    );
    expect(result.items).toEqual([
      { ref_id: 'version', number: 2, status: 'PUBLISHED' },
    ]);
    expect(call).toHaveBeenCalledWith(
      'report_versions_api_v1_form_versions_report_post',
      { body: { ...query, page: 3 } },
      undefined,
    );
  });
  it('offers released query fields rather than response-only references', () => {
    const api = TestBed.inject(StudioApi);
    expect(
      api
        .spec('forms')
        .list?.queryFields.some((field) => field.key === 'ref_id'),
    ).toBe(false);
    expect(
      api.spec('client-releases').list?.queryFields.map((field) => field.key),
    ).toEqual(['release_version', 'api_version', 'is_enabled']);
    expect(
      api.spec('form-versions').queryFields.map((field) => field.key),
    ).toEqual(['form_ref_id']);
  });
});
