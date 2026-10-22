import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActorState } from '../../../../core/auth/actor-state';
import { JsonObject } from '../../../forms/domain/runtime-document';
import { WorkflowInterfaceEditor } from './workflow-interface-editor';
function setup(
  value: JsonObject | null = {
    inputs: [],
    outputs: [],
    category: 'general',
    outcomes: { done: 'finish' },
    help_messages: { en: 'Retain' },
    required_capabilities: ['retained'],
  },
): {
  fixture: ComponentFixture<WorkflowInterfaceEditor>;
  editor: WorkflowInterfaceEditor;
  applied: ReturnType<typeof vi.fn>;
  changed: ReturnType<typeof vi.fn>;
} {
  const fixture = TestBed.createComponent(WorkflowInterfaceEditor);
  fixture.componentRef.setInput('graph', {
    interface: value,
    steps: [{ key: 'finish', type_code: 'FINISH' }],
    bindings: [],
  });
  fixture.componentRef.setInput('catalog', []);
  const editor = fixture.componentInstance;
  const applied = vi.fn();
  const changed = vi.fn();
  editor.applied.subscribe(applied);
  editor.changed.subscribe(changed);
  return { fixture, editor, applied, changed };
}
it('retains rapid input edits, marks unadded names pending and fences immediate Apply', () => {
  const { editor, applied, changed } = setup();
  editor.editInputName('flag');
  editor.apply();
  expect(applied).not.toHaveBeenCalled();
  expect(changed).toHaveBeenCalled();
  editor.inputType.set('boolean');
  editor.addInput();
  editor.port('inputs', 0, 'required', false);
  editor.apply();
  expect(applied).toHaveBeenCalledOnce();
  expect(applied.mock.calls[0][0].interface).toMatchObject({
    inputs: [
      { name: 'flag', value_schema: { type: 'boolean' }, required: false },
    ],
    help_messages: { en: 'Retain' },
    required_capabilities: ['retained'],
  });
});
it('preserves duplicate outcome buffers until explicitly corrected or discarded', () => {
  const { editor, applied } = setup();
  editor.addOutcome();
  editor.outcome(1, 'name', 'done');
  editor.outcome(1, 'step', 'finish');
  editor.apply();
  expect(applied).not.toHaveBeenCalled();
  expect(editor.outcomes()).toHaveLength(2);
  editor.discard();
  expect(editor.outcomes()).toEqual([{ name: 'done', step: 'finish' }]);
  expect(editor.dirty()).toBe(false);
});
it('protects saved sample coverage and existing schema constraints', () => {
  const schema = { type: 'string', minLength: 2 };
  const { editor } = setup({
    inputs: [{ name: 'saved', value_schema: schema }],
    sample_inputs: { saved: 'private' },
    outputs: [],
    outcomes: { done: 'finish' },
  });
  editor.editInputName('new');
  editor.addInput();
  editor.remove('inputs', 0);
  editor.port('inputs', 0, 'name', 'renamed');
  expect(editor.inputs()).toEqual([{ name: 'saved', value_schema: schema }]);
  editor.port('inputs', 0, 'required', false);
  expect(editor.inputs()[0]['value_schema']).toEqual(schema);
  expect(editor.value()?.['sample_inputs']).toEqual({ saved: 'private' });
});
it('published read-only and actor cleanup prevent editing or retaining another actor draft', () => {
  const { fixture, editor, applied, changed } = setup();
  fixture.componentRef.setInput('disabled', true);
  editor.field('category', 'changed');
  editor.create();
  editor.addOutput();
  editor.addOutcome();
  editor.editInputName('forbidden');
  editor.apply();
  expect(changed).not.toHaveBeenCalled();
  expect(applied).not.toHaveBeenCalled();
  TestBed.inject(ActorState).reset();
  expect(editor.value()).toBeNull();
  expect(editor.outcomes()).toEqual([]);
});

it('fences Apply while a nested schema dialog is open and resumes after explicit cancellation', () => {
  const { editor, applied } = setup();
  editor.setShapeEditing(true);
  editor.apply();
  expect(applied).not.toHaveBeenCalled();
  editor.setShapeEditing(false);
  editor.apply();
  expect(applied).toHaveBeenCalledOnce();
});
it('retains malformed saved interfaces without exposing controls or overwriting them', async () => {
  const malformed: JsonObject = {
    inputs: 'invalid saved shape',
    outcomes: { done: 'finish' },
  };
  const { fixture, editor, applied, changed } = setup(malformed);
  await fixture.whenStable();
  expect(fixture.nativeElement.textContent).toContain(
    'Unsupported workflow interface is retained. Typed editing is unavailable.',
  );
  editor.create();
  editor.field('category', 'replacement');
  editor.apply();
  expect(changed).not.toHaveBeenCalled();
  expect(applied).not.toHaveBeenCalled();
  expect(editor.graph()['interface']).toEqual(malformed);
});
