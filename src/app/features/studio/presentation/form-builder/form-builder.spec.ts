import { FormInspector } from '../form-inspector/form-inspector';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormSettings } from '../form-settings/form-settings';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { STUDIO_API } from '../../bindings';
import { FormBuilder } from './form-builder';
import { BehaviorSubject } from 'rxjs';
const row = {
  ref_id: 'current',
  status: 'DRAFT',
  data_schema: { type: 'object', properties: {} },
  render_schema: { root: { component: 'vertical', children: [] } },
};
describe('Form authoring commands', () => {
  let parameters: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const api = {
    get: vi.fn(async () => structuredClone(row)),
    write: vi.fn(async () => ({ ...row, ref_id: 'next' })),
    auxiliary: vi.fn(async (): Promise<unknown> => ({
      valid: true,
      issues: [],
    })),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    parameters = new BehaviorSubject(convertToParamMap({ ref: 'old' }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: parameters,
            snapshot: { paramMap: convertToParamMap({ ref: 'old' }) },
          },
        },
        { provide: STUDIO_API, useValue: api },
      ],
    });
  });
  it('reconciles discarded Settings buffers with the last confirmed saved document', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.markPending('settings-ui');
    vm.discardSettings();
    expect(vm.dirty()).toBe(false);
    vm.quickAdd('text');
    vm.markPending('settings-ui');
    vm.discardSettings();
    expect(vm.dirty()).toBe(true);
    await vm.save();
    vm.markPending('settings-ui');
    vm.discardSettings();
    expect(vm.dirty()).toBe(false);
    vm.quickAdd('integer');
    vm.undo();
    expect(vm.dirty()).toBe(false);
    vm.undo(true);
    expect(vm.dirty()).toBe(true);
  });
  it('preserves Settings buffers on failed reload and clears them only after confirmed successful reload', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const settings = fixture.debugElement.query(By.directive(FormSettings))
      .componentInstance as FormSettings;
    settings.key = 'old-message';
    settings.en = 'Private old draft';
    vm.markPending('settings-ui');
    api.get.mockRejectedValueOnce(Error('offline'));
    const failed = vm.load();
    TestBed.inject(Feedback).answer(true);
    await failed;
    await fixture.whenStable();
    expect(settings.en).toBe('Private old draft');
    expect(vm.pending()).toContain('settings-ui');
    const reload = vm.load();
    TestBed.inject(Feedback).answer(true);
    await reload;
    await fixture.whenStable();
    expect(settings.key).toBe('');
    expect(settings.en).toBe('');
    expect(vm.pending()).toEqual([]);
  });
  it('keeps field properties pending without exposing document editors', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.quickAdd('text');
    vm.quickAdd('integer');
    vm.markPending('inspector');
    expect(vm.select([0])).toBe(false);
    expect(vm.selected()).toEqual([1]);
    expect(
      fixture.nativeElement.querySelector(
        '#node-json, #schema-json, #behavior-json, #sample-json, #preview-context, pre',
      ),
    ).toBeNull();
  });
  it('opens the selected field properties only after successful creation', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.quickAdd('text');
    expect(vm.toolsTab()).toBe('properties');
    expect(vm.toolsOpen()).toBe(true);
    expect(vm.selected()).toEqual([0]);
    vm.toolsTab.set('components');
    vm.pending.set(['inspector']);
    const before = vm.documents();
    vm.quickAdd('integer');
    expect(vm.documents()).toBe(before);
    expect(vm.toolsTab()).toBe('components');
    expect(vm.selected()).toEqual([0]);
  });
  it('opens the affected field from validation issues instead of leaving selection hidden in diagnostics', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.quickAdd('text');
    vm.diagnostics.set(
      JSON.stringify({
        issues: [
          {
            pointer: '/render_schema/root/children/0/options',
            code: 'render.invalid',
          },
        ],
      }),
    );
    vm.workspaceTab.set('diagnostics');
    vm.previewMode.set(true);
    await fixture.whenStable();
    const issue = fixture.nativeElement.querySelector(
      '.diagnostics-mode li button',
    ) as HTMLButtonElement;
    issue.click();
    await fixture.whenStable();
    expect(vm.workspaceTab()).toBe('design');
    expect(vm.previewMode()).toBe(false);
    expect(vm.toolsTab()).toBe('properties');
    expect(vm.selected()).toEqual([0]);
    expect(document.activeElement?.id).toBe('field-label');
  });
  it('keeps uncommitted inspector text and the active mode when an issue cannot be selected', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.quickAdd('text');
    vm.quickAdd('integer');
    await fixture.whenStable();
    const inspector = fixture.debugElement.query(By.directive(FormInspector))
      .componentInstance as FormInspector;
    inspector.patch('label', 'Unfinished title');
    vm.markPending('inspector');
    vm.diagnostics.set(
      JSON.stringify({
        issues: [
          {
            pointer: '/render_schema/root/children/0/options',
            code: 'render.invalid',
          },
        ],
      }),
    );
    vm.workspaceTab.set('diagnostics');
    await fixture.whenStable();
    const issue = fixture.nativeElement.querySelector(
      '.diagnostics-mode li button',
    ) as HTMLButtonElement;
    issue.click();
    await fixture.whenStable();
    expect(vm.workspaceTab()).toBe('diagnostics');
    expect(vm.selected()).toEqual([1]);
    expect(inspector.draft()['label']).toBe('Unfinished title');
    expect(vm.pending()).toContain('inspector');
  });
  it('opens validation results and fences option inspection results from a previous selection', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    await vm.validate();
    expect(vm.workspaceTab()).toBe('diagnostics');
    vm.quickAdd('text');
    vm.quickAdd('choice');
    vm.diagnostics.set('');
    let resolve!: (value: unknown) => void;
    api.auxiliary.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const loading = vm.inspect('options', {
      node_pointer: '/root/children/1',
      data: {},
    });
    expect(api.auxiliary).toHaveBeenLastCalledWith(
      'options',
      expect.objectContaining({ locale: 'en' }),
    );
    vm.select([0]);
    resolve({ state: 'READY', items: [{ value: 'Stale option' }] });
    await loading;
    expect(vm.diagnostics()).toBe('');
    expect(vm.selected()).toEqual([0]);
  });
  it('reloads a changed route reference and fences the previous draft during the new read', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.primitive = 'grid';
    vm.add();
    const before = structuredClone(vm.documents());
    parameters.next(convertToParamMap({ ref: 'published' }));
    TestBed.inject(Feedback).answer(false);
    await fixture.whenStable();
    expect(vm.documents()).toEqual(before);
    expect(vm.reference()).toBe('current');
    api.get.mockResolvedValueOnce({
      ...row,
      ref_id: 'published',
      status: 'PUBLISHED',
    });
    parameters.next(convertToParamMap({ ref: 'another-published' }));
    TestBed.inject(Feedback).answer(true);
    await fixture.whenStable();
    expect(api.get).toHaveBeenLastCalledWith(
      'form-versions',
      'another-published',
    );
    await vi.waitFor(() => expect(vm.reference()).toBe('published'));
    expect(vm.readonly()).toBe(true);
    expect(vm.outline()).toHaveLength(1);
    vm.undo();
    expect(vm.outline()).toHaveLength(1);
  });
  it('saves through the current reference, restores edits with undo, and fences published mutations', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.primitive = 'boolean';
    vm.propertyName = 'flag';
    vm.componentLabel = 'Friendly flag';
    vm.add();
    const next = vm.documents();
    expect(vm.outline()).toHaveLength(2);
    vm.undo();
    expect(vm.outline()).toHaveLength(1);
    vm.undo(true);
    expect(vm.documents()).toEqual(next);
    await vm.save();
    expect(api.write).toHaveBeenCalledWith('form-versions', 'current', next);
    expect(vm.reference()).toBe('next');
    vm.status.set('PUBLISHED');
    vm.add();
    vm.applyProperties({ ...next, page_settings: {} });
    await vm.save();
    expect(vm.documents()).toEqual(next);
    expect(api.write).toHaveBeenCalledTimes(1);
  });
  it('preserves edits after a failed save and ignores a late response after actor reset', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.primitive = 'boolean';
    vm.propertyName = 'flag';
    vm.add();
    const next = vm.documents();
    api.write.mockRejectedValueOnce(Error('failure'));
    await vm.save();
    expect(vm.documents()).toEqual(next);
    expect(vm.dirty()).toBe(true);
    let resolve!: (value: typeof row) => void;
    api.write.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pending = vm.save();
    TestBed.inject(ActorState).reset();
    resolve({ ...row, ref_id: 'late' });
    await pending;
    expect(vm.reference()).toBe('');
    expect(vm.outline()).toHaveLength(1);
    expect(vm.dirty()).toBe(false);
    vm.undo();
    expect(vm.outline()).toHaveLength(1);
  });
  it('clears old undo snapshots on an explicitly confirmed reload', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.propertyName = 'flag';
    vm.add();
    const loading = vm.load();
    TestBed.inject(Feedback).answer(true);
    await loading;
    expect(vm.outline()).toHaveLength(1);
    vm.undo();
    expect(vm.outline()).toHaveLength(1);
  });
  it('preserves placement history, pending edits and published fences', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.primitive = 'grid';
    vm.add();
    vm.primitive = 'horizontal';
    vm.add();
    vm.select([0]);
    vm.primitive = 'text';
    vm.propertyName = 'name';
    vm.add();
    vm.select([0, 0]);
    const before = structuredClone(vm.documents());
    vm.markPending('inspector');
    vm.reparent([1]);
    expect(vm.documents()).toEqual(before);
    vm.pending.set([]);
    vm.reparent([1]);
    expect(vm.selected()).toEqual([1, 0]);
    const moved = structuredClone(vm.documents());
    vm.undo();
    expect(vm.documents()).toEqual(before);
    expect(vm.selected()).toEqual([0, 0]);
    vm.undo(true);
    expect(vm.documents()).toEqual(moved);
    expect(vm.selected()).toEqual([1, 0]);
    vm.select([1]);
    vm.duplicate();
    expect(vm.selected()).toEqual([2]);
    const duplicated = structuredClone(vm.documents());
    expect(duplicated['data_schema']).toEqual(before['data_schema']);
    await vm.save();
    expect(api.write).toHaveBeenCalledWith(
      'form-versions',
      'current',
      duplicated,
    );
    vm.status.set('PUBLISHED');
    vm.reparent([]);
    vm.duplicate();
    expect(vm.documents()).toEqual(duplicated);
  });
  it('adds fields visually with fresh keys, selects new cards and preserves pending and published edits', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.quickAdd('text');
    const first = structuredClone(vm.documents());
    expect(vm.selected()).toEqual([0]);
    expect(vm.outline()[1].scope).toBe('/properties/field_1');
    vm.quickAdd('boolean');
    expect(vm.selected()).toEqual([1]);
    expect(vm.outline()[2].scope).toBe('/properties/field_2');
    vm.undo();
    expect(vm.documents()).toEqual(first);
    vm.markPending('inspector');
    vm.quickAdd('date');
    expect(vm.documents()).toEqual(first);
    vm.pending.set([]);
    vm.status.set('PUBLISHED');
    vm.quickAdd('choice');
    expect(vm.documents()).toEqual(first);
  });
});
