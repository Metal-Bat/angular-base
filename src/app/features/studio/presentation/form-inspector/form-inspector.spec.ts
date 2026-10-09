import { TestBed } from '@angular/core/testing';
import { FormInspector } from './form-inspector';
import { JsonObject } from '../../../forms/domain/runtime-document';
const documents: JsonObject = {
  data_schema: {
    type: 'object',
    properties: { amount: { type: 'integer', minimum: 0 } },
  },
  render_schema: {
    root: {
      component: 'vertical',
      children: [
        {
          component: 'integer',
          node_key: 'stable',
          scope: '/properties/amount',
          options: { read_only: false },
          label: 'Amount',
        },
      ],
    },
  },
  reuse_instances: { retained: true },
};
describe('Typed form inspector', () => {
  it('preserves stable keys, canonical schema, false flags and untouched metadata on apply', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    vm.patch('label', 'Friendly amount');
    vm.apply();
    const next = applied.mock.calls[0][0] as JsonObject;
    const node = ((next['render_schema'] as JsonObject)['root'] as JsonObject)[
      'children'
    ] as JsonObject[];
    expect(node[0]).toMatchObject({
      node_key: 'stable',
      scope: '/properties/amount',
      label: 'Friendly amount',
      options: { read_only: false },
    });
    expect(next['data_schema']).toEqual(documents['data_schema']);
    expect(next['reuse_instances']).toEqual(documents['reuse_instances']);
    fixture.componentRef.setInput('disabled', true);
    vm.patch('label', 'Forbidden');
    vm.apply();
    expect(applied).toHaveBeenCalledTimes(1);
    expect(vm.draft()['label']).toBe('Friendly amount');
  });
  it('guards field references and rule bounds while preserving typed zero and false values', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.ruleScope = '/properties/missing';
    vm.addRule();
    expect(vm.rules()).toEqual([]);
    vm.ruleScope = '/properties/amount';
    vm.ruleValue = 0;
    vm.addRule();
    vm.ruleValue = false;
    vm.addRule();
    expect(vm.rules().map((rule) => rule['value'])).toEqual([0, false]);
    for (let index = 0; index < 20; index++) {
      vm.addRule();
    }
    expect(vm.rules()).toHaveLength(16);
  });
});
