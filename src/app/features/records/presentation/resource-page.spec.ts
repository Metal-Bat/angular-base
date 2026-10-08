import { TestBed } from '@angular/core/testing';
import { BinaryTransfer } from '../../../core/transport/binary-transfer';
import { BoundedPolling } from '../../../core/transport/bounded-polling';
import { provideHttpClient } from '@angular/common/http';
import { ResourcePage } from './resource-page';
import {
  HISTORY_DEFINITION,
  RECORD_DEFINITION,
  RECORDS,
  ROLE_DEFINITION,
} from '../bindings';
import { recordDefinitions } from '../infrastructure/record-definitions';
import { SessionContext } from '../../../core/auth/session-context';
import { ActorState } from '../../../core/auth/actor-state';
import { AuthSession } from '../../../core/auth/auth-session';
import { Feedback } from '../../../core/feedback/feedback';
import { emptyQuery } from '../../../shared/domain/list-query';
import { ApiFailure } from '../../../core/transport/api-failure';
const user = {
  ref_id: 'user-v2',
  username: 'Ali',
  is_active: true,
  deleted_at: null,
};
const result = { items: [user], page: 1, size: 20, total: 1, totalPages: 1 };
describe('List-first CRUD controller', () => {
  it('fetches the current detail before opening an edit from a selector row', async () => {
    const detail = vi.mocked(TestBed.inject(RECORDS).detail);
    detail.mockResolvedValue({
      ...user,
      ref_id: 'fresh-user',
      username: 'Fresh name',
    });
    await page.editRow({ key: 'selector-user', value: 'Old name' });
    expect(page.mode()).toBe('edit');
    expect(page.detail()?.['ref_id']).toBe('fresh-user');
    expect(page.values['username']).toBe('Fresh name');
  });
  it('does not edit a record found to be deleted after refreshing detail', async () => {
    vi.mocked(TestBed.inject(RECORDS).detail).mockResolvedValue({
      ...user,
      is_active: false,
    });
    await page.editRow({ key: 'selector-user', value: 'Old name' });
    expect(page.mode()).toBeNull();
  });
  let list: ReturnType<typeof vi.fn>;
  let command: ReturnType<typeof vi.fn>;
  let page: ResourcePage;
  beforeEach(async () => {
    list = vi.fn().mockResolvedValue(result);
    command = vi.fn().mockResolvedValue({ ...user, ref_id: 'user-v3' });
    TestBed.configureTestingModule({
      providers: [
        { provide: HISTORY_DEFINITION, useValue: recordDefinitions['history'] },
        BinaryTransfer,
        BoundedPolling,
        provideHttpClient(),
        {
          provide: RECORDS,
          useValue: { list, command, detail: vi.fn().mockResolvedValue(user) },
        },
        {
          provide: RECORD_DEFINITION,
          useValue: recordDefinitions['admin-users'],
        },
        { provide: ROLE_DEFINITION, useValue: recordDefinitions['roles'] },
        {
          provide: AuthSession,
          useValue: { revalidate: vi.fn().mockResolvedValue(undefined) },
        },
      ],
    });
    TestBed.inject(SessionContext).resolve({
      status: 'authenticated',
      permissions: ['admin.users.manage', 'admin.permissions.manage'],
    });
    page = TestBed.runInInjectionContext(() => new ResourcePage());
    await vi.waitFor(() => expect(page.page()).toEqual(result));
  });
  it('loads the first list without opening a command form', () => {
    expect(list.mock.calls[0][0].key).toBe('admin-users');
    expect(page.mode()).toBeNull();
    expect(command).not.toHaveBeenCalled();
  });
  it('reports only the last successful query including its admin partition', async () => {
    const q = emptyQuery();
    q.filters = [
      { field_name: 'username', operation: 'contains', value: 'Ali' },
    ];
    q.sort_orders = [
      { multi_field: ['username', 'created_at'], operation: 'desc' },
    ];
    await page.load(q);
    q.filters[0].value = 'unapplied';
    const work = page.report();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command.mock.calls[0][1]).toEqual({
      page: 1,
      size: 20,
      filters: [
        { field_name: 'is_superuser', operation: 'equal', value: true },
        { field_name: 'username', operation: 'contains', value: 'Ali' },
      ],
      sort_orders: [
        { multi_field: ['username', 'created_at'], operation: 'desc' },
      ],
    });
  });
  it('creates an administrator from the dedicated partition and clears its password', async () => {
    page.create();
    page.values = {
      username: 'New administrator',
      password: 'fixture-create-password',
    };
    const work = page.saveForm();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command.mock.calls[0][1]['is_superuser']).toBe(true);
    expect(command.mock.calls[0][2]).toBeUndefined();
    expect(page.values).toEqual({});
    expect(page.mode()).toBeNull();
  });
  it('clears a successfully reset password and reloads the current detail', async () => {
    command.mockResolvedValueOnce(null);
    page.detail.set(user);
    page.resetPassword();
    page.password = 'fixture-reset-password';
    const work = page.saveForm();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(page.password).toBe('');
    expect(page.mode()).toBeNull();
    expect(page.detail()?.['ref_id']).toBe('user-v2');
  });
  it('retains applied results when a new query fails', async () => {
    list.mockRejectedValueOnce(Error('offline'));
    await page.load({ ...emptyQuery(), size: 50 });
    expect(page.page()).toEqual(result);
    expect(page.applied().size).toBe(20);
  });
  it('freezes current reference and edits through confirmation then replaces the version', async () => {
    page.detail.set(user);
    page.edit();
    page.values['username'] = 'Edited';
    const work = page.saveForm();
    page.values['username'] = 'Later';
    page.detail.set({ ...user, ref_id: 'other' });
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command.mock.calls[0][1]['username']).toBe('Edited');
    expect(command.mock.calls[0][1]['ref_id']).toBe('user-v2');
    expect(command.mock.calls[0][2]).toEqual({ ref_id: 'user-v2' });
    expect(page.detail()?.['ref_id']).toBe('user-v3');
  });
  it('selection in the role window never writes before Save', async () => {
    page.detail.set(user);
    page.assignRole();
    await vi.waitFor(() => expect(page.actionBusy()).toBe(false));
    page.selectedRole.set({ name: 'reviewer' });
    expect(command).not.toHaveBeenCalled();
    const work = page.saveRole();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command.mock.calls[0][1]).toEqual({ role_name: 'reviewer' });
    expect(command.mock.calls[0][2]).toEqual({ ref_id: 'user-v2' });
  });
  it('canceling a mutation retains edits and makes no backend write', async () => {
    page.detail.set(user);
    page.edit();
    page.values['username'] = 'Edited';
    const work = page.saveForm();
    TestBed.inject(Feedback).answer(false);
    await work;
    expect(command).not.toHaveBeenCalled();
    expect(page.mode()).toBe('edit');
    expect(page.values['username']).toBe('Edited');
  });
  it('actor cleanup cancels pending writes and clears transient passwords', async () => {
    page.detail.set(user);
    page.resetPassword();
    page.password = 'fixture-reset-password';
    const work = page.saveForm();
    TestBed.inject(ActorState).reset();
    await work;
    expect(command).not.toHaveBeenCalled();
    expect(page.password).toBe('');
    expect(page.detail()).toBeNull();
    expect(page.page()).toBeNull();
  });
  it('soft delete and restore target current opaque references', async () => {
    page.detail.set(user);
    let work = page.remove();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command.mock.calls[0][2]).toEqual({ ref_id: 'user-v2' });
    page.detail.set({ ...user, ref_id: 'deleted-v3', is_active: false });
    work = page.restore();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command.mock.calls[1][2]).toEqual({ ref_id: 'deleted-v3' });
    expect(page.detail()?.['ref_id']).toBe('user-v3');
  });
  it('retains a stale edit for explicit reload and never retries mutation', async () => {
    page.detail.set(user);
    page.edit();
    page.values['username'] = 'Edited';
    command.mockRejectedValueOnce(new ApiFailure(409, 'conflict', null, []));
    const work = page.saveForm();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(command).toHaveBeenCalledTimes(1);
    expect(page.mode()).toBe('edit');
    expect(page.error()).toContain('Reload');
  });
});
