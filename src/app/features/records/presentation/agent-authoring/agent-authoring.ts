import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { AgentChoicePreview } from '../../application/agent-authoring-port';
import { AgentSampleField } from '../../domain/agent-authoring-sample';
import { AgentEvaluationState } from './agent-evaluation';
import { AgentWorkflowChecks } from './agent-workflow-checks';
import { AgentRetrievalChecks } from './agent-retrieval-checks';
import { AgentEvaluationChecks } from './agent-evaluation-checks';
@Component({
  selector: 'app-agent-authoring',
  imports: [
    ButtonDirective,
    LocalizePipe,
    AgentWorkflowChecks,
    AgentRetrievalChecks,
    AgentEvaluationChecks,
  ],
  templateUrl: './agent-authoring.html',
  styleUrl: './agent-authoring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentAuthoring extends AgentEvaluationState {
  readonly versionColumns = [
    { key: 'name', label: 'Version' },
    { key: 'status', label: 'Status' },
  ];
  readonly requestColumns = [
    { key: 'name', label: 'Request' },
    { key: 'created_at', label: 'Created at' },
  ];
  readonly reportRows = computed(() =>
    (this.reports()?.items ?? []).map((item) => ({
      ...item,
      created_at: item.createdAt,
    })),
  );
  readonly requestRows = computed(() =>
    (this.drafts()?.items ?? []).map((item) => ({
      ...item,
      name: this.requestTitle(item),
      created_at: item.createdAt,
    })),
  );
  validLimit(): boolean {
    return (
      Number.isInteger(Number(this.limit)) &&
      Number(this.limit) >= 1 &&
      Number(this.limit) <= (this.source()?.maxRows ?? 0)
    );
  }
  canReplay(): boolean {
    return (
      this.active() &&
      this.canEvaluate() &&
      this.needsReconciliation() &&
      !this.submitting() &&
      !!this.command &&
      this.queue?.snapshot().state === 'ready'
    );
  }
  originLabel(origin: 'AUTHOR' | 'CONSTANT_BINDING' | 'NONE'): string {
    return {
      AUTHOR: 'Author-provided sample',
      CONSTANT_BINDING: 'Saved constant binding sample',
      NONE: 'No saved sample is available',
    }[origin];
  }
  sampleKind(kind: AgentSampleField['kind']): string {
    return {
      text: 'Text',
      number: 'Number',
      integer: 'Whole number',
      boolean: 'Boolean',
      choices: 'Fixed choices',
      unsupported: 'Unsupported sample type',
    }[kind];
  }
  errorRows(): [string, string][] {
    return Object.entries(this.errors()).filter(([, value]) => !!value);
  }
  errorLabel(key: string): string {
    return (
      {
        workflows: 'Workflow inputs',
        versions: 'Saved workflow versions',
        steps: 'AI step',
        context: 'Workflow inputs',
        decision: 'Decision choice preview',
        sample: 'Author-provided sample',
        sources: 'Saved report lookup',
        lookup: 'Saved report lookup',
        requests: 'Governed evaluation',
        request: 'Governed evaluation',
      }[key] ?? 'Saved version checks'
    );
  }
  async loadSources(page = 1, apply = false): Promise<void> {
    const search = apply ? this.reportSearch.trim() : this.appliedReportSearch;
    await this.read(
      'sources',
      (abort) => this.api.sources(this.ref(), search, page, abort),
      (value) => {
        this.reports.set(value);
        this.appliedReportSearch = search;
      },
    );
  }
  chooseSource(row: Record<string, unknown>): void {
    const item = this.reports()?.items.find(
      (candidate) => candidate.ref === row['ref'],
    );
    if (item) {
      this.cancel('lookup');
      this.source.set(item);
      this.limit = item.maxRows;
      this.lookup.set(null);
    }
  }
  async previewLookup(): Promise<void> {
    const source = this.source();
    if (
      !source ||
      !Number.isInteger(Number(this.limit)) ||
      Number(this.limit) < 1 ||
      Number(this.limit) > source.maxRows
    ) {
      return;
    }
    this.lookup.set(null);
    await this.read(
      'lookup',
      (abort) =>
        this.api.lookup(this.ref(), source.ref, Number(this.limit), abort),
      (value) => this.lookup.set(value),
    );
  }
  href(kind: 'requests' | 'processes', reference: string): string {
    return '/operations/' + kind + '/' + encodeURIComponent(reference);
  }
  choiceLabel(labels: Record<string, string>, key: string): string {
    return (
      labels[this.locale.language()] ||
      labels['en'] ||
      Object.values(labels)[0] ||
      key
    );
  }
  stateLabel(state: AgentChoicePreview['state']): string {
    return {
      STATIC: 'Saved fixed choices',
      MISSING: 'No choice sample is available',
      EMPTY: 'The choice sample is empty',
      INVALID: 'The choice sample is invalid',
      VALID: 'The choice sample is valid',
    }[state];
  }
}
