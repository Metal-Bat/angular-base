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
  it('retains invalid grid drafts and canonical fields until corrected', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    vm.patch('grid', { column: 12, span: 2, row: 1 });
    vm.apply();
    expect(applied).not.toHaveBeenCalled();
    expect(vm.error()).toBe('Invalid grid placement');
    expect(vm.draft()['grid']).toEqual({ column: 12, span: 2, row: 1 });
    vm.patch('grid', { column: 2, span: 3, row: 4 });
    vm.patch('accessibility', { label: 'Amount', description: 'Whole units' });
    vm.apply();
    expect(applied.mock.calls[0][0]['data_schema']).toEqual(
      documents['data_schema'],
    );
    expect(applied).toHaveBeenCalledTimes(1);
  });
  it('switches registered functions and expressions while retaining override policy', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    const data: JsonObject = {
      ...documents,
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'calculated',
              scope: '/properties/amount',
              calculation: {
                expression: '0',
                override_permission: 'forms.manage',
              },
            },
          ],
        },
      },
    };
    fixture.componentRef.setInput('documents', data);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.calculationScope('/properties/missing', true);
    vm.setFunction();
    expect(vm.draft()['calculation']).toEqual({
      expression: '0',
      override_permission: 'forms.manage',
    });
    vm.calculationScope('/properties/amount', true);
    vm.calculationFunction = 'count';
    vm.setFunction();
    expect(vm.draft()['calculation']).toEqual({
      function: 'count',
      scopes: ['/properties/amount'],
      override_permission: 'forms.manage',
    });
    vm.expression = '0';
    vm.setExpression();
    expect(vm.draft()['calculation']).toEqual({
      expression: '0',
      override_permission: 'forms.manage',
    });
    fixture.componentRef.setInput('disabled', true);
    vm.calculationFunction = 'sum';
    vm.setFunction();
    expect((vm.draft()['calculation'] as JsonObject)['expression']).toBe('0');
  });
});
