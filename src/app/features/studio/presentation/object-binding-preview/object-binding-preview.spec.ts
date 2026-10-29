import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { JsonObject } from '../../../../shared/domain/json-value';
import { STUDIO_API } from '../../bindings';
import { ObjectBindingPreview } from './object-binding-preview';
const binding: JsonObject = {
  step: 'assemble',
  target_port: 'data',
  target_schema: {
    type: 'object',
    properties: { enabled: { type: 'boolean' } },
  },
  ordinal: 0,
  target_projection: { dialect: 'bpms.binding.object/1', path: '/enabled' },
  source_kind: 'REQUEST',
  source_path: '/enabled',
  source_schema: {
    type: 'object',
    properties: { enabled: { type: 'boolean' } },
  },
};
const graph: JsonObject = { steps: [], bindings: [binding] };
async function setup(): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<ObjectBindingPreview>>;
  api: { auxiliary: ReturnType<typeof vi.fn> };
}> {
  const api = { auxiliary: vi.fn() };
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: api }],
  });
  const fixture = TestBed.createComponent(ObjectBindingPreview);
  for (const [key, value] of Object.entries({
    graph,
    step: 'assemble',
    port: 'data',
    version: 'current',
  })) {
    fixture.componentRef.setInput(key, value);
  }
  await fixture.whenStable();
  return { fixture, api };
}
it('distinguishes an omitted author sample from explicit false and never submits execution', async () => {
  const { fixture, api } = await setup();
  const vm = fixture.componentInstance;
  api.auxiliary.mockResolvedValue({
    sample_state: 'MISSING',
    fields: [],
    issues: [],
  });
  await vm.preview();
  expect(api.auxiliary.mock.calls[0][1].samples).toEqual([]);
  const checkbox: HTMLInputElement = fixture.nativeElement.querySelector(
    'input[type=checkbox]',
  );
  checkbox.checked = true;
  checkbox.dispatchEvent(new Event('change'));
  await fixture.whenStable();
  await vm.preview();
  expect(api.auxiliary.mock.calls[1][0]).toBe('bindingPreview');
  expect(api.auxiliary.mock.calls[1][1].samples).toEqual([
    { ordinal: 0, value: false },
  ]);
  expect(api.auxiliary.mock.calls[1][2]).toEqual({ ref_id: 'current' });
});
it('keeps samples across reorder and fences late actor replies', async () => {
  const { fixture, api } = await setup();
  const vm = fixture.componentInstance;
  vm.value(binding, false);
  fixture.componentRef.setInput('graph', {
    ...graph,
    bindings: [{ ...binding, ordinal: 1 }],
  });
  await fixture.whenStable();
  expect(vm.included(vm.rows()[0])).toBe(true);
  let resolve!: (value: unknown) => void;
  api.auxiliary.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const pending = vm.preview();
  const abort = api.auxiliary.mock.calls[0][3] as AbortSignal;
  TestBed.inject(ActorState).reset();
  resolve({ sample_state: 'VALID', fields: [], issues: [] });
  await pending;
  expect(abort.aborted).toBe(true);
  expect(vm.result()).toBeNull();
  expect(vm.samples()).toEqual({});
  expect(vm.busy()).toBe(false);
});
