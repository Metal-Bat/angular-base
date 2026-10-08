import { TestBed } from '@angular/core/testing';
import { ActorState } from '../auth/actor-state';
import { Feedback } from '../feedback/feedback';
import { MutationQueues } from './mutation-queues';

describe('Shared actor mutation queues', () => {
  it('shares the current reference across consumers and replaces the queue after actor cleanup', async () => {
    const queues = TestBed.inject(MutationQueues);
    const first = queues.forResource('task', 'initial');
    expect(queues.forResource('task', 'older')).toBe(first);
    await queues.execute(
      first,
      first.command({}, false, async () => ({ reference: 'next', value: 1 })),
      () => undefined,
    );
    expect(queues.forResource('task', 'initial').snapshot().reference).toBe(
      'next',
    );
    TestBed.inject(ActorState).reset();
    expect(first.snapshot().state).toBe('closed');
    expect(queues.forResource('task', 'other-actor')).not.toBe(first);
    expect(TestBed.inject(Feedback).state()).toBeNull();
  });
  it('cannot republish a previous actor outcome after cleanup', async () => {
    const queues = TestBed.inject(MutationQueues);
    const queue = queues.forResource('task', 'initial');
    let finish!: (value: { reference: string; value: string }) => void;
    const result = new Promise<{ reference: string; value: string }>(
      (resolve) => {
        finish = resolve;
      },
    );
    const work = queues.execute(
      queue,
      queue.command({}, false, () => result),
      () => undefined,
    );
    await Promise.resolve();
    TestBed.inject(ActorState).reset();
    finish({ reference: 'old-actor-next', value: 'old-actor-content' });
    await expect(work).rejects.toThrow('Actor changed');
    expect(TestBed.inject(Feedback).state()).toBeNull();
  });
});
