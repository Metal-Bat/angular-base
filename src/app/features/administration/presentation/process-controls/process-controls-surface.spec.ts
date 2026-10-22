import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SessionContext } from '../../../../core/auth/session-context';
import { ADMIN_API } from '../../bindings';
import { AdminPort } from '../../application/admin-port';
import { AdminApi } from '../../infrastructure/admin-api';
import { ProcessControls } from './process-controls';

async function open(
  permissions: string[],
): Promise<{ root: HTMLElement; send: ReturnType<typeof vi.fn> }> {
  const send = vi.fn().mockResolvedValue({
    value: {
      ref_id: 'process-current',
      business_request_ref_id: 'request-current',
      status: 'WAITING',
      started_at: '2026-10-14T12:00:00Z',
      ended_at: null,
      last_error_code: null,
      workflow_version_ref_id: 'immutable-workflow-pin',
      current_positions: [
        {
          step_key: 'review',
          execution_status: 'WAITING',
          token_status: 'WAITING',
          wait_kind: 'HUMAN_TASK',
        },
      ],
    },
    page: 1,
    totalPages: 1,
    requestId: null,
  });
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideRouter([
        { path: 'administration/processes', component: ProcessControls },
      ]),
      {
        provide: ADMIN_API,
        useFactory: (): AdminPort => {
          const api = TestBed.inject(AdminApi);
          return {
            groups: (): ReturnType<AdminApi['groups']> => api.groups(),
            commands: (group: string): ReturnType<AdminApi['commands']> =>
              api.commands(group),
            send,
          };
        },
      },
    ],
  });
  TestBed.inject(SessionContext).resolve({
    status: 'authenticated',
    permissions,
  });
  const harness = await RouterTestingHarness.create(
    '/administration/processes?ref_id=known-process',
  );
  harness.detectChanges();
  await harness.fixture.whenStable();
  return { root: harness.routeNativeElement!, send };
}

describe('Contextual process control surface', () => {
  it('opens authorized context, collapses technical codes and keeps commands in the header', async () => {
    const { root, send } = await open(['requests.start']);
    expect(send).toHaveBeenCalledOnce();
    expect(root.querySelector('details')?.open).toBe(false);
    expect(
      root.querySelector('a[href="/operations/requests/request-current"]'),
    ).not.toBeNull();
    expect(
      root.querySelector('a[href="/operations/processes/process-current"]'),
    ).not.toBeNull();
    expect(root.querySelectorAll('app-resource-actions')).toHaveLength(1);
    expect(root.querySelector('header app-resource-actions')).not.toBeNull();
    expect(root.querySelector('p-table')?.textContent).toContain('review');
    expect(root.textContent).not.toContain('immutable-workflow-pin');
  });
  it('does not grant request inspection or send a read for a recovery-only operator', async () => {
    const { root, send } = await open(['processes.recover']);
    expect(send).not.toHaveBeenCalled();
    expect(root.querySelector('a[href^="/operations/requests"]')).toBeNull();
    expect(root.querySelector('p-table')).toBeNull();
    expect(root.textContent).toContain(
      'does not grant request or process inspection',
    );
  });
});
