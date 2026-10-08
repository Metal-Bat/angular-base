import { AdminPort } from '../../application/admin-port';
import { AdminCommand } from '../../domain/admin-command';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ResourceActions } from './resource-actions';
import { ADMIN_API } from '../../bindings';
import { AdminApi } from '../../infrastructure/admin-api';
import { SessionContext } from '../../../../core/auth/session-context';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { actionErrors, actionInput } from '../../domain/action-input';

describe('Resource action dialogs', () => {
  let actions: ResourceActions;
  let send: ReturnType<typeof vi.fn<AdminPort['send']>>;
  let api: AdminApi;
  beforeEach(() => {
    send = vi.fn<AdminPort['send']>().mockResolvedValue({
      value: { task_id: 'queued-task', state: 'QUEUED' },
      page: 1,
      totalPages: 1,
      requestId: null,
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        {
          provide: ADMIN_API,
          useFactory: (): AdminPort => {
            const catalog = TestBed.inject(AdminApi);
            return {
              groups: (): readonly { key: string; title: string }[] =>
                catalog.groups(),
              commands: (group: string): readonly AdminCommand[] =>
                catalog.commands(group),
              send,
            };
          },
        },
      ],
    });
    api = TestBed.inject(AdminApi);
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['admin.tasks.manage', 'integrations.manage'],
    });
    const fixture = TestBed.createComponent(ResourceActions);
    fixture.componentRef.setInput('group', 'tasks');
    fixture.componentRef.setInput('base', '/api/v1/tasks/executions');
    fixture.componentRef.setInput('row', {
      ref_id: 'execution-reference',
      task_id: 'actual-task-id',
      task_name: 'jobs.sample',
    });
    fixture.detectChanges();
    actions = fixture.componentInstance;
  });
  it('carries the actual task ID and freezes the command before confirmation', async () => {
    const retry = api
      .commands('tasks')
      .find((command) => command.path.endsWith('/retry'))!;
    await actions.open(retry);
    expect(actions.input().path).toEqual({ task_id: 'actual-task-id' });
    const pending = actions.execute();
    expect(send).not.toHaveBeenCalled();
    actions.input.update((values) => ({
      ...values,
      path: { task_id: 'edited-after-review' },
    }));
    TestBed.inject(Feedback).answer(true);
    await pending;
    expect(send.mock.calls[0][1].path).toEqual({ task_id: 'actual-task-id' });
    expect(actions.notice()).toContain('Read current state');
  });
  it('discards a pending write when the actor changes', async () => {
    await actions.open(
      api.commands('tasks').find((command) => command.path.endsWith('/retry'))!,
    );
    const pending = actions.execute();
    TestBed.inject(ActorState).reset();
    TestBed.inject(Feedback).answer(true);
    await pending;
    expect(send).not.toHaveBeenCalled();
    expect(actions.command()).toBeNull();
    expect(actions.input()).toEqual({ body: {}, path: {}, query: {} });
  });
  it('requires exactly one grant target and at least one capability', () => {
    const grant = api
      .commands('integrations')
      .find(
        (command) =>
          command.path.endsWith('/grants') && command.method === 'post',
      )!;
    const input = actionInput(
      grant,
      { ref_id: 'connection' },
      '/api/v1/integration-connections',
      null,
    );
    expect(actionErrors(grant, input)).toHaveProperty('body.user_ref_id');
    input.body = {
      user_ref_id: 'user',
      work_group_ref_id: 'group',
      can_use: true,
    };
    expect(actionErrors(grant, input)).toHaveProperty('body.work_group_ref_id');
    input.body = { user_ref_id: 'user', can_use: false, can_manage: false };
    expect(actionErrors(grant, input)).toHaveProperty('body.can_use');
    input.body = { user_ref_id: 'user', can_use: true, can_manage: false };
    expect(actionErrors(grant, input)).toEqual({});
  });
  it('seeds running a schedule from its task name rather than the schedule name', () => {
    const run = api
      .commands('tasks')
      .find((command) => command.path === '/api/v1/tasks/run')!;
    expect(
      actionInput(
        run,
        { name: 'Daily job', task_name: 'jobs.sample', queue: 'priority' },
        '/api/v1/tasks/schedules',
        null,
      ).body['task_name'],
    ).toBe('jobs.sample');
    expect(
      actionInput(
        run,
        { name: 'Daily job', task_name: 'jobs.sample', queue: 'priority' },
        '/api/v1/tasks/schedules',
        null,
      ).body['queue'],
    ).toBe('priority');
  });
});
