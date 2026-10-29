import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { ObjectFieldMapping } from './object-field-mapping';
async function setup(): Promise<
  ReturnType<typeof TestBed.createComponent<ObjectFieldMapping>>
> {
  const fixture = TestBed.createComponent(ObjectFieldMapping);
  const port = {
    key: 'data',
    direction: 'INPUT',
    cardinality: 'SCALAR',
    schema: { type: 'object' },
  };
  fixture.componentRef.setInput('graph', { bindings: [] });
  fixture.componentRef.setInput('step', 'assemble');
  fixture.componentRef.setInput('port', port);
  fixture.componentRef.setInput('nodes', [
    {
      key: 'assemble',
      title: 'Assemble',
      position: { x: 0, y: 0 },
      ports: [port],
    },
  ]);
  fixture.componentRef.setInput('sources', []);
  await fixture.whenStable();
  return fixture;
}
it('authors explicit false and null through typed controls and retains invalid input for correction', async () => {
  const fixture = await setup();
  const vm = fixture.componentInstance;
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.name.set('enabled');
  vm.kind.set('boolean');
  vm.choose();
  vm.add();
  expect(applied.mock.calls[0][0].bindings[0].constant_value).toBe(false);
  vm.name.set('note');
  vm.kind.set('null');
  vm.choose();
  vm.add();
  expect(applied.mock.calls[1][0].bindings[0].constant_value).toBe(null);
  vm.name.set('__proto__');
  vm.kind.set('string');
  vm.constant.set('retained');
  vm.touch();
  vm.add();
  expect(applied).toHaveBeenCalledTimes(2);
  expect(vm.name()).toBe('__proto__');
  expect(vm.constant()).toBe('retained');
  expect(vm.pending()).toBe(true);
});
it('preserves edits while disabled and clears actor-owned buffers on actor change', async () => {
  const fixture = await setup();
  const vm = fixture.componentInstance;
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.name.set('private');
  vm.constant.set('PRIVATE-SAMPLE');
  vm.touch();
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  vm.add();
  expect(applied).not.toHaveBeenCalled();
  expect(vm.constant()).toBe('PRIVATE-SAMPLE');
  TestBed.inject(ActorState).reset();
  expect(vm.constant()).toBeUndefined();
  expect(vm.name()).toBe('');
  expect(vm.pending()).toBe(false);
});

it('keeps consecutive constants actionable after adding a previous field', async () => {
  const fixture = await setup();
  const vm = fixture.componentInstance;
  vm.name.set('enabled');
  vm.kind.set('boolean');
  vm.choose();
  vm.add();
  await fixture.whenStable();
  vm.name.set('items');
  vm.kind.set('array');
  vm.choose();
  await fixture.whenStable();
  expect(vm.ready()).toBe(true);
  const button = Array.from(
    fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>,
  ).find((item) => item.textContent?.trim() === 'Add object field');
  expect(button?.disabled).toBe(false);
});
