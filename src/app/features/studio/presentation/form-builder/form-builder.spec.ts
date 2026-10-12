import { TestBed } from '@angular/core/testing';
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
