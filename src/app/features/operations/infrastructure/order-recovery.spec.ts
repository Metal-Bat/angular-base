import { TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { SessionContext } from '../../../core/auth/session-context';
import { ApiClient } from '../../../core/transport/api-client';
import { OrderRecoveryApi } from './order-recovery';

describe('Order recovery contract', () => {
  it('resolves live superuser authority and freezes fresh refs without submitting an effect', async () => {
    const call = vi.fn().mockImplementation((id: string) =>
      of(
        new HttpResponse({
          body: id.includes('auth_me')
            ? { success: true, data: { is_superuser: true } }
            : id.startsWith('get_process')
              ? { success: true, data: { ref_id: 'fresh-process' } }
              : {
                  success: true,
                  result: {
                    items: [
                      {
                        operation_id: 'operation',
                        step_execution_ref_id: 'fresh-execution',
                        state: 'UNKNOWN',
                        receipt: null,
                      },
                    ],
                    page: 1,
                    size: 20,
                    total: 1,
                    total_pages: 1,
                  },
                },
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    const api = TestBed.inject(OrderRecoveryApi);
    const abort = new AbortController().signal;
    expect(await api.authority(abort)).toBe(false);
    expect(call).not.toHaveBeenCalled();
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['processes.recover'],
    });
    expect(await api.authority(abort)).toBe(true);
    const command = await api.prepare(
      'old-process',
      'operation',
      1,
      'INC-123',
      'order',
      abort,
    );
    expect(command).toMatchObject({
      process: 'fresh-process',
      execution: 'fresh-execution',
      reason: 'INC-123',
    });
    expect(Object.isFrozen(command)).toBe(true);
    expect(
      call.mock.calls.every(([id]) => !String(id).includes('reconcile')),
    ).toBe(true);
  });
  it('never executes recovery for a non-superuser despite a recovery permission', async () => {
    const call = vi.fn().mockReturnValue(
      of(
        new HttpResponse({
          body: { success: true, data: { is_superuser: false } },
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ApiClient, useValue: { call } }],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['processes.recover'],
    });
    await expect(
      TestBed.inject(OrderRecoveryApi).execute(
        {
          operation: 'operation',
          process: 'process',
          execution: 'execution',
          commandKey: 'key',
          reason: 'INC-123',
          kind: 'order',
        },
        new AbortController().signal,
      ),
    ).rejects.toThrow();
    expect(call).toHaveBeenCalledOnce();
    expect(call.mock.calls[0][0]).toBe('me_api_v1_auth_me_get');
  });
});
