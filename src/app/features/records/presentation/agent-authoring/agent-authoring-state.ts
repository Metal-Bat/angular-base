import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ActorState } from '../../../../core/auth/actor-state';
import { SessionContext } from '../../../../core/auth/session-context';
import { hasPermissions } from '../../../../core/permissions/area-access';
import { Feedback } from '../../../../core/feedback/feedback';
import { MutationQueues } from '../../../../core/transport/mutation-queues';
import {
  MutationCommand,
  MutationCoordinator,
} from '../../../../core/transport/mutation-coordinator';
import { Page } from '../../../../core/transport/response-adapters';
import { Locale } from '../../../../core/localization/locale';
import { JsonObject } from '../../../../shared/domain/json-value';
import { AGENT_AUTHORING } from '../../bindings';
import {
  AgentChoicePreview,
  AgentEvaluation,
  AgentEvaluationRequest,
  AgentLookupPreview,
  AgentReportSource,
  AgentWorkflowContext,
  NamedAgentResource,
} from '../../application/agent-authoring-port';
import {
  SampleChoice,
  sampleFields,
} from '../../domain/agent-authoring-sample';
@Directive()
export abstract class AgentAuthoringState {
  readonly record = input.required<JsonObject>();
  readonly locale = inject(Locale);
  protected readonly api = inject(AGENT_AUTHORING);
  protected readonly actor = inject(ActorState);
  protected readonly session = inject(SessionContext);
  protected readonly feedback = inject(Feedback);
  protected readonly queues = inject(MutationQueues);
  readonly ref = computed(() => String(this.record()['ref_id'] ?? ''));
  readonly published = computed(() => this.record()['status'] === 'PUBLISHED');
  readonly canEvaluate = computed(() => {
    const s = this.session.snapshot();
    return (
      this.published() &&
      s.status === 'authenticated' &&
      hasPermissions(s.permissions, ['workflows.manage', 'requests.start'])
    );
  });
  readonly active = signal(false);
  readonly busy = signal<readonly string[]>([]);
  readonly errors = signal<Record<string, string>>({});
  readonly workflows = signal<Page<NamedAgentResource> | null>(null);
  readonly versions = signal<Page<NamedAgentResource> | null>(null);
  readonly reports = signal<Page<AgentReportSource> | null>(null);
  readonly drafts = signal<Page<AgentEvaluationRequest> | null>(null);
  readonly workflow = signal<NamedAgentResource | null>(null);
  readonly version = signal<NamedAgentResource | null>(null);
  readonly steps = signal<readonly NamedAgentResource[]>([]);
  readonly step = signal('');
  readonly context = signal<AgentWorkflowContext | null>(null);
  readonly savedDecision = signal<AgentChoicePreview | null>(null);
  readonly samplePreview = signal<AgentChoicePreview | null>(null);
  readonly source = signal<AgentReportSource | null>(null);
  readonly lookup = signal<AgentLookupPreview | null>(null);
  readonly selectedRequest = signal<AgentEvaluationRequest | null>(null);
  readonly compatibleRequest = signal(false);
  readonly result = signal<AgentEvaluation | null>(null);
  readonly submitting = signal(false);
  readonly needsReconciliation = signal(false);
  readonly confirmed = signal(false);
  readonly useSample = signal(false);
  readonly enabledInputs = signal<readonly string[]>([]);
  readonly sampleValues = signal<Partial<Record<string, string | boolean>>>({});
  readonly choices = signal<readonly SampleChoice[]>([]);
  readonly fields = computed(() => {
    const spec = (this.record()['spec'] ?? {}) as JsonObject;
    const policy = (spec['data_policy'] ?? {}) as JsonObject;
    const permitted = Array.isArray(policy['allowed_fields'])
      ? policy['allowed_fields'].filter(
          (v): v is string => typeof v === 'string',
        )
      : [];
    const decision = (spec['decision'] ?? {}) as JsonObject;
    return sampleFields(
      this.context()?.schema ?? null,
      permitted,
      String(decision['options_input_key'] ?? ''),
    );
  });
  readonly decision = computed(() =>
    this.useSample()
      ? this.samplePreview()
      : (this.context()?.decision ?? this.savedDecision()),
  );
  readonly columns = [{ key: 'name', label: 'Name' }];
  readonly reportColumns = [
    { key: 'name', label: 'Source' },
    { key: 'created_at', label: 'Created at' },
  ];
  workflowSearch = '';
  reportSearch = '';
  limit = 1;
  protected appliedWorkflowSearch = '';
  protected appliedReportSearch = '';
  protected generation = 0;
  protected channels = new Map<string, AbortController>();
  protected queue: MutationCoordinator | null = null;
  protected command: MutationCommand<
    { agent: string; request: string },
    AgentEvaluation
  > | null = null;
  constructor() {
    effect(() => {
      const row = this.record();
      untracked(() => {
        this.clear();
        if (typeof row['ref_id'] === 'string' && row['ref_id']) {
          this.active.set(true);
          void this.loadWorkflows();
          void this.loadSources();
          if (this.canEvaluate()) {
            void this.loadRequests();
          }
        }
      });
    });
    const release = this.actor.register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
  }
  private clear(): void {
    this.generation++;
    this.channels.forEach((value) => value.abort());
    this.channels.clear();
    if (this.confirmed()) {
      this.feedback.answer(false);
    }
    this.active.set(false);
    this.busy.set([]);
    this.errors.set({});
    this.workflows.set(null);
    this.versions.set(null);
    this.reports.set(null);
    this.drafts.set(null);
    this.workflow.set(null);
    this.version.set(null);
    this.steps.set([]);
    this.step.set('');
    this.context.set(null);
    this.savedDecision.set(null);
    this.samplePreview.set(null);
    this.source.set(null);
    this.lookup.set(null);
    this.selectedRequest.set(null);
    this.compatibleRequest.set(false);
    this.result.set(null);
    this.submitting.set(false);
    this.confirmed.set(false);
    this.needsReconciliation.set(false);
    this.useSample.set(false);
    this.enabledInputs.set([]);
    this.sampleValues.set({});
    this.choices.set([]);
    this.workflowSearch = '';
    this.reportSearch = '';
    this.appliedWorkflowSearch = '';
    this.appliedReportSearch = '';
    this.queue = null;
    this.command = null;
  }
  protected cancel(...keys: string[]): void {
    for (const key of keys) {
      this.channels.get(key)?.abort();
      this.channels.delete(key);
    }
    this.busy.update((current) => current.filter((key) => !keys.includes(key)));
  }
  protected async read<T>(
    key: string,
    send: (abort: AbortSignal) => Promise<T>,
    accept: (value: T) => void,
  ): Promise<void> {
    if (!this.active()) {
      return;
    }
    this.cancel(key);
    const controller = new AbortController();
    const generation = this.generation;
    this.channels.set(key, controller);
    this.errors.update((current) => ({ ...current, [key]: '' }));
    this.busy.update((current) => [...current, key]);
    try {
      const value = await send(controller.signal);
      if (
        generation === this.generation &&
        this.channels.get(key) === controller &&
        !controller.signal.aborted
      ) {
        accept(value);
      }
    } catch {
      if (
        generation === this.generation &&
        this.channels.get(key) === controller &&
        !controller.signal.aborted
      ) {
        this.errors.update((current) => ({
          ...current,
          [key]:
            'Unable to load the current authorized data. Refresh or choose again.',
        }));
      }
    } finally {
      if (this.channels.get(key) === controller) {
        this.channels.delete(key);
        this.busy.update((current) => current.filter((value) => value !== key));
      }
    }
  }

  requestTitle(request: AgentEvaluationRequest): string {
    return request.untitled
      ? this.locale.text('Untitled request')
      : request.name;
  }
  abstract loadWorkflows(page?: number, apply?: boolean): Promise<void>;
  abstract loadSources(page?: number, apply?: boolean): Promise<void>;
  abstract loadRequests(page?: number): Promise<void>;
}
