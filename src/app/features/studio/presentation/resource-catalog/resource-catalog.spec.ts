import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { ApiFailure } from '../../../../core/transport/api-failure';
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
  const history = vi.fn();
  beforeEach(async () => {
    write.mockReset();
    history
      .mockReset()
      .mockResolvedValue({ items: [], page: 2, totalPages: 2 });
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
            queryParamMap: of(convertToParamMap({})),
            snapshot: {
              data: { resourceKey: 'request-types' },
              queryParamMap: convertToParamMap({}),
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
            history,
          },
        },
      ],
    });
    await TestBed.compileComponents();
  });
  it('keeps history evidence on failure and clears the old selection on successful paging', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    await fixture.whenStable();
    const editor = fixture.componentInstance;
    await editor.open('listed');
    const old = { operation: 'update', from_values: { name: 'Old' } };
    editor.historyDetail.set(old);
    history.mockRejectedValueOnce(new Error('offline'));
    await editor.history(2);
    expect(editor.historyDetail()).toBe(old);
    expect(editor.error()).toBe('History is unavailable');
    await editor.history(2);
    expect(editor.historyDetail()).toBeNull();
    expect(editor.auditPage()).toBe(2);
    expect(editor.error()).toBe('');
    expect(write).not.toHaveBeenCalled();
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
  it.each([
    ['uncertain', new ApiFailure(0, null, null, [], true)],
    ['revision', new ApiFailure(409, 'revision', null, [])],
  ])(
    'requires authoritative refresh after %s even when an input changes',
    async (_kind, error) => {
      const fixture = TestBed.createComponent(ResourceCatalog);
      const editor = fixture.componentInstance;
      await fixture.whenStable();
      await editor.open('current');
      editor.edit();
      editor.change(name, 'Pending rename');
      write.mockRejectedValueOnce(error);
      await editor.save();
      editor.change(name, 'Still unsaved');
      expect(editor.values()['name']).toBe('Still unsaved');
      expect(editor.canSave()).toBe(false);
      await editor.save();
      expect(write).toHaveBeenCalledTimes(1);
      const refresh = editor.open('current');
      TestBed.inject(Feedback).answer(true);
      await refresh;
      editor.edit();
      expect(editor.values()['name']).toBe('Original');
      expect(editor.canSave()).toBe(true);
    },
  );
  it('allows explicit correction after known validation rejection and preserves restrictions', async () => {
    const fixture = TestBed.createComponent(ResourceCatalog);
    const editor = fixture.componentInstance;
    await fixture.whenStable();
    await editor.open('current');
    editor.edit();
    write.mockRejectedValueOnce(new ApiFailure(422, 'validation', null, []));
    editor.change(name, 'Rejected');
    await editor.save();
    editor.change(name, 'Corrected');
    write.mockResolvedValueOnce({ ref_id: 'next', name: 'Corrected' });
    await editor.save();
    expect(write).toHaveBeenCalledTimes(2);
    expect(write.mock.calls[1][2]['client_targets']).toEqual([
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
  it('previews the successfully applied report page without replacing the list', async () => {
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
      items: [{ ref_id: 'report-row', name: 'Actual result' }],
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
    expect(editor.reportResult()).toEqual([
      { ref_id: 'report-row', name: 'Actual result' },
    ]);
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
});
