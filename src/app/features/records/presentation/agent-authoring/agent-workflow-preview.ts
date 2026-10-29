import { Directive } from '@angular/core';
import { JsonObject } from '../../../../shared/domain/json-value';
import {
  authorSample,
  SampleChoice,
} from '../../domain/agent-authoring-sample';
import { AgentAuthoringState } from './agent-authoring-state';
@Directive()
export abstract class AgentWorkflowPreview extends AgentAuthoringState {
  async loadWorkflows(page = 1, apply = false): Promise<void> {
    const search = apply
      ? this.workflowSearch.trim()
      : this.appliedWorkflowSearch;
    await this.read(
      'workflows',
      (abort) => this.api.workflows(search, page, abort),
      (value) => {
        this.workflows.set(value);
        this.appliedWorkflowSearch = search;
      },
    );
  }
  async chooseWorkflow(row: Record<string, unknown>): Promise<void> {
    const item = this.workflows()?.items.find(
      (candidate) => candidate.ref === row['ref'],
    );
    if (!item || this.submitting()) {
      return;
    }
    this.cancel('versions', 'steps', 'context', 'sample');
    this.workflow.set(item);
    this.version.set(null);
    this.versions.set(null);
    this.steps.set([]);
    this.step.set('');
    this.invalidateContext();
    await this.loadVersions();
  }
  async loadVersions(page = 1): Promise<void> {
    const root = this.workflow();
    if (root) {
      await this.read(
        'versions',
        (abort) => this.api.versions(root.ref, page, abort),
        (value) => this.versions.set(value),
      );
    }
  }
  async chooseVersion(row: Record<string, unknown>): Promise<void> {
    const item = this.versions()?.items.find(
      (candidate) => candidate.ref === row['ref'],
    );
    if (!item) {
      return;
    }
    this.cancel('steps', 'context', 'sample');
    this.version.set(item);
    this.step.set('');
    this.steps.set([]);
    this.invalidateContext();
    await this.read(
      'steps',
      (abort) => this.api.steps(item.ref, this.ref(), abort),
      (value) => {
        this.steps.set(value);
        if (value.length === 1) {
          this.step.set(value[0].ref);
        }
      },
    );
  }
  private invalidateContext(): void {
    this.context.set(null);
    this.samplePreview.set(null);
  }
  selectStep(key: string): void {
    this.cancel('context', 'sample');
    this.step.set(key);
    this.invalidateContext();
  }
  async inspect(): Promise<void> {
    const version = this.version();
    const step = this.step();
    if (!version || !step) {
      return;
    }
    this.context.set(null);
    this.samplePreview.set(null);
    await this.read(
      'context',
      (abort) => this.api.context(this.ref(), version.ref, step, null, abort),
      (value) => {
        this.context.set(value);
        this.samplePreview.set(null);
      },
    );
  }
  async inspectDecision(): Promise<void> {
    this.savedDecision.set(null);
    await this.read(
      'decision',
      (abort) => this.api.decision(this.ref(), null, abort),
      (value) => this.savedDecision.set(value),
    );
  }
  editSample(): void {
    this.cancel('sample');
    this.samplePreview.set(null);
  }
  toggleInput(key: string, enabled: boolean): void {
    this.enabledInputs.update((current) =>
      enabled
        ? [...current.filter((value) => value !== key), key]
        : current.filter((value) => value !== key),
    );
    this.editSample();
  }
  sampleValue(key: string, value: string | boolean): void {
    this.sampleValues.update((current) => ({ ...current, [key]: value }));
    this.editSample();
  }
  addChoice(): void {
    if (this.choices().length < 254) {
      this.choices.update((current) => [
        ...current,
        {
          row: crypto.randomUUID(),
          key: '',
          en: '',
          fa: '',
          ar: '',
          description: '',
        },
      ]);
      this.editSample();
    }
  }
  choiceValue(identity: string, key: keyof SampleChoice, value: string): void {
    this.choices.update((current) =>
      current.map((item) =>
        item.row === identity ? { ...item, [key]: value } : item,
      ),
    );
    this.editSample();
  }
  removeChoice(identity: string): void {
    this.choices.update((current) =>
      current.filter((item) => item.row !== identity),
    );
    this.editSample();
  }
  async previewSample(): Promise<void> {
    const version = this.version();
    const step = this.step();
    if (!version || !step || !this.context()) {
      return;
    }
    this.samplePreview.set(null);
    let sample: JsonObject;
    try {
      sample = authorSample(
        this.fields(),
        this.enabledInputs(),
        this.sampleValues(),
        this.choices(),
      );
    } catch {
      this.errors.update((current) => ({
        ...current,
        sample: 'Correct the sample values before previewing.',
      }));
      return;
    }
    await this.read(
      'sample',
      (abort) => this.api.context(this.ref(), version.ref, step, sample, abort),
      (value) => this.samplePreview.set(value.decision),
    );
  }
}
