import { ApiFailure } from '../../../core/transport/api-failure';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../core/auth/actor-state';
import { Feedback } from '../../../core/feedback/feedback';
import { PersonalCollections } from '../../../core/resources/personal-collections';
import { SavedViews } from './saved-views';
describe('Applied saved views and authoritative revisions', () => {
  const original = {
    ref_id: 'view-current',
    name: 'My restricted view',
    compatible: true,
    resource_kind: 'business_requests',
    is_default: false,
  };
  const views = vi.fn();
  const save = vi.fn();
  const makeDefault = vi.fn();
  const readView = vi.fn();
  beforeEach(() => {
    views.mockReset().mockResolvedValue({ items: [original], totalPages: 1 });
    save.mockReset();
    makeDefault.mockReset();
    readView.mockReset();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PersonalCollections,
          useValue: { views, save, view: readView, default: makeDefault },
        },
        {
          provide: Feedback,
          useValue: { confirm: vi.fn().mockResolvedValue(true) },
        },
      ],
    });
  });
  async function setup(): Promise<SavedViews> {
    const fixture = TestBed.createComponent(SavedViews);
    fixture.componentRef.setInput('kind', 'business_requests');
    fixture.componentRef.setInput('query', {
      page: 4,
      size: 35,
      scope: 'mine',
      filters: [{ field_name: 'status', operation: 'equal', value: 'RUNNING' }],
      sort_orders: [],
    });
    fixture.componentRef.setInput('columns', ['status', 'created_at']);
    await fixture.whenStable();
    return fixture.componentInstance;
  }
  it('keeps an uncertain command unchanged without saving a page offset or partially edited replacement', async () => {
    save
      .mockRejectedValueOnce(Error('Connection lost'))
      .mockResolvedValue(original);
    const vm = await setup();
    vm.name = 'My restricted view';
    await vm.run('save');
    const body = structuredClone(save.mock.calls[0][0]);
    expect(body.page_size).toBe(35);
    expect(body.column_keys).toEqual(['status', 'created_at']);
    expect(body.query).not.toHaveProperty('page');
    expect(body.query).not.toHaveProperty('size');
    expect(vm.uncertain()).toBe(true);
    vm.name = 'Different intent';
    await vm.run('save');
    expect(save.mock.calls[1]).toEqual([body, undefined]);
    expect(vm.uncertain()).toBe(false);
  });
  it('uses the returned default revision and clears private selections on account change', async () => {
    const vm = await setup();
    vm.choose(original.ref_id);
    const current = { ...original, ref_id: 'view-next', is_default: true };
    makeDefault.mockResolvedValue(current);
    views.mockResolvedValue({ items: [current], totalPages: 1 });
    await vm.run('default');
    expect(vm.selected()).toBe(current.ref_id);
    expect(vm.compatible()).toBe(true);
    TestBed.inject(ActorState).reset();
    expect(vm.selected()).toBe('');
    expect(vm.views()).toEqual([]);
  });
  it('allows navigation while a read is loading, and still confirms unsaved edits', async () => {
    const vm = await setup();
    let finish!: (value: unknown) => void;
    views.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const loading = vm.load();
    expect(vm.busy()).toBe(true);
    expect(await vm.canLeave()).toBe(true);
    expect(TestBed.inject(Feedback).confirm).not.toHaveBeenCalled();
    vm.name = 'Unsaved name';
    expect(await vm.canLeave()).toBe(true);
    expect(TestBed.inject(Feedback).confirm).toHaveBeenCalledOnce();
    finish({ items: [], totalPages: 0 });
    await loading;
  });
  it('preserves incompatible restrictions and requires explicit repair before replacing a view', async () => {
    const incompatible = {
      ...original,
      compatible: false,
      query: {
        filters: [
          {
            field_name: 'removed_private_filter',
            operation: 'equal',
            value: 'restricted',
          },
        ],
      },
    };
    views.mockResolvedValue({ items: [incompatible], totalPages: 1 });
    const vm = await setup();
    vm.choose(original.ref_id);
    await vm.run('update');
    expect(vm.repairOpen()).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(vm.original()?.query).toEqual(incompatible.query);
    vm.repairOpen.set(false);
    expect(vm.original()?.query).toEqual(incompatible.query);
    save.mockResolvedValue(original);
    await vm.run('update', true);
    expect(save.mock.calls[0][0].query.filters).toEqual([
      { field_name: 'status', operation: 'equal', value: 'RUNNING' },
    ]);
    expect(save.mock.calls[0][1]).toBe(original.ref_id);
  });
  it('keeps edits after a confirmed conflict and reads the current reference without replaying the write', async () => {
    save.mockRejectedValueOnce(
      new ApiFailure(409, null, null, [], false, 'revision'),
    );
    const vm = await setup();
    vm.choose(original.ref_id);
    vm.name = 'Preserved edit';
    await vm.run('update');
    expect(vm.uncertain()).toBe(false);
    expect(vm.name).toBe('Preserved edit');
    await vm.run('update');
    expect(save).toHaveBeenCalledOnce();
    const current = { ...original, ref_id: 'view-current-after-another-tab' };
    views.mockResolvedValue({ items: [current], totalPages: 1 });
    readView.mockResolvedValue(current);
    await vm.load();
    expect(readView).toHaveBeenCalledWith(original.ref_id);
    expect(vm.selected()).toBe(current.ref_id);
    expect(vm.name).toBe('Preserved edit');
    expect(save).toHaveBeenCalledOnce();
    save.mockResolvedValue(current);
    await vm.run('update');
    expect(save.mock.calls[1][1]).toBe(current.ref_id);
  });
});
