import { inject, Injectable, signal } from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { ApiFailure } from '../../../core/transport/api-failure';
import { Feedback } from '../../../core/feedback/feedback';
import { CaseRecord } from '../domain/workspace-models';
import { WorkspaceApi } from './workspace-api';
@Injectable({ providedIn: 'root' })
export class RequestCreation {
  private readonly api = inject(WorkspaceApi);
  private readonly actor = inject(ActorState);
  private readonly feedback = inject(Feedback);
  readonly busy = signal(false);
  readonly uncertain = signal(false);
  readonly error = signal('');
  constructor() {
    this.actor.register((): void => {
      this.busy.set(false);
      this.uncertain.set(false);
      this.error.set('');
    });
  }
  async create(reference: string): Promise<CaseRecord | null> {
    if (this.busy() || this.uncertain()) {
      return null;
    }
    const epoch = this.actor.epoch;
    this.busy.set(true);
    this.error.set('');
    try {
      const item = await this.api.create(reference);
      return epoch === this.actor.epoch ? item : null;
    } catch (error) {
      if (epoch === this.actor.epoch) {
        this.uncertain.set(
          !(error instanceof ApiFailure) ||
            error.uncertain ||
            error.httpStatus === 0 ||
            error.httpStatus >= 500,
        );
        this.error.set(
          this.uncertain()
            ? 'Creation outcome is unknown. Check your requests before creating another draft.'
            : error instanceof ApiFailure
              ? error.message
              : 'The service is unavailable.',
        );
      }
      return null;
    } finally {
      if (epoch === this.actor.epoch) {
        this.busy.set(false);
      }
    }
  }
  async reconcile(): Promise<void> {
    const epoch = this.actor.epoch;
    try {
      await this.api.list('request');
      if (
        epoch === this.actor.epoch &&
        (await this.feedback.confirm(
          'After checking your requests, start a new creation attempt?',
        )) &&
        epoch === this.actor.epoch
      ) {
        this.uncertain.set(false);
        this.error.set('');
      }
    } catch {
      if (epoch === this.actor.epoch) {
        this.error.set('The service is unavailable.');
      }
    }
  }
}
