import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { FieldSpec } from '../../domain/authoring';
import { STUDIO_API } from '../../bindings';
import { ResourceCatalog } from './resource-catalog';
const name: FieldSpec = {
  key: 'name',
  title: 'Name',
  type: 'text',
  required: true,
  nullable: false,
  options: [],
  initial: undefined,
  schema: {},
};
const targets: FieldSpec = {
  ...name,
  key: 'client_targets',
  title: 'Client targets',
  type: 'json',
  required: false,
};
describe('Definition command protection', () => {
  it('opens direct editing from refreshed detail and blocks freshly published versions', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    const editor = fixture.componentInstance;
    await fixture.whenStable();
    await editor.editRow({ ref_id: 'listed', name: 'Old name' });
    expect(editor.formOpen()).toBe(true);
    expect(editor.values()['name']).toBe('Original');
    await editor.closeForm();
    get.mockResolvedValue({
      ref_id: 'published',
      name: 'Published',
      status: 'PUBLISHED',
    });
    await editor.editRow({ ref_id: 'listed', name: 'Old name' });
    expect(editor.formOpen()).toBe(false);
  });
  const write = vi.fn();
  const get = vi.fn();
  const search = vi.fn();
  const action = vi.fn();
  beforeEach(async () => {
    write.mockReset();
    action.mockReset().mockResolvedValue({});
    search.mockReset().mockResolvedValue({
      items: [{ ref_id: 'listed', name: 'Listed' }],
      page: 1,
      totalPages: 2,
    });
    get.mockResolvedValue({
      ref_id: 'current',
      name: 'Original',
      client_targets: [{ client_ref_id: 'protected-client' }],
    });
    TestBed.configureTestingModule({
      imports: [ResourceCatalog],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { resourceKey: 'request-types' },
              queryParamMap: { get: (): null => null },
            },
          },
        },
        {
          provide: STUDIO_API,
          useValue: {
            spec: (): unknown => ({
              key: 'request-types',
              title: 'Request types',
              fields: [name, targets],
              createFields: [name, targets],
              queryFields: [],
              actions: ['update'],
            }),
            search,
            get,
            write,
            action,
          },
        },
      ],
    });
    await TestBed.compileComponents();
  });
  it('preserves restrictions on rename and blocks invalid JSON even after another edit', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    const editor = fixture.componentInstance;
    await fixture.whenStable();
    await editor.open('current');
    editor.change(targets, '{invalid');
    editor.change(name, 'Renamed');
    await editor.save();
    expect(editor.canSave()).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(editor.values()['client_targets']).toEqual([
      { client_ref_id: 'protected-client' },
    ]);
  });
  it('requires explicit confirmation to clear existing client restrictions', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    const editor = fixture.componentInstance;
    await fixture.whenStable();
    await editor.open('current');
    editor.change(targets, '[]');
    const saving = editor.save();
    expect(TestBed.inject(Feedback).confirmation()).not.toBeNull();
    TestBed.inject(Feedback).answer(false);
    await saving;
    expect(write).not.toHaveBeenCalled();
  });
  it('clears one-time client secrets and selected data on actor reset', async () => {
    get.mockResolvedValue({
      client: { ref_id: 'client', name: 'Client' },
      secret: 'only-once',
    });
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    await editor.open('client');
    expect(editor.secret()).toBe('only-once');
    TestBed.inject(ActorState).reset();
    expect(editor.secret()).toBe('');
    expect(editor.selected()).toBeNull();
    expect(editor.values()).toEqual({});
  });
  it('reports the successfully applied list and keeps the table after queuing', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    const filters = [
      { field_name: 'name', operation: 'contains', value: 'applied' },
    ];
    await editor.load(1, false, {
      size: 35,
      filters,
      sort_orders: [{ field_name: 'name', operation: 'desc' }],
    });
    const table = editor.items();
    editor.query.set({
      filters: [{ field_name: 'name', operation: 'equal', value: 'draft' }],
    });
    search.mockResolvedValueOnce({
      items: [{ ref_id: 'report', status: 'QUEUED' }],
      page: 1,
      totalPages: 1,
    });
    const report = editor.load(editor.page(), true);
    TestBed.inject(Feedback).answer(true);
    await report;
    expect(search).toHaveBeenLastCalledWith(
      'request-types',
      1,
      {
        size: 35,
        filters,
        sort_orders: [{ field_name: 'name', operation: 'desc' }],
        page: 1,
      },
      true,
    );
    expect(editor.items()).toBe(table);
    expect(editor.queuedReport()?.['status']).toBe('QUEUED');
  });
  it('retains the applied query and rows when a new search fails', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    const applied = editor.appliedQuery();
    const rows = editor.items();
    search.mockRejectedValueOnce(Error('offline'));
    await editor.load(1, false, {
      filters: [{ field_name: 'name', operation: 'equal', value: 'failed' }],
    });
    expect(editor.appliedQuery()).toBe(applied);
    expect(editor.items()).toBe(rows);
    await editor.load(2);
    expect(search).toHaveBeenLastCalledWith(
      'request-types',
      2,
      { ...applied, page: 2 },
      false,
    );
  });
  it('keeps invalid JSON editable and cancels without persisting changes', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    await editor.open('current');
    editor.edit();
    editor.change(targets, '{');
    expect(editor.controlsDisabled()).toBe(false);
    editor.change(targets, '[]');
    expect(editor.canSave()).toBe(true);
    const closing = editor.closeForm();
    TestBed.inject(Feedback).answer(true);
    await closing;
    expect(editor.formOpen()).toBe(false);
    expect(editor.values()['client_targets']).toEqual([
      { client_ref_id: 'protected-client' },
    ]);
    expect(write).not.toHaveBeenCalled();
  });
  it('prevents editing published and retired versions', async () => {
    get.mockResolvedValue({
      ref_id: 'published',
      name: 'Published',
      status: 'PUBLISHED',
    });
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    await fixture.componentInstance.open('published');
    expect(fixture.componentInstance.immutable()).toBe(true);
    expect(fixture.componentInstance.canSave()).toBe(false);
  });
  it('freezes a grant target and document while confirmation is pending', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    await editor.open('current');
    editor.grantBody = '{"target":"reviewer"}';
    const granting = editor.grant();
    editor.grantBody = '{"target":"other"}';
    editor.selected.set({ ref_id: 'other' });
    TestBed.inject(Feedback).answer(true);
    await granting;
    expect(action).toHaveBeenCalledWith(
      'request-types',
      'current',
      'grant',
      { target: 'reviewer' },
      undefined,
    );
  });
  it('does not send a confirmed grant after the actor changes', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    await editor.open('current');
    editor.grantBody = '{"target":"reviewer"}';
    const granting = editor.grant();
    TestBed.inject(ActorState).reset();
    TestBed.inject(Feedback).answer(true);
    await granting;
    expect(action).not.toHaveBeenCalled();
  });
});
