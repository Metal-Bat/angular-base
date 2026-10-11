import { TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { TransitionEditor } from './transition-editor';
const graph = {
  steps: [],
  transitions: [
    {
      source: 'review',
      target: 'finish',
      outcome: 'approve',
      priority: 4,
      is_default: false,
      condition: 'request.flag',
      preserved: true,
    },
  ],
  bindings: [],
};
it('retains invalid branch edits and applies coordinated default/condition changes atomically', async () => {
  const fixture = TestBed.createComponent(TransitionEditor);
  fixture.componentRef.setInput('graph', graph);
  fixture.componentRef.setInput('selected', 'review');
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const applied = vi.fn();
  vm.applied.subscribe(applied);
  vm.update('is_default', true);
  vm.apply();
  expect(vm.error()).toContain('unconditional');
  expect(vm.draft()['is_default']).toBe(true);
  expect(applied).not.toHaveBeenCalled();
  vm.update('condition', null);
  vm.apply();
  expect(applied.mock.calls[0][0].transitions[0]).toEqual({
    ...graph.transitions[0],
    is_default: true,
    condition: null,
  });
  expect(graph.transitions[0].condition).toBe('request.flag');
});
it('discards buffers and fences readonly and old actor changes', async () => {
  const fixture = TestBed.createComponent(TransitionEditor);
  fixture.componentRef.setInput('graph', graph);
  fixture.componentRef.setInput('selected', 'review');
  await fixture.whenStable();
  const vm = fixture.componentInstance;
  const discarded = vi.fn();
  const applied = vi.fn();
  vm.discarded.subscribe(discarded);
  vm.applied.subscribe(applied);
  vm.update('priority', 7);
  vm.discard();
  expect(vm.draft()['priority']).toBe(4);
  expect(discarded).toHaveBeenCalledOnce();
  fixture.componentRef.setInput('disabled', true);
  await fixture.whenStable();
  vm.update('priority', 9);
  vm.apply();
  expect(applied).not.toHaveBeenCalled();
  TestBed.inject(ActorState).reset();
  expect(vm.draft()).toEqual({});
  expect(vm.dirty()).toBe(false);
});
