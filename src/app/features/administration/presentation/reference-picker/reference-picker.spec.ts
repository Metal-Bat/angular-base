import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { ADMIN_API } from '../../bindings';
import { AdminCommand } from '../../domain/admin-command';
import { ReferencePicker } from './reference-picker';

const selector: AdminCommand = {
  id: 'users',
  title: 'Users',
  permission: 'admin.users.manage',
  mutation: false,
  method: 'post',
  path: '/api/v1/admin/users/select',
  bodyRequired: true,
  fields: { body: [], path: [], query: [] },
};
const page = (
  key = 'opaque',
  label = 'Readable user',
  number = 1,
): unknown => ({
  value: [{ key, value: label }],
  page: number,
  totalPages: 3,
  requestId: null,
});
function prepare(): {
  fixture: ReturnType<typeof TestBed.createComponent<ReferencePicker>>;
  send: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn().mockResolvedValue(page());
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ADMIN_API,
        useValue: {
          groups: (): unknown => [{ key: 'users', title: 'Users' }],
          commands: (): unknown => [selector],
          send,
        },
      },
    ],
  });
  TestBed.inject(SessionContext).resolve({
    status: 'authenticated',
    permissions: [selector.permission],
  });
  const fixture = TestBed.createComponent(ReferencePicker);
  fixture.detectChanges();
  return { fixture, send };
}
describe('Authorized reference selection', () => {
  it('returns focus after dismissal and discards the target on actor reset', async () => {
    const { fixture } = prepare();
    const trigger = document.createElement('button');
    document.body.append(trigger);
    try {
      trigger.focus();
      const picker = fixture.componentInstance;
      await picker.open({ key: 'user_ref_id', path: 'user_ref_id' });
      document.body.focus();
      picker.clear();
      const focus = vi.spyOn(trigger, 'focus');
      picker.restoreFocus();
      expect(focus).toHaveBeenCalledOnce();
      await picker.open({ key: 'user_ref_id', path: 'user_ref_id' });
      TestBed.inject(ActorState).reset();
      picker.restoreFocus();
      expect(focus).toHaveBeenCalledOnce();
    } finally {
      trigger.remove();
    }
  });
  it('rechecks the exact page before emitting the authoritative key and readable label', async () => {
    const { fixture, send } = prepare();
    const picker = fixture.componentInstance;
    const picked = vi.fn();
    picker.picked.subscribe(picked);
    await picker.open({ key: 'user_ref_id', path: 'body.user_ref_id' });
    await picker.load(2);
    await picker.choose(picker.rows()[0]);
    expect(send.mock.calls.at(-1)?.[1]).toEqual(send.mock.calls.at(-2)?.[1]);
    expect(picked).toHaveBeenCalledWith({
      path: 'body.user_ref_id',
      value: 'opaque',
      label: 'Readable user',
    });
    expect(picker.visible()).toBe(false);
  });
  it('rejects a name-only response rather than using a display label as a key', async () => {
    const { fixture, send } = prepare();
    send.mockResolvedValue({
      ...(page() as object),
      value: [{ name: 'Not a key' }],
    });
    await fixture.componentInstance.open({
      key: 'user_ref_id',
      path: 'user_ref_id',
    });
    expect(fixture.componentInstance.rows()).toEqual([]);
    expect(fixture.componentInstance.error()).toBeTruthy();
  });
  it('aborts old paging work and fences its late response', async () => {
    const { fixture, send } = prepare();
    let resolveOld!: (value: unknown) => void;
    send.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const picker = fixture.componentInstance;
    const old = picker.open({ key: 'user_ref_id', path: 'user_ref_id' });
    const signal = send.mock.calls[0][2] as AbortSignal;
    send.mockResolvedValue(page('current', 'Current page', 2));
    await picker.load(2);
    resolveOld(page('old', 'Old page'));
    await old;
    expect(signal.aborted).toBe(true);
    expect(picker.page()).toBe(2);
    expect(picker.rows()[0]['key']).toBe('current');
  });
  it('closes on changed context and ignores a pending response', async () => {
    const { fixture, send } = prepare();
    let resolve!: (value: unknown) => void;
    send.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const work = fixture.componentInstance.open({
      key: 'user_ref_id',
      path: 'user_ref_id',
    });
    fixture.componentRef.setInput('context', { connection_ref: 'new-context' });
    fixture.detectChanges();
    resolve(page('old-context', 'Private old label'));
    await work;
    expect(fixture.componentInstance.visible()).toBe(false);
    expect(fixture.componentInstance.rows()).toEqual([]);
  });
  it('retains a same-context picker through unrelated form edits', async () => {
    const { fixture } = prepare();
    await fixture.componentInstance.open({
      key: 'user_ref_id',
      path: 'user_ref_id',
    });
    fixture.componentRef.setInput('context', { name: 'Unrelated edit' });
    fixture.detectChanges();
    expect(fixture.componentInstance.visible()).toBe(true);
  });
  it('does not substitute a revoked selection with a different item', async () => {
    const { fixture, send } = prepare();
    const picker = fixture.componentInstance;
    const picked = vi.fn();
    picker.picked.subscribe(picked);
    await picker.open({ key: 'user_ref_id', path: 'user_ref_id' });
    send.mockResolvedValue(page('other', 'Other user'));
    await picker.choose(picker.rows()[0]);
    expect(picked).not.toHaveBeenCalled();
    expect(picker.rows()).toEqual([]);
    expect(picker.error()).toContain('Choose again');
  });
  it('never accepts an arbitrary object outside the displayed page', async () => {
    const { fixture, send } = prepare();
    await fixture.componentInstance.open({
      key: 'user_ref_id',
      path: 'user_ref_id',
    });
    await fixture.componentInstance.choose({
      key: 'opaque',
      value: 'Forged label',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('clears actor-owned rows and cancels selection work when permissions change', async () => {
    const { fixture, send } = prepare();
    const picker = fixture.componentInstance;
    const picked = vi.fn();
    picker.picked.subscribe(picked);
    await picker.open({ key: 'user_ref_id', path: 'user_ref_id' });
    let resolve!: (value: unknown) => void;
    send.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const choice = picker.choose(picker.rows()[0]);
    TestBed.inject(SessionContext).updatePermissions([]);
    resolve(page());
    await choice;
    expect(picked).not.toHaveBeenCalled();
    expect(picker.rows()).toEqual([]);
  });
  it('aborts in-flight reads on actor reset and route destruction', async () => {
    const { fixture, send } = prepare();
    await fixture.componentInstance.open({
      key: 'user_ref_id',
      path: 'user_ref_id',
    });
    const signal = send.mock.calls[0][2] as AbortSignal;
    TestBed.inject(ActorState).reset();
    expect(signal.aborted).toBe(true);
    expect(fixture.componentInstance.rows()).toEqual([]);
    fixture.destroy();
  });
});
