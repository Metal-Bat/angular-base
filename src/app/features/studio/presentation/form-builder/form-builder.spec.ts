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
const row = {
  ref_id: 'current',
  status: 'DRAFT',
  data_schema: { type: 'object', properties: {} },
  render_schema: { root: { component: 'vertical', children: [] } },
};
describe('Form authoring commands', () => {
  const api = {
    get: vi.fn(async () => structuredClone(row)),
    write: vi.fn(async () => ({ ...row, ref_id: 'next' })),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ ref: 'old' }) },
          },
        },
        { provide: STUDIO_API, useValue: api },
      ],
    });
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
});
