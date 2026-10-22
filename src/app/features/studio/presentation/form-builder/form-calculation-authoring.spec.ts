import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { STUDIO_API } from '../../bindings';
import { FormBuilder } from './form-builder';
import { patchNode } from '../../domain/form-editing';
import { of } from 'rxjs';
const row = {
  ref_id: 'current',
  status: 'DRAFT',
  data_schema: { type: 'object', properties: {} },
  render_schema: { root: { component: 'vertical', children: [] } },
};
describe('Repeated calculation authoring', () => {
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
            paramMap: of(convertToParamMap({ ref: 'current' })),
            snapshot: { paramMap: convertToParamMap({ ref: 'current' }) },
          },
        },
        { provide: STUDIO_API, useValue: api },
      ],
    });
  });
  it('cancels or configures a repeated calculation before preview and save', async () => {
    const fixture = TestBed.createComponent(FormBuilder);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.canUndo()).toBe(false);
    expect(vm.canRedo()).toBe(false);
    vm.quickAdd('repeater');
    vm.quickAdd('text');
    const before = structuredClone(vm.documents());
    vm.quickAdd('calculated');
    expect(vm.calculationPending()).toBe(true);
    expect(vm.pending()).toEqual(['inspector']);
    await vm.save();
    expect(api.write).not.toHaveBeenCalled();
    vm.cancelCalculation();
    expect(vm.documents()).toEqual(before);
    expect(vm.pending()).toEqual([]);
    expect(vm.canRedo()).toBe(true);
    vm.undo(true);
    expect(vm.calculationPending()).toBe(true);
    expect(vm.pending()).toEqual(['inspector']);
    vm.cancelCalculation();
    vm.quickAdd('calculated');
    const next = patchNode(vm.documents(), [0, 1], {
      calculation: {
        function: 'concat',
        scopes: ['/properties/field_1/items/properties/field_2'],
      },
    });
    vm.applyProperties(next);
    expect(vm.calculationPending()).toBe(false);
    expect(vm.pending()).toEqual([]);
    await vm.save();
    expect(api.write).toHaveBeenCalledOnce();
  });
});
