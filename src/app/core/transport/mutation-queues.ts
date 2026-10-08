import { inject, Injectable } from '@angular/core';
import { ActorState } from '../auth/actor-state';
import { Feedback } from '../feedback/feedback';
import { MutationCommand, MutationCoordinator } from './mutation-coordinator';
@Injectable({ providedIn: 'root' })
export class MutationQueues {
  private readonly queues = new Map<string, MutationCoordinator>();
  private readonly feedback = inject(Feedback);
  private readonly actor = inject(ActorState);
  constructor() {
    this.actor.register((): void => {
      this.queues.forEach((queue): void => queue.close());
      this.queues.clear();
    });
  }
  forResource(identity: string, currentReference: string): MutationCoordinator {
    if (!identity) {
      throw new Error('Stable resource identity is required.');
    }
    let queue = this.queues.get(identity);
    if (!queue) {
      queue = new MutationCoordinator(currentReference);
      this.queues.set(identity, queue);
    }
    return queue;
  }
  async execute<P, T>(
    queue: MutationCoordinator,
    command: MutationCommand<P, T>,
    reconcile: () => void,
  ): Promise<T> {
    const epoch = this.actor.epoch;
    this.feedback.show({ kind: 'pending', message: 'Changes are pending.' });
    try {
      const value = await queue.enqueue(command);
      if (epoch !== this.actor.epoch || queue.snapshot().state === 'closed') {
        throw new Error('Actor changed.');
      }
      this.feedback.show({ kind: 'success', message: 'Changes saved.' });
      return value;
    } catch (error) {
      const state = queue.snapshot().state;
      if (epoch === this.actor.epoch && state !== 'closed') {
        this.feedback.show({
          kind:
            state === 'conflict'
              ? 'conflict'
              : state === 'uncertain'
                ? 'uncertain'
                : 'error',
          message:
            state === 'conflict'
              ? 'Your edits have been kept. Check the latest revision before continuing.'
              : state === 'uncertain'
                ? 'The outcome is unknown. Check the current state before trying again.'
                : 'The request could not be completed.',
          reconcile,
        });
      }
      throw error;
    }
  }
}
