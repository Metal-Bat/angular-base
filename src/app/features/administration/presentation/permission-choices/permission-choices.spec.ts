import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { ADMIN_API } from '../../bindings';
import { AdminCommand } from '../../domain/admin-command';
import { PermissionChoices } from './permission-choices';
const command: AdminCommand = {
  id: 'permissions',
  title: 'Permissions',
  permission: 'admin.permissions.manage',
  mutation: false,
  method: 'post',
  path: '/api/v1/admin/permissions/search',
  bodyRequired: true,
  fields: { body: [], path: [], query: [] },
};
function prepare(
  send = vi.fn().mockResolvedValue({
    value: [{ name: 'requests.start', description: 'Start' }],
    page: 1,
    totalPages: 2,
  }),
): {
  fixture: ReturnType<typeof TestBed.createComponent<PermissionChoices>>;
  send: ReturnType<typeof vi.fn>;
} {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: ADMIN_API,
        useValue: { commands: (): AdminCommand[] => [command], send },
      },
    ],
  });
  TestBed.inject(SessionContext).resolve({
    status: 'authenticated',
    permissions: [command.permission],
  });
  const fixture = TestBed.createComponent(PermissionChoices);
  fixture.componentRef.setInput('controlId', 'permissions');
  fixture.componentRef.setInput('value', ['legacy.permission']);
  fixture.detectChanges();
  return { fixture, send };
}
describe('Permission selection', () => {
  it('retains absent selections across search pages and emits only explicit draft choices', async () => {
    const { fixture, send } = prepare();
    await fixture.whenStable();
    const picker = fixture.componentInstance;
    const chosen: string[][] = [];
    picker.valueChange.subscribe((value) => chosen.push(value));
    picker.toggle('requests.start');
    picker.search.set('other');
    await picker.load(2);
    expect(picker.selected()).toEqual(['legacy.permission', 'requests.start']);
    expect(chosen).toEqual([['legacy.permission', 'requests.start']]);
    expect(send.mock.calls[1][1].body).toMatchObject({
      page: 2,
      size: 20,
      filters: [
        { field_name: 'deleted_at', operation: 'isNull', value: null },
        { field_name: 'name', operation: 'contains', value: 'other' },
      ],
    });
    picker.toggle('legacy.permission');
    expect(picker.selected()).toEqual(['requests.start']);
  });
  it('discards late permission responses and selections on actor change', async () => {
    let resolve!: (value: unknown) => void;
    const { fixture } = prepare(
      vi.fn(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      ),
    );
    TestBed.inject(ActorState).reset();
    resolve({
      value: [{ name: 'private.permission' }],
      page: 1,
      totalPages: 1,
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.rows()).toEqual([]);
    expect(fixture.componentInstance.selected()).toEqual([]);
    expect(fixture.componentInstance.busy()).toBe(false);
  });
});
