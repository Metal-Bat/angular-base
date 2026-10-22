import { DestroyRef, inject, signal } from '@angular/core';
import { recordReference, RecordRow } from '../domain/records';
import { ResourceState } from './resource-state';

/** Read-before-reapply for ordinary record PUTs; never dispatches a command. */
export abstract class ResourceRecovery extends ResourceState {
  readonly recoveryRecord = signal<RecordRow | null>(null);
  private recoveryOwner: RecordRow | null = null;
  private recoveryEpoch = -1;
  constructor() {
    super();
    const release = this.actor.register(() => this.clearRecovery());
    inject(DestroyRef).onDestroy(() => {
      release();
      this.clearRecovery();
    });
  }
  async inspectCurrent(): Promise<void> {
    const owner = this.detail();
    if (
      !owner ||
      !this.definition.operations.get ||
      !this.allowed() ||
      this.busy() ||
      this.actionBusy()
    ) {
      return;
    }
    const generation = this.generation;
    const epoch = this.actor.epoch;
    this.recoveryRecord.set(null);
    this.busy.set(true);
    this.error.set('');
    try {
      const current = await this.api.detail(
        this.definition,
        recordReference(owner),
      );
      if (
        generation === this.generation &&
        epoch === this.actor.epoch &&
        owner === this.detail()
      ) {
        this.recoveryOwner = owner;
        this.recoveryEpoch = epoch;
        this.recoveryRecord.set(current);
      }
    } catch (error) {
      if (generation === this.generation && epoch === this.actor.epoch) {
        this.error.set(this.message(error));
      }
    } finally {
      if (generation === this.generation && epoch === this.actor.epoch) {
        this.busy.set(false);
      }
    }
  }
  canReapply(): boolean {
    const current = this.recoveryRecord();
    return (
      !!current &&
      this.reconcileRequired() &&
      this.mode() === 'edit' &&
      this.recoveryOwner === this.detail() &&
      this.recoveryEpoch === this.actor.epoch &&
      this.allowed() &&
      !!this.definition.operations.update &&
      !this.busy() &&
      !this.actionBusy() &&
      !current['deleted_at'] &&
      (!this.user || current['is_active'] !== false) &&
      !this.definition.immutableStatuses?.includes(String(current['status']))
    );
  }
  async useCurrentRevision(): Promise<void> {
    if (!this.canReapply()) {
      return;
    }
    const current = this.recoveryRecord()!;
    this.detail.set(current);
    this.reconcileRequired.set(false);
    this.modalError.set('');
    this.error.set('');
    this.notice.set(
      'Current revision selected. Review your retained edits before saving.',
    );
    this.recoveryRecord.set(null);
    this.recoveryOwner = null;
    await this.syncSelectionUrl(recordReference(current), true);
  }
  protected clearRecovery(): void {
    this.recoveryRecord.set(null);
    this.recoveryOwner = null;
    this.recoveryEpoch = -1;
  }
}
