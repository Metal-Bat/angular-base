import { Directive } from '@angular/core';
import { AgentWorkflowPreview } from './agent-workflow-preview';
@Directive()
export abstract class AgentEvaluationState extends AgentWorkflowPreview {
  async loadRequests(page = 1): Promise<void> {
    if (this.canEvaluate()) {
      await this.read(
        'requests',
        (abort) => this.api.requests(page, abort),
        (value) => this.drafts.set(value),
      );
    }
  }
  async chooseRequest(row: Record<string, unknown>): Promise<void> {
    const item = this.drafts()?.items.find(
      (candidate) => candidate.ref === row['ref'],
    );
    if (!item || this.submitting() || this.needsReconciliation()) {
      return;
    }
    this.selectedRequest.set(null);
    this.compatibleRequest.set(false);
    this.result.set(null);
    this.command = null;
    this.queue = null;
    await this.read(
      'request',
      async (abort) => {
        const current = await this.api.request(item.ref, abort);
        const steps = await this.api.steps(current.version, this.ref(), abort);
        return { current, steps };
      },
      (value) => {
        this.selectedRequest.set(value.current);
        this.compatibleRequest.set(
          value.current.status === 'DRAFT' && value.steps.length > 0,
        );
      },
    );
  }
  async submitEvaluation(): Promise<void> {
    const selected = this.selectedRequest();
    if (
      !this.active() ||
      !selected ||
      !this.canEvaluate() ||
      !this.compatibleRequest() ||
      this.submitting() ||
      this.confirmed() ||
      this.needsReconciliation() ||
      this.result()
    ) {
      return;
    }
    const generation = this.generation;
    const agent = this.ref();
    this.confirmed.set(true);
    const approved = await this.feedback.confirm(
      this.locale.text(
        'Submit this saved request for governed evaluation? ' +
          'The configured provider may be called and usage may be charged. ' +
          'Required workflow approvals still apply.',
      ) +
        ' — ' +
        this.requestTitle(selected),
    );
    this.confirmed.set(false);
    if (
      !approved ||
      generation !== this.generation ||
      this.selectedRequest() !== selected ||
      !this.canEvaluate()
    ) {
      return;
    }
    this.queue = this.queues.forResource(
      'request:' + selected.ref,
      selected.ref,
    );
    if (this.queue.snapshot().state !== 'ready') {
      this.needsReconciliation.set(true);
      return;
    }
    this.command = this.queue.command(
      { agent, request: selected.ref },
      true,
      async (_ref, payload, key, abort) => {
        const value = await this.api.evaluate(
          payload.agent,
          payload.request,
          key!,
          abort,
        );
        return { reference: value.request, value };
      },
    );
    await this.sendEvaluation();
  }
  private async sendEvaluation(): Promise<void> {
    if (!this.queue || !this.command || this.submitting()) {
      return;
    }
    const generation = this.generation;
    this.submitting.set(true);
    try {
      const value = await this.queues.execute(this.queue, this.command, () => {
        void this.checkRequest();
      });
      if (generation === this.generation) {
        this.result.set(value);
        this.compatibleRequest.set(false);
        this.needsReconciliation.set(false);
      }
    } catch {
      if (generation === this.generation) {
        this.needsReconciliation.set(true);
      }
    } finally {
      if (generation === this.generation) {
        this.submitting.set(false);
      }
    }
  }
  async checkRequest(): Promise<void> {
    const selected = this.selectedRequest();
    if (!selected || this.submitting()) {
      return;
    }
    await this.read(
      'request',
      (abort) => this.api.request(selected.ref, abort),
      (value) => {
        this.selectedRequest.set(value);
        this.compatibleRequest.set(false);
        if (this.queue && this.queue.snapshot().state !== 'pending') {
          this.queue.reconcile(value.ref);
        }
      },
    );
  }
  async retrySubmission(): Promise<void> {
    if (
      !this.active() ||
      !this.canEvaluate() ||
      this.confirmed() ||
      !this.command ||
      !this.queue ||
      this.queue.snapshot().state !== 'ready' ||
      !this.needsReconciliation() ||
      this.submitting()
    ) {
      return;
    }
    const generation = this.generation;
    this.confirmed.set(true);
    const approved = await this.feedback.confirm(
      'Retry only the original request submission with its original replay key? ' +
        'This does not authorize another provider execution.',
    );
    if (generation !== this.generation) {
      return;
    }
    this.confirmed.set(false);
    if (approved && this.active() && this.canEvaluate()) {
      await this.sendEvaluation();
    }
  }
}
