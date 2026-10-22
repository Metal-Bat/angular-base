import { TestBed } from '@angular/core/testing';
import { SchemaInput } from './schema-input';
it('keeps literal payload keys editable and fixed reference controls governed', async () => {
  const fixture = TestBed.createComponent(SchemaInput);
  fixture.componentRef.setInput('controlId', 'test-payload');
  fixture.componentRef.setInput('path', 'payload');
  fixture.componentRef.setInput('schema', {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: { type: 'object', properties: { model_id: { type: 'string' } } },
      },
    },
  });
  fixture.componentRef.setInput('value', {
    rows: [{ model_id: 'literal-model' }],
  });
  fixture.componentRef.setInput('literalValues', true);
  await fixture.whenStable();
  const input = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('#test-payload-rows-0-model_id');
  expect(input().readOnly).toBe(false);
  expect(input().value).toBe('literal-model');
  expect(
    fixture.nativeElement.querySelector('.reference-control button'),
  ).toBeNull();
  const requested = vi.fn();
  fixture.componentInstance.referenceRequested.subscribe(requested);
  fixture.componentRef.setInput('literalValues', false);
  await fixture.whenStable();
  expect(input().readOnly).toBe(true);
  (
    fixture.nativeElement.querySelector(
      '.reference-control button',
    ) as HTMLButtonElement
  ).click();
  expect(requested).toHaveBeenCalledExactlyOnceWith({
    key: 'model_id',
    path: 'payload.rows.0.model_id',
    value: 'literal-model',
  });
});

it('reopens union arrays and switches primitive branches without object placeholders or decimal loss', async () => {
  const fixture = TestBed.createComponent(SchemaInput);
  fixture.componentRef.setInput('controlId', 'test-union');
  fixture.componentRef.setInput('schema', {
    anyOf: [
      { type: 'string' },
      { type: 'integer' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array' },
      { type: 'object' },
    ],
  });
  fixture.componentRef.setInput('value', ['saved']);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  expect(vm.type()).toBe('array');
  expect(vm.items()).toEqual(['saved']);
  vm.selectBranch('1');
  expect(vm.draft()).toBe(0);
  expect(vm.type()).toBe('integer');
  vm.selectBranch('2');
  expect(vm.draft()).toBe(0);
  expect(vm.type()).toBe('number');
  vm.set(1.5);
  expect(vm.type()).toBe('number');
  vm.selectBranch('3');
  expect(vm.draft()).toBe(false);
  expect(vm.type()).toBe('boolean');
  vm.selectBranch('0');
  expect(vm.draft()).toBe('');
  expect(vm.type()).toBe('string');
  fixture.componentRef.setInput('value', { saved: true });
  await fixture.whenStable();
  expect(vm.type()).toBe('object');
});
