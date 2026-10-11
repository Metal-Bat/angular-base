import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { ActorState } from '../auth/actor-state';
import { ApiClient } from '../transport/api-client';
import { ResourceLinks } from './resource-links';
const summary = {
  kind: 'forms',
  ref_id: 'current',
  label: 'Owned form',
  available: true,
};
const response = (data: unknown): HttpResponse<unknown> =>
  new HttpResponse({ body: { success: true, data } });
it('rejects a mismatched selected kind and bounds a multi-resource lookup', async () => {
  const call = vi.fn().mockReturnValue(of(response([summary])));
  TestBed.configureTestingModule({
    providers: [{ provide: ApiClient, useValue: { call } }],
  });
  const links = TestBed.inject(ResourceLinks);
  await expect(
    links.selected([{ kind: 'workflow_versions', ref_id: 'old' }]),
  ).rejects.toThrow('Unavailable');
  await expect(links.selected([])).rejects.toThrow('Unavailable');
  await expect(
    links.selected(
      Array.from({ length: 51 }, () => ({
        kind: 'forms' as const,
        ref_id: 'old',
      })),
    ),
  ).rejects.toThrow('Unavailable');
  expect(call).toHaveBeenCalledTimes(1);
});
it('aborts selected summaries and discards a late account result', async () => {
  const pending = new Subject<HttpResponse<unknown>>();
  const call = vi.fn().mockReturnValue(pending);
  TestBed.configureTestingModule({
    providers: [{ provide: ApiClient, useValue: { call } }],
  });
  const work = TestBed.inject(ResourceLinks).selected([
    { kind: 'forms', ref_id: 'old' },
  ]);
  const abort = call.mock.calls[0][2] as AbortSignal;
  TestBed.inject(ActorState).reset();
  expect(abort.aborted).toBe(true);
  pending.next(response([summary]));
  await expect(work).rejects.toThrow('Access changed');
});
