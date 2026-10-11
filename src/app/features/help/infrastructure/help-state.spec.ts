import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ActorState } from '../../../core/auth/actor-state';
import { SessionContext } from '../../../core/auth/session-context';
import { ApiClient } from '../../../core/transport/api-client';
import { helpCatalog } from '../domain/help-catalog';
import { HelpState } from './help-state';
const response = (data: unknown): HttpResponse<unknown> =>
  new HttpResponse({ body: { success: true, data } });
describe('Minimal per-account help state', () => {
  it('does not acknowledge fetched rows and reports absent release metadata honestly', async () => {
    const call = vi.fn().mockReturnValue(
      of(
        response({
          release_key: null,
          states: { items: [], total_pages: 0 },
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['requests.start'],
    });
    const service = TestBed.inject(HelpState);
    TestBed.tick();
    await vi.waitFor(() => expect(service.status()).toBe('unsaved'));
    expect(call.mock.calls.map((row) => row[0])).toEqual([
      'read_help_state_api_v1_me_help_state_get',
    ]);
    expect(service.states()).toEqual([]);
  });
  it('serializes seen/reset and prevents queued old-account writes', async () => {
    const first = new Subject<HttpResponse<unknown>>();
    const call = vi.fn().mockReturnValue(first);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const service = TestBed.inject(HelpState);
    const seen = service.acknowledge(helpCatalog[0], 'en');
    await vi.waitFor(() => expect(call).toHaveBeenCalledTimes(1));
    const reset = service.reset();
    expect(call).toHaveBeenCalledTimes(1);
    TestBed.inject(ActorState).reset();
    first.next(response({ saved: true }));
    await seen;
    expect(await reset).toBe(false);
    expect(call).toHaveBeenCalledTimes(1);
    expect(service.states()).toEqual([]);
    expect(call.mock.calls[0][1].body).toEqual({
      help_key: helpCatalog[0].help_key,
      revision: helpCatalog[0].revision,
      locale: 'en',
    });
  });
});
