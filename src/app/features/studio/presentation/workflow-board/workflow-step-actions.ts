import { JsonObject } from '../../../forms/domain/runtime-document';
import { connectionKey } from '../../domain/workflow-authoring';
import { Directive, signal } from '@angular/core';
import { Workspace } from '../../domain/authoring';
import { inspectorFor } from '../../domain/node-inspector';
import {
  placeControlStep,
  StepAction,
} from '../../domain/workflow-step-actions';
import { WorkflowLayout } from './workflow-layout';

@Directive()
export abstract class WorkflowStepActions extends WorkflowLayout {
  abstract select(key: string): void;
  readonly stepAction = signal<StepAction | null>(null);
  private stepSnapshot: Workspace | null = null;
  cancelStepAction(): void {
    this.stepAction.set(null);
    this.stepSnapshot = null;
    this.error.set('');
  }
  protected override clear(): void {
    super.clear();
    this.cancelStepAction();
  }
  override canLeave(): Promise<boolean> {
    return this.stepAction()
      ? this.feedback.confirm('Discard unsaved workflow workspace changes?')
      : super.canLeave();
  }
  beginNext(source: string): void {
    const node = this.nodes().find((item) => item.key === source);
    if (this.readonly() || this.pending().length || !node?.canContinue) {
      return;
    }
    this.error.set('');
    this.stepSnapshot = this.document();
    this.stepAction.set({
      mode: 'next',
      source,
      edge: '',
      title: node.title,
      target: '',
      targetKey: '',
    });
  }
  beginInsert(id: string): void {
    const edge = this.document().graph['transitions'];
    if (this.readonly() || this.pending().length || !Array.isArray(edge)) {
      return;
    }
    const row = (edge as readonly JsonObject[]).find(
      (item) => connectionKey('transition', item) === id,
    );
    if (!row) {
      return;
    }
    this.error.set('');
    this.stepSnapshot = this.document();
    this.stepAction.set({
      mode: 'insert',
      source: String(row['source']),
      edge: id,
      title:
        this.nodes().find((node) => node.key === row['source'])?.title ?? '',
      target:
        this.nodes().find((node) => node.key === row['target'])?.title ?? '',
      targetKey: String(row['target']),
    });
  }
  placeStep(value: { type: string; outcome: string }): void {
    const action = this.stepAction();
    const entry = this.catalogEntries().find(
      (item) => item['key'] === value.type,
    );
    if (!action || !entry || this.readonly() || this.pending().length) {
      return;
    }
    if (this.stepSnapshot !== this.document()) {
      this.error.set('Workflow changed. Reopen the step action.');
      return;
    }
    const source = this.nodes().find((node) => node.key === action.source);
    if (!source) {
      return;
    }
    const metadata = (entry['metadata'] ?? {}) as JsonObject;
    const declared =
      action.mode === 'next'
        ? (source.outcomes ?? [])
        : (inspectorFor(
            {
              key: 'pending',
              type_code: String(metadata['code'] ?? ''),
              type_version_ref: String(metadata['ref_id'] ?? ''),
              config: {},
            },
            this.catalogEntries(),
          )?.outcomes ?? []);
    if (declared.length && !declared.includes(value.outcome.trim())) {
      return;
    }
    try {
      const target =
        action.mode === 'insert'
          ? this.nodes().find((node) => node.key === action.targetKey)
          : null;
      const point = target
        ? {
            x: (source.position.x + target.position.x) / 2,
            y: (source.position.y + target.position.y) / 2 + 80,
          }
        : { x: source.position.x + 280, y: source.position.y };
      const next = placeControlStep(
        this.document(),
        action,
        entry,
        value.outcome,
        point,
      );
      this.change(next.workspace);
      this.cancelStepAction();
      this.select(next.key);
      this.dockOpen.set(true);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid step');
    }
  }
}
