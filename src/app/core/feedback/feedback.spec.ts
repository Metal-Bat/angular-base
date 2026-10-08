import { TestBed } from '@angular/core/testing';
import { Feedback, fieldId } from './feedback';
import { ActorState } from '../auth/actor-state';
describe('Accessible feedback lifecycle', () => {
  it('resolves confirmation without implicitly retrying a command', async () => {
    const feedback = TestBed.inject(Feedback);
    const work = feedback.confirm('Confirm action');
    expect(feedback.confirmation()?.message).toBe('Confirm action');
    feedback.answer(true);
    expect(await work).toBe(true);
    expect(feedback.confirmation()).toBeNull();
  });
  it('cancels confirmation and removes sensitive issues on actor cleanup', async () => {
    const feedback = TestBed.inject(Feedback);
    const work = feedback.confirm('Confirm action');
    feedback.show({
      kind: 'error',
      message: 'The request could not be completed.',
      issues: [{ pointer: '/amount', label: 'Amount', message: 'Required' }],
    });
    TestBed.inject(ActorState).reset();
    expect(await work).toBe(false);
    expect(feedback.state()).toBeNull();
  });
  it('focuses a pointer-linked control without interpreting the opaque field path as a selector', () => {
    const input = document.createElement('input');
    input.id = fieldId('/rows/a~1b/name');
    document.body.append(input);
    TestBed.inject(Feedback).focus('/rows/a~1b/name');
    expect(document.activeElement).toBe(input);
    input.remove();
  });
});
