import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ApiClient } from '../transport/api-client';
import { ActorState } from './actor-state';
import { ProfileSettings } from './profile-settings';
const response = (ref: string): HttpResponse<unknown> =>
  new HttpResponse({
    body: {
      success: true,
      data: {
        ref_id: ref,
        first_name: null,
        last_name: 'Test',
        avatar_ref_id: null,
      },
    },
  });
describe('Self profile contract and actor fencing', () => {
  it('retains explicit null and sends no omitted avatar or name fields', async () => {
    const call = vi.fn().mockReturnValue(of(response('profile-next')));
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const service = TestBed.inject(ProfileSettings);
    await service.save({ ref_id: 'profile-current', first_name: null });
    expect(call.mock.calls[0][1].body).toEqual({
      ref_id: 'profile-current',
      first_name: null,
    });
    expect(service.value()?.ref_id).toBe('profile-next');
  });
  it('rejects a late result after account change and clears the previous profile', async () => {
    const pending = new Subject<HttpResponse<unknown>>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiClient,
          useValue: { call: (): Subject<HttpResponse<unknown>> => pending },
        },
      ],
    });
    const service = TestBed.inject(ProfileSettings);
    const result = service.read();
    TestBed.inject(ActorState).reset();
    pending.next(response('old-account'));
    await expect(result).rejects.toThrow('Access changed');
    expect(service.value()).toBeNull();
  });
});
