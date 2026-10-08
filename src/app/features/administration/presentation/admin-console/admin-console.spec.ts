import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { AuthSession } from '../../../../core/auth/auth-session';
import { SessionContext } from '../../../../core/auth/session-context';
import { Feedback } from '../../../../core/feedback/feedback';
import { FieldSpec } from '../../../studio/domain/authoring';
import { ADMIN_API } from '../../bindings';
import { AdminCommand } from '../../domain/admin-command';
import { AdminConsole } from './admin-console';
const target: FieldSpec = {
  key: 'task_id',
  title: 'Task ID',
  type: 'text',
  required: true,
  nullable: false,
  options: [],
  initial: undefined,
  schema: {},
};
const retry: AdminCommand = {
  id: 'retry',
  title: 'Retry execution',
  permission: 'admin.tasks.manage',
  mutation: true,
  method: 'post',
  path: '',
  bodyRequired: false,
  fields: { body: [], path: [target], query: [] },
};
describe('Administration command boundary', () => {
  let send: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    send = vi.fn().mockResolvedValue({
      value: { task_id: 'new-task', status: 'QUEUED' },
      page: 1,
      totalPages: 1,
      requestId: 'safe-id',
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { adminGroup: 'tasks' } } },
        },
        {
          provide: ADMIN_API,
          useValue: {
            groups: (): unknown => [{ key: 'tasks', title: 'Tasks' }],
            commands: (): unknown => [retry],
            send,
          },
        },
        {
          provide: AuthSession,
          useValue: { revalidate: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['admin.tasks.manage'],
    });
  });
  it('freezes the exact task ID before confirmation and never treats queuing as completion', async () => {
    const editor = TestBed.createComponent(AdminConsole).componentInstance;
    editor.change(target, 'path', 'actual-task-id');
    const command = editor.execute();
    expect(send).not.toHaveBeenCalled();
    editor.change(target, 'path', 'changed-after-review');
    TestBed.inject(Feedback).answer(true);
    await command;
    expect(send).toHaveBeenCalledWith(retry, {
      body: {},
      path: { task_id: 'actual-task-id' },
      query: {},
    });
    expect(editor.result()?.value).toEqual({
      task_id: 'new-task',
      status: 'QUEUED',
    });
    expect(editor.notice()).toContain('Read current state');
  });
  it('cancels a confirmed command when its actor changed during review', async () => {
    const editor = TestBed.createComponent(AdminConsole).componentInstance;
    editor.change(target, 'path', 'task');
    const command = editor.execute();
    TestBed.inject(ActorState).reset();
    TestBed.inject(Feedback).answer(true);
    await command;
    expect(send).not.toHaveBeenCalled();
    expect(editor.input()).toEqual({ body: {}, path: {}, query: {} });
  });
  it('retains conflict input without automatically retrying', async () => {
    send.mockRejectedValue(Error('conflict'));
    const editor = TestBed.createComponent(AdminConsole).componentInstance;
    editor.change(target, 'path', 'task');
    const command = editor.execute();
    TestBed.inject(Feedback).answer(true);
    await command;
    expect(send).toHaveBeenCalledTimes(1);
    expect(editor.input().path['task_id']).toBe('task');
    expect(editor.error()).toContain('retained');
  });
  it('ignores an accepted response delivered after logout', async () => {
    let finish!: (value: unknown) => void;
    send.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const editor = TestBed.createComponent(AdminConsole).componentInstance;
    editor.change(target, 'path', 'task');
    const command = editor.execute();
    TestBed.inject(Feedback).answer(true);
    await Promise.resolve();
    TestBed.inject(ActorState).reset();
    finish({
      value: { secret: 'private' },
      page: 1,
      totalPages: 1,
      requestId: null,
    });
    await command;
    expect(editor.result()).toBeNull();
  });
});
