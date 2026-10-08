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
  it('decodes queued report data and preserves typed filters and parent scope', async () => {
    call.mockReturnValue(
      of(
        new HttpResponse({
          status: 202,
          body: {
            success: true,
            data: { ref_id: 'queued-report', status: 'QUEUED' },
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
      { ref_id: 'queued-report', status: 'QUEUED' },
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
