import { STUDIO_API } from '../../bindings';
import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import source from '../../../../../../docs/reference/app-be-wave-four/inspector-en.json';
import { NodeInspector } from './node-inspector';
const handler = source.handlers.find((item) => item.handler_key === 'timer')!;
const step = {
  key: 'wait',
  type_code: handler.code,
  type_version_ref: 'type-pin',
  config: { delay_seconds: 5, retained: false },
  subprocess: { workflow_version_ref: 'child-pin' },
};
const catalog = [
  {
    type_schema: handler.config_schema,
    metadata: {
      ref_id: 'type-pin',
      code: handler.code,
      handler_key: 'timer',
      handler_version: '1',
    },
  },
];
it('validates typed drafts, preserves pins and fences read-only and actor cleanup', async () => {
  const fixture = TestBed.createComponent(NodeInspector);
  fixture.componentRef.setInput('step', step);
  fixture.componentRef.setInput('catalog', catalog);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.update('delay_seconds', 0);
  vm.apply();
  expect(applied).not.toHaveBeenCalled();
  expect(vm.hasErrors()).toBe(true);
  vm.update('delay_seconds', 10);
  vm.apply();
  expect(applied).toHaveBeenCalledWith({
    ...step,
    config: { delay_seconds: 10, retained: false },
  });
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  vm.update('delay_seconds', 20);
  vm.apply();
  expect(applied).toHaveBeenCalledTimes(1);
  TestBed.inject(ActorState).reset();
  expect(vm.draft()).toEqual({});
  expect(vm.child()).toBeUndefined();
  expect(vm.task()).toBeUndefined();
  expect(vm.errors()).toEqual({});
});
it('round-trips declared human views and return actions without changing field policy or pins', async () => {
  const human = source.handlers.find(
    (item) => item.handler_key === 'human_task',
  )!;
  const original = {
    key: 'review',
    type_code: human.code,
    type_version_ref: 'human-pin',
    config: { form_version_ref: 'published-form' },
    field_policy: { hidden: ['/private'] },
  };
  const rows = [
    {
      type_schema: human.config_schema,
      metadata: {
        ref_id: 'human-pin',
        code: human.code,
        handler_key: 'human_task',
        handler_version: '1',
      },
    },
  ];
  TestBed.configureTestingModule({
    providers: [{ provide: STUDIO_API, useValue: { auxiliary: vi.fn() } }],
  });
  const fixture = TestBed.createComponent(NodeInspector);
  fixture.componentRef.setInput('step', original);
  fixture.componentRef.setInput('catalog', rows);
  await fixture.whenStable();
  const task = {
    default_view: 'review',
    views: [
      {
        key: 'review',
        purpose: 'summary',
        scopes: ['/amount'],
        title: { en: 'Review', fa: 'بررسی' },
      },
    ],
    actions: [
      {
        key: 'correct',
        kind: 'return',
        outcome_key: 'correction',
        require_comment: true,
        validation: 'partial',
        required_scopes: [],
        title: { en: 'Correct', fa: 'اصلاح' },
      },
    ],
  };
  const applied = vi.fn();
  const vm = fixture.componentInstance;
  vm.applied.subscribe(applied);
  vm.updateSection('task', task);
  vm.apply();
  expect(applied).toHaveBeenCalledWith({ ...original, task_contract: task });
  expect(original.field_policy).toEqual({ hidden: ['/private'] });
});

it('discards invalid typed buffers without changing the selected node or retained metadata', async () => {
  const fixture = TestBed.createComponent(NodeInspector);
  fixture.componentRef.setInput('step', step);
  fixture.componentRef.setInput('catalog', catalog);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const discarded = vi.fn();
  const applied = vi.fn();
  vm.discarded.subscribe(discarded);
  vm.applied.subscribe(applied);
  vm.update('delay_seconds', 0);
  vm.apply();
  expect(vm.hasErrors()).toBe(true);
  vm.discard();
  expect(vm.draft()).toEqual(step.config);
  expect(vm.child()).toEqual(step.subprocess);
  expect(vm.hasErrors()).toBe(false);
  expect(discarded).toHaveBeenCalledOnce();
  expect(applied).not.toHaveBeenCalled();
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  vm.discard();
  expect(discarded).toHaveBeenCalledOnce();
});

it('shows readable primitive choices and emits reviewed canonical operations on the same version pin', async () => {
  const primitive = source.handlers.find(
    (item) => item.handler_key === 'number_compare',
  )!;
  const fixture = TestBed.createComponent(NodeInspector);
  const original = {
    key: 'compare',
    type_code: primitive.code,
    type_version_ref: 'comparison-pin',
    config: { operation: 'lt' },
  };
  fixture.componentRef.setInput('step', original);
  fixture.componentRef.setInput('catalog', [
    {
      type_schema: primitive.config_schema,
      metadata: {
        ref_id: 'comparison-pin',
        code: primitive.code,
        handler_key: primitive.handler_key,
        handler_version: primitive.handler_version,
      },
    },
  ]);
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  expect(fixture.nativeElement.textContent).toContain('Greater than or equal');
  expect(Object.keys(vm.primitiveChoiceLabels('number_compare'))).toEqual(
    primitive.config_schema.properties.operation!.enum,
  );
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.update('operation', 'gte');
  vm.apply();
  expect(applied).toHaveBeenCalledWith({
    ...original,
    config: { operation: 'gte' },
  });
  vm.update('operation', 'invented');
  vm.apply();
  expect(applied).toHaveBeenCalledTimes(1);
  expect(vm.hasErrors()).toBe(true);
});
