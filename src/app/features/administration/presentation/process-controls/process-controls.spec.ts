import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { AdminPort } from '../../application/admin-port';
import { ADMIN_API } from '../../bindings';
import { AdminApi } from '../../infrastructure/admin-api';
import { ProcessControls } from './process-controls';

describe('Authoritative process controls', () => {
  let controls: ProcessControls;
  let send: ReturnType<typeof vi.fn<AdminPort['send']>>;
  beforeEach(() => {
    send = vi.fn<AdminPort['send']>();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
        {
          provide: ADMIN_API,
          useFactory: (): AdminPort => {
            const api = TestBed.inject(AdminApi);
            return {
              groups: () => api.groups(),
              commands: (group) => api.commands(group),
              send,
            };
          },
        },
      ],
    });
    TestBed.overrideComponent(ProcessControls, { set: { template: '' } });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['requests.start'],
    });
    controls = TestBed.createComponent(ProcessControls).componentInstance;
  });
  const result = (value: {
    ref_id?: string;
    status?: string;
  }): Awaited<ReturnType<AdminPort['send']>> => ({
    value,
    page: 1,
    totalPages: 1,
    requestId: null,
  });
  it('uses returned current refs for the view and subsequent refresh without business commands', async () => {
    send.mockResolvedValueOnce(
      result({ ref_id: 'current', status: 'WAITING' }),
    );
    await controls.load('previous');
    expect(controls.row()).toEqual({ ref_id: 'current', status: 'WAITING' });
    expect(controls.reference).toBe('current');
    send.mockResolvedValueOnce(result({ ref_id: 'newest', status: 'RUNNING' }));
    await controls.refresh();
    expect(send.mock.calls[1][1].path).toEqual({ ref_id: 'current' });
    expect(send.mock.calls.every(([command]) => command.method === 'get')).toBe(
      true,
    );
    expect(controls.reference).toBe('newest');
  });
  it('retains the current record when the response has no authoritative ref', async () => {
    send.mockResolvedValueOnce(result({ ref_id: 'current' }));
    await controls.load('current');
    send.mockResolvedValueOnce(result({ status: 'WAITING' }));
    await controls.load('other');
    expect(controls.row()).toEqual({ ref_id: 'current' });
    expect(controls.reference).toBe('current');
    expect(controls.error()).toContain('retained');
  });
  it('does not send after actor loss during the pending leave check', async () => {
    const pending = controls.load('owned');
    TestBed.inject(SessionContext).clear();
    await pending;
    expect(send).not.toHaveBeenCalled();
    expect(controls.row()).toBeNull();
  });
  it('ignores old-account replies after a new account opens another process', async () => {
    let finish!: (value: Awaited<ReturnType<AdminPort['send']>>) => void;
    send.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const pending = controls.load('old');
    await Promise.resolve();
    TestBed.inject(ActorState).reset();
    send.mockResolvedValueOnce(result({ ref_id: 'new' }));
    await controls.load('new');
    finish(result({ ref_id: 'old' }));
    await pending;
    expect(controls.row()).toEqual({ ref_id: 'new' });
    expect(controls.busy()).toBe(false);
  });
});
