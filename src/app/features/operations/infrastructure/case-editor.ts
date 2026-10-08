import { Injectable } from '@angular/core';
import {
  JsonObject,
  JsonValue,
  RuntimeAction,
  RuntimeDocument,
} from '../../forms/domain/runtime-document';
import { effectiveRequired } from '../../forms/domain/resolved-behavior';
import { CaseKind, CaseRecord } from '../domain/workspace-models';
import { CaseState } from './case-state';
@Injectable()
export class CaseEditor extends CaseState {
  async open(kind: CaseKind, reference: string, view = ''): Promise<void> {
    if (kind !== this.kind || reference !== this.reference) {
      this.generation++;
      this.busy.set(false);
      this.pin = undefined;
      this.queue = null;
      this.dirty.set(false);
      this.blocked.set(false);
      this.runtime.set(null);
      this.item.set(null);
      this.data.set({});
      this.deleted.clear();
      this.rawErrors.clear();
      this.editedScopes.clear();
      this.rowEdits.clear();
    }
    this.kind = kind;
    this.reference = reference;
    await this.refresh(false, view);
  }
  private current(generation: number, epoch: number): boolean {
    return (
      this.alive && generation === this.generation && epoch === this.actor.epoch
    );
  }
  async refresh(
    retain = this.dirty(),
    view = this.document()?.identity.view ?? '',
  ): Promise<void> {
    if (this.busy()) {
      return;
    }
    const generation = ++this.generation;
    const epoch = this.actor.epoch;
    this.busy.set(true);
    this.error.set('');
    try {
      const item = await this.api.get(
        this.kind,
        this.queue?.snapshot().reference ?? this.reference,
      );
      if (!this.current(generation, epoch)) {
        return;
      }
      this.item.set(item);
      if (this.kind === 'task' && item.kind !== 'HUMAN_TASK') {
        this.runtime.set(null);
        this.acceptFormless(item);
        return;
      }
      const runtime =
        this.kind === 'request'
          ? await this.reader.request(item.ref, this.pin)
          : await this.reader.task(item.ref, view, this.pin);
      if (!this.current(generation, epoch)) {
        return;
      }
      this.runtime.set(runtime);
      if (runtime.status === 'ready') {
        this.accept(runtime.document, retain);
        this.queue ??= this.queues.forResource(
          this.kind + ':' + this.reference,
          runtime.document.identity.resource,
        );
        await this.confirmReconciliation(
          retain,
          runtime.document,
          generation,
          epoch,
        );
        if (!this.current(generation, epoch)) {
          return;
        }
        this.queue.reconcile(runtime.document.identity.resource);
        this.blocked.set(false);
      }
    } catch (error) {
      if (this.current(generation, epoch)) {
        this.report(error);
      }
    } finally {
      if (this.current(generation, epoch)) {
        this.busy.set(false);
      }
    }
  }
  private acceptFormless(item: CaseRecord): void {
    if (item.kind === 'AI_APPROVAL') {
      this.queue ??= this.queues.forResource(
        'task:' + this.reference,
        item.ref,
      );
      this.queue.reconcile(item.ref);
      this.blocked.set(false);
    }
  }
  private async confirmReconciliation(
    retain: boolean,
    document: RuntimeDocument,
    generation: number,
    epoch: number,
  ): Promise<void> {
    if (!retain) {
      return;
    }
    this.blocked.set(true);
    const approved = await this.feedback.confirm(
      'Keep your unsaved edits after checking the current state?',
    );
    if (this.current(generation, epoch) && !approved) {
      this.accept(document, false);
    }
  }
  private async mutate<P>(
    payload: P,
    replayable: boolean,
    send: (
      reference: string,
      payload: P,
      key: string | null,
    ) => Promise<CaseRecord>,
  ): Promise<boolean> {
    if (this.busy() || this.blocked() || !this.queue) {
      return false;
    }
    const epoch = this.actor.epoch;
    const generation = this.generation;
    const queue = this.queue;
    this.busy.set(true);
    this.error.set('');
    try {
      const command = queue.command(
        payload,
        replayable,
        async (reference, body, key) => {
          const item = await send(reference, body, key);
          return { reference: item.ref, value: item };
        },
      );
      const item = await this.queues.execute(queue, command, (): void => {
        void this.refresh(true);
      });
      if (!this.current(generation, epoch)) {
        return false;
      }
      this.item.set(item);
      if (item.kind === 'AI_APPROVAL') {
        const latest = await this.api.get('task', item.ref);
        if (!this.current(generation, epoch)) {
          return false;
        }
        this.item.set(latest);
        this.queue?.reconcile(latest.ref);
        return true;
      }
      const runtime =
        this.kind === 'task' && item.kind === 'HUMAN_TASK'
          ? await this.reader.task(
              item.ref,
              this.document()?.identity.view ?? '',
              this.pin,
            )
          : this.kind === 'request'
            ? await this.reader.request(item.ref, this.pin)
            : null;
      if (!this.current(generation, epoch)) {
        return false;
      }
      this.runtime.set(runtime);
      if (runtime?.status === 'ready') {
        this.accept(runtime.document, false);
      }
      return runtime?.status === 'ready';
    } catch (error) {
      if (this.current(generation, epoch)) {
        this.blocked.set(
          ['conflict', 'uncertain'].includes(queue.snapshot().state),
        );
        this.report(error);
      }
      return false;
    } finally {
      if (this.current(generation, epoch)) {
        this.busy.set(false);
      }
    }
  }
  async command<P>(
    payload: P,
    send: (
      reference: string,
      payload: P,
      key: string | null,
    ) => Promise<string>,
    replayable = false,
    presentationResume = false,
  ): Promise<boolean> {
    return this.mutate(payload, replayable, async (reference, body, key) => ({
      ...this.item()!,
      ref: await (async (): Promise<string> => {
        const current = await send(reference, body, key);
        if (presentationResume) {
          this.pin = undefined;
        }
        return current;
      })(),
    }));
  }
  async save(): Promise<boolean> {
    if (!this.canEdit() || !this.validate()) {
      return false;
    }
    const payload = {
      data: this.patch(),
      view: this.document()!.identity.view,
      deleted: [...this.deleted],
    };
    return this.mutate(payload, this.kind === 'task', (reference, body, key) =>
      this.api.save(
        this.kind,
        reference,
        body.data,
        body.view,
        body.deleted,
        key,
      ),
    );
  }
  async submit(): Promise<void> {
    if (
      this.kind !== 'request' ||
      this.item()?.status !== 'DRAFT' ||
      !this.canEdit() ||
      !this.validate(effectiveRequired(this.document()!))
    ) {
      return;
    }
    if (!(await this.feedback.confirm('Submit this request?'))) {
      return;
    }
    if (this.dirty() && !(await this.save())) {
      return;
    }
    if (
      !this.canEdit() ||
      !this.validate(effectiveRequired(this.document()!))
    ) {
      return;
    }
    await this.mutate(
      { submitKey: crypto.randomUUID() },
      true,
      (reference, body) => this.api.submit(reference, body.submitKey),
    );
  }
  async lifecycle(action: 'claim' | 'release' | 'start'): Promise<void> {
    if (
      this.kind !== 'task' ||
      !['HUMAN_TASK', 'AI_APPROVAL'].includes(this.item()?.kind ?? '')
    ) {
      return;
    }
    if (action === 'claim' ? this.item()?.status !== 'OPEN' : !this.ownTask()) {
      return;
    }
    if (
      this.dirty() &&
      !(await this.feedback.confirm('Discard unsaved changes?'))
    ) {
      return;
    }
    await this.mutate({ action }, true, (reference, body, key) =>
      this.api.lifecycle(reference, body.action, key!),
    );
  }
  async decide(action: RuntimeAction): Promise<void> {
    const document = this.document();
    if (
      !this.canEdit() ||
      !this.ownTask() ||
      !document?.actions.some(
        (entry) =>
          entry.key === action.key &&
          entry.kind === action.kind &&
          entry.outcome === action.outcome,
      )
    ) {
      return;
    }
    if (action.requireComment && !this.comment().trim()) {
      this.error.set('A comment is required');
      return;
    }
    if (
      !this.validate(
        action.validation === 'complete'
          ? effectiveRequired(document)
          : action.requiredScopes,
      )
    ) {
      return;
    }
    if (
      !(await this.feedback.confirm(action.confirmation ?? 'Confirm action'))
    ) {
      return;
    }
    if (!this.canEdit() || !this.ownTask()) {
      return;
    }
    const payload = {
      action: action.kind,
      data: this.patch(),
      view: document.identity.view,
      deleted: [...this.deleted],
      outcome: action.outcome,
      comment: this.comment(),
    };
    await this.mutate(payload, true, (reference, body, key) =>
      this.api.decide(
        reference,
        body.action,
        key!,
        body.data,
        body.view,
        body.deleted,
        body.outcome,
        body.comment,
      ),
    );
  }
  async override(
    scope: string,
    operation: 'set' | 'reset',
    value: JsonValue,
    reason: string,
  ): Promise<void> {
    if (!this.canEdit() || this.dirty() || !reason.trim()) {
      return;
    }
    const find = (node: RuntimeDocument['render']): boolean =>
      (node.scope === scope &&
        (node.display['runtime_state'] as JsonObject | undefined)?.[
          'overridable'
        ] === true) ||
      node.children.some(find);
    if (!find(this.document()!.render)) {
      return;
    }
    await this.mutate(
      { scope, operation, value, reason },
      false,
      async (reference, body) => {
        await this.api.override(
          this.kind,
          reference,
          body.scope,
          body.operation,
          body.value,
          body.reason,
        );
        return this.api.get(this.kind, reference);
      },
    );
  }
}
