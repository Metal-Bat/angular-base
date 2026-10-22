import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { ResourceLinks } from '../../../../core/resources/resource-links';
import { STUDIO_API } from '../../bindings';
import { CatalogActions } from './catalog-actions';

describe('Scoped access command ownership', () => {
  const grant = {
    ref_id: 'grant-one',
    user_ref_id: 'chosen-user',
    work_group_ref_id: null,
    can_view: true,
    can_start: false,
  };
  const action = vi.fn();
  const get = vi.fn();
  const selected = vi.fn();
  let control: CatalogActions;
  const owner = { ref_id: 'definition-current', name: 'Approval' };
  const vm = {
    busy: signal(false),
    dirty: signal(false),
    reconcileRequired: signal(false),
    selected: signal(owner),
    reference: (): string => vm.selected().ref_id,
    key: 'workflows',
    spec: { actions: ['grant', 'grants', 'revoke'] },
    error: signal(''),
    refreshAccessOwner: vi.fn(),
    command: async (send: () => Promise<typeof owner>): Promise<void> => {
      vm.busy.set(true);
      try {
        vm.selected.set(await send());
      } catch {
        vm.reconcileRequired.set(true);
      } finally {
        vm.busy.set(false);
      }
    },
  };
  beforeEach(async () => {
    action
      .mockReset()
      .mockImplementation(async (_key, _ref, operation) =>
        operation === 'grants'
          ? { items: [grant], page: 1, total_pages: 1 }
          : operation === 'grant'
            ? grant
            : {},
      );
    get.mockReset().mockResolvedValue(owner);
    selected.mockReset().mockResolvedValue([{ label: 'Named reviewer' }]);
    vm.busy.set(false);
    vm.dirty.set(false);
    vm.reconcileRequired.set(false);
    vm.selected.set(owner);
    TestBed.configureTestingModule({
      providers: [
        { provide: STUDIO_API, useValue: { action, get } },
        { provide: ResourceLinks, useValue: { selected } },
      ],
    });
    TestBed.overrideComponent(CatalogActions, {
      set: { template: '', imports: [] },
    });
    const fixture = TestBed.createComponent(CatalogActions);
    fixture.componentRef.setInput('view', vm);
    await fixture.whenStable();
    control = fixture.componentInstance;
    await control.open();
    action.mockClear();
  });
  it('freezes the exact recipient/rights before confirmation and keeps the definition identity', async () => {
    control.target = 'chosen-user';
    const work = control.add();
    control.target = 'another-user';
    control.startPermission = true;
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(action).toHaveBeenCalledWith(
      'workflows',
      'definition-current',
      'grant',
      {
        user_ref_id: 'chosen-user',
        work_group_ref_id: null,
        can_view: true,
        can_start: false,
      },
      undefined,
    );
    expect(get).toHaveBeenCalledWith('workflows', 'definition-current');
    expect(vm.selected().ref_id).toBe('definition-current');
    expect(control.rows()[0].recipient).toBe('Named reviewer');
  });
  it('cancels add and revoke without writing and revokes only the selected grant after confirmation', async () => {
    control.target = 'chosen-user';
    let work = control.add();
    TestBed.inject(Feedback).answer(false);
    await work;
    expect(action).not.toHaveBeenCalled();
    const row = control.rows()[0];
    work = control.revoke(row);
    TestBed.inject(Feedback).answer(false);
    await work;
    expect(action).not.toHaveBeenCalled();
    work = control.revoke(row);
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(action).toHaveBeenCalledWith(
      'workflows',
      'definition-current',
      'revoke',
      undefined,
      'grant-one',
    );
    expect(vm.selected().ref_id).toBe('definition-current');
  });
  it('clears pending recipient data and refuses a confirmed command after actor change', async () => {
    control.target = 'chosen-user';
    const work = control.add();
    TestBed.inject(ActorState).reset();
    TestBed.inject(Feedback).answer(true);
    await work;
    expect(action).not.toHaveBeenCalled();
    expect(control.target).toBe('');
    expect(control.visible()).toBe(false);
    expect(control.rows()).toEqual([]);
  });
  it('does not turn unavailable recipient names into copied IDs or destructive actions', async () => {
    selected.mockRejectedValueOnce(Error('Denied'));
    await control.load();
    action.mockClear();
    expect(control.rows()[0].named).toBe(false);
    expect(control.rows()[0].recipient).not.toContain('chosen-user');
    await control.revoke(control.rows()[0]);
    expect(action).not.toHaveBeenCalled();
    expect(TestBed.inject(Feedback).confirmation()).toBeNull();
  });
  it('keeps access open and retains the draft when close is cancelled or a command is busy', async () => {
    control.target = 'chosen-user';
    const work = control.close();
    TestBed.inject(Feedback).answer(false);
    await work;
    expect(control.visible()).toBe(true);
    expect(control.target).toBe('chosen-user');
    vm.busy.set(true);
    await control.close();
    expect(control.visible()).toBe(true);
    expect(TestBed.inject(Feedback).confirmation()).toBeNull();
    expect(action).not.toHaveBeenCalled();
  });
});
