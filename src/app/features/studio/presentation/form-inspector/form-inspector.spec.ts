import { By } from '@angular/platform-browser';
import { FormChoiceRows } from '../form-choice-rows/form-choice-rows';
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
  it('preserves buffered values across property groups until one explicit Apply', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.section()).toBe('general');
    expect(fixture.nativeElement.querySelector('#field-required')).toBeTruthy();
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    vm.patch('label', 'Buffered amount');
    vm.requirement(true);
    vm.section.set('validation');
    vm.constraint({ ...vm.constraints(), maximum: 10 });
    vm.section.set('appearance');
    await fixture.whenStable();
    expect(vm.draft()['label']).toBe('Buffered amount');
    expect(applied).not.toHaveBeenCalled();
    vm.apply();
    expect(applied).toHaveBeenCalledOnce();
    expect(
      (applied.mock.calls[0][0].data_schema as JsonObject)['properties'],
    ).toEqual({ amount: { type: 'integer', minimum: 0, maximum: 10 } });
    expect(
      (applied.mock.calls[0][0].data_schema as JsonObject)['required'],
    ).toEqual(['amount']);
  });
  it('retains the active group after Apply to the same field and resets for another field', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    vm.section.set('appearance');
    vm.patch('label', 'Edited amount');
    vm.apply();
    const next = applied.mock.calls[0][0] as JsonObject;
    fixture.componentRef.setInput('documents', next);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    expect(vm.section()).toBe('appearance');
    const render = next['render_schema'] as JsonObject;
    const root = render['root'] as JsonObject;
    fixture.componentRef.setInput('documents', {
      ...next,
      render_schema: {
        ...render,
        root: {
          ...root,
          children: [
            {
              ...(root['children'] as JsonObject[])[0],
              node_key: 'another-field',
            },
          ],
        },
      },
    });

    await fixture.whenStable();
    expect(vm.section()).toBe('general');
  });
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
  it('blocks Apply while a rule is unfinished without losing other buffered properties', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', documents);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    vm.patch('label', 'Buffered amount');
    vm.rulePending.set(true);
    vm.apply();
    expect(applied).not.toHaveBeenCalled();
    expect(vm.error()).toBe(
      'Add or discard this rule before applying properties.',
    );
    expect(vm.draft()['label']).toBe('Buffered amount');
    vm.rulePending.set(false);
    vm.apply();
    expect(applied).toHaveBeenCalledOnce();
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
      data_schema: {
        type: 'object',
        properties: {
          amount: { type: 'integer' },
          result: { type: 'integer' },
        },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'integer',
              scope: '/properties/amount',
              label: 'Amount',
            },
            {
              component: 'calculated',
              scope: '/properties/result',
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
    fixture.componentRef.setInput('path', [1]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.calculationScope('/properties/missing', true);
    vm.setFunction();
    expect(vm.draft()['calculation']).toEqual({
      expression: '0',
      override_permission: 'forms.manage',
    });
    vm.calculationScope('/properties/amount', true);
    vm.calculationFunction = 'sum';
    vm.setFunction();
    expect(vm.draft()['calculation']).toEqual({
      function: 'sum',
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

describe('Invalid choice transaction', () => {
  it('blocks Apply and retains a typed draft across property sections until repaired', async () => {
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', {
      data_schema: {
        type: 'object',
        properties: { result: { type: 'number' } },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'choice',
              scope: '/properties/result',
              node_key: 'result',
              label: 'Result',
              source: { kind: 'custom', items: [{ key: 0, value: 'Zero' }] },
            },
          ],
        },
      },
    });
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.section.set('choices');
    await fixture.whenStable();
    const choices = fixture.debugElement.query(By.directive(FormChoiceRows))
      .componentInstance as FormChoiceRows;
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    choices.update(choices.rows()[0].id, 'text', '-');
    expect(vm.choiceValid()).toBe(false);
    vm.apply();
    expect(applied).not.toHaveBeenCalled();
    vm.section.set('general');
    vm.patch('label', 'Buffered result');
    vm.section.set('choices');
    await fixture.whenStable();
    expect(choices.rows()[0].text).toBe('-');
    expect(vm.draft()['label']).toBe('Buffered result');
    choices.update(choices.rows()[0].id, 'text', '0');
    vm.apply();
    expect(applied).toHaveBeenCalledOnce();
    expect(applied.mock.lastCall?.[0].data_schema).toEqual({
      type: 'object',
      properties: { result: { type: 'number' } },
    });
  });
});

describe('Choice source and canonical schema authoring', () => {
  it('applies typed zero/false rows and a multiple control as one valid definition change', async () => {
    const source: JsonObject = {
      data_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string', title: 'Answer', retained: false },
        },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'choice',
              scope: '/properties/answer',
              label: 'Answer',
              source: {
                kind: 'custom',
                items: [{ key: 'option1', value: 'Option 1' }],
              },
            },
          ],
        },
      },
    };
    const before = structuredClone(source);
    const fixture = TestBed.createComponent(FormInspector);
    fixture.componentRef.setInput('documents', source);
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    vm.section.set('choices');
    await fixture.whenStable();
    const rows = fixture.debugElement.query(By.directive(FormChoiceRows))
      .componentInstance as FormChoiceRows;
    expect(rows.allowTypeChange()).toBe(true);
    rows.update(rows.rows()[0].id, 'type', 'number');
    rows.update(rows.rows()[0].id, 'text', '0');
    rows.add();
    const second = rows.rows()[1].id;
    rows.update(second, 'label', 'No');
    rows.update(second, 'type', 'boolean');
    rows.update(second, 'text', 'false');
    vm.patch('options', { multiple: true });
    await fixture.whenStable();
    expect(vm.choiceValid()).toBe(true);
    const applied = vi.fn();
    vm.applied.subscribe(applied);
    vm.apply();
    expect(applied).toHaveBeenCalledOnce();
    const next = applied.mock.calls[0][0] as JsonObject;
    const properties = (next['data_schema'] as JsonObject)[
      'properties'
    ] as JsonObject;
    expect(properties['answer']).toEqual({
      type: 'array',
      items: { type: ['integer', 'boolean'] },
      title: 'Answer',
      retained: false,
    });
    expect(source).toEqual(before);
  });
});

it('allows expressions inside a literal items object while preserving repeated-row restrictions', async () => {
  for (const repeated of [false, true]) {
    const fixture = TestBed.createComponent(FormInspector);
    const object: JsonObject = {
      type: 'object',
      properties: { result: { type: 'number' } },
    };
    fixture.componentRef.setInput('documents', {
      data_schema: {
        type: 'object',
        properties: {
          items: repeated ? { type: 'array', items: object } : object,
        },
      },
      render_schema: {
        root: {
          component: 'vertical',
          children: [
            {
              component: 'calculated',
              scope: repeated
                ? '/properties/items/items/properties/result'
                : '/properties/items/properties/result',
              label: 'Result',
            },
          ],
        },
      },
    });
    fixture.componentRef.setInput('path', [0]);
    await fixture.whenStable();
    const vm = fixture.componentInstance;
    expect(vm.expressionAvailable()).toBe(!repeated);
    vm.expression = '1';
    vm.setExpression();
    expect(vm.draft()['calculation']).toEqual(
      repeated ? undefined : { expression: '1' },
    );
    fixture.destroy();
  }
});
