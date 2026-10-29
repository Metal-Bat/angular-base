import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { STUDIO_API } from '../../bindings';
import { GraphConnections } from './graph-connections';
import { JsonObject } from '../../../forms/domain/runtime-document';
async function setup(): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<GraphConnections>>;
  api: { auxiliary: ReturnType<typeof vi.fn> };
}> {
  const api = { auxiliary: vi.fn() };
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: api }],
  });
  const fixture = TestBed.createComponent(GraphConnections);
  fixture.componentRef.setInput('graph', {
    steps: [
      { key: 'start', type_code: 'START' },
      { key: 'review', type_code: 'HUMAN_TASK' },
    ],
    transitions: [{ source: 'start', target: 'review', outcome: 'next' }],
    bindings: [],
  });
  fixture.componentRef.setInput('nodes', [
    {
      key: 'review',
      title: 'Review',
      position: { x: 0, y: 0 },
      ports: [
        {
          key: 'data',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: {
            type: 'object',
            properties: { enabled: { type: 'boolean' } },
            required: ['enabled'],
            additionalProperties: false,
          },
        },
      ],
    },
  ]);
  fixture.componentRef.setInput('selected', 'review');
  fixture.componentRef.setInput('version', 'owned');
  await fixture.whenStable();
  return { fixture, api };
}
it('retains an invalid structured mapping buffer and applies a valid object atomically', async () => {
  const { fixture } = await setup();
  const vm = fixture.componentInstance;
  const applied = vi.fn();
  const changed = vi.fn();
  vm.applied.subscribe(applied);
  vm.changed.subscribe(changed);
  vm.updateTarget('data');
  vm.constant.set({});
  vm.touch();
  vm.map();
  expect(applied).not.toHaveBeenCalled();
  expect(vm.mappingPending()).toBe(true);
  expect(vm.constant()).toEqual({});
  expect(vm.fieldErrors()).toHaveProperty('value.enabled');
  vm.constant.set({ enabled: false });
  vm.touch();
  vm.map();
  expect(applied.mock.calls[0][0].bindings[0].constant_value).toEqual({
    enabled: false,
  });
  expect(vm.mappingPending()).toBe(false);
  expect(changed).toHaveBeenCalled();
});
it('fences late completion and clears private mapping state on an actor switch', async () => {
  const { fixture, api } = await setup();
  const vm = fixture.componentInstance;
  let resolve!: (value: { items: JsonObject[]; totalPages: number }) => void;
  api.auxiliary.mockImplementation(
    () => new Promise((done) => (resolve = done)),
  );
  vm.setRequest('authorized-request');
  const pending = vm.load();
  TestBed.inject(ActorState).reset();
  resolve({
    items: [
      {
        path: 'request.private',
        source: 'request',
        cardinality: 'SCALAR',
        type_schema: { type: 'string' },
      },
    ],
    totalPages: 1,
  });
  await pending;
  expect(vm.rows()).toEqual([]);
  expect(vm.request()).toBe('');
  expect(vm.busy()).toBe(false);
});
it('preserves mapping input while temporarily disabled and discards it explicitly', async () => {
  const { fixture } = await setup();
  const vm = fixture.componentInstance;
  vm.updateTarget('data');
  vm.constant.set({ enabled: false });
  vm.touch();
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.map();
  expect(applied).not.toHaveBeenCalled();
  expect(vm.constant()).toEqual({ enabled: false });
  fixture.componentRef.setInput('disabled', false);
  await fixture.whenStable();
  vm.cancel();
  expect(vm.mappingPending()).toBe(false);
  expect(vm.constant()).toBeUndefined();
});

it('blocks mapping without input definitions while retaining condition source lookup', async () => {
  const { fixture } = await setup();
  fixture.componentRef.setInput('nodes', []);
  await fixture.whenStable();
  expect(fixture.componentInstance.interactionDisabled()).toBe(true);
  expect(fixture.nativeElement.textContent).toContain(
    'Data input ports are unavailable for mapping. Authorized condition values can still be loaded.',
  );
  expect(fixture.componentInstance.sourceDisabled()).toBe(false);
  const applied = vi.fn();
  fixture.componentInstance.applied.subscribe(applied);
  fixture.componentInstance.map();
  expect(applied).not.toHaveBeenCalled();
});

it('allows deliberate removal of a saved binding whose input definition is unavailable', async () => {
  const { fixture } = await setup();
  const vm = fixture.componentInstance;
  fixture.componentRef.setInput('nodes', []);
  fixture.componentRef.setInput('graph', {
    steps: [],
    bindings: [
      {
        step: 'review',
        target_port: 'retired',
        source_kind: 'CONSTANT',
        constant_value: false,
        ordinal: 0,
      },
    ],
    transitions: [],
  });
  await fixture.whenStable();
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.removeMapping(vm.bindings()[0].id);
  expect(applied.mock.calls[0][0].bindings).toEqual([]);
});

it('compares sources against pinned union types while constants use normalized form schemas', async () => {
  const { fixture } = await setup();
  const vm = fixture.componentInstance;
  fixture.componentRef.setInput('nodes', [
    {
      key: 'review',
      title: 'Conversion',
      position: { x: 0, y: 0 },
      ports: [
        {
          key: 'value',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: { type: ['string', 'integer'] },
        },
      ],
    },
  ]);
  await fixture.whenStable();
  vm.updateTarget('value');
  expect(vm.compatible({ type: 'string' })).toBe(true);
  expect(vm.compatible({ type: 'boolean' })).toBe(false);
  expect(vm.targetSchema()['anyOf']).toEqual([
    { type: 'string' },
    { type: 'integer' },
  ]);
});

it('uses the current port when editing a whole mapping after a conversion changes', async () => {
  const { fixture } = await setup();
  fixture.componentRef.setInput('graph', {
    ...fixture.componentInstance.graph(),
    bindings: [
      {
        step: 'review',
        target_port: 'data',
        source_kind: 'CONSTANT',
        constant_value: {},
        target_schema: { type: 'object' },
      },
    ],
  });
  fixture.componentRef.setInput('nodes', [
    {
      key: 'review',
      title: 'Conversion',
      position: { x: 0, y: 0 },
      ports: [
        {
          key: 'data',
          direction: 'INPUT',
          cardinality: 'SCALAR',
          schema: { type: ['string', 'integer', 'number'] },
        },
      ],
    },
  ]);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  vm.edit(vm.bindings()[0].id);
  expect(vm.compatible({ type: 'string' })).toBe(true);
  expect(vm.targetSchema()['anyOf']).toEqual([
    { type: 'string' },
    { type: 'integer' },
    { type: 'number' },
  ]);
});
