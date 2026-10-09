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
