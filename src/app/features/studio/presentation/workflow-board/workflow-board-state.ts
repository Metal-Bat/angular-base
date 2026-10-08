import { ApiFailure } from '../../../../core/transport/api-failure';
import { authorIssues } from '../../domain/authoring-diagnostics';
import { computed, DestroyRef, Directive, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { JsonObject } from '../../../forms/domain/runtime-document';
import {
  emptyWorkspace,
  Workspace,
  WorkspaceState,
} from '../../domain/authoring';
import { WorkspaceHistory } from '../../domain/workflow-authoring';
import { CANVAS_VIEW, STUDIO_API } from '../../bindings';
@Directive()
export abstract class WorkflowBoardState {
  protected readonly api = inject(STUDIO_API);
  protected readonly feedback = inject(Feedback);
  readonly canvas = inject(CANVAS_VIEW);
  readonly reference = signal(
    inject(ActivatedRoute).snapshot.paramMap.get('ref') ?? '',
  );
  readonly state = signal<WorkspaceState | null>(null);
  readonly document = signal<Workspace>(emptyWorkspace());
  readonly catalogEntries = signal<readonly JsonObject[]>([]);
  readonly pending = signal<readonly string[]>([]);
  readonly catalog = signal<readonly JsonObject[]>([]);
  readonly catalogPage = signal(1);
  readonly catalogPages = signal(0);
  readonly busy = signal(false);
  readonly dirty = signal(false);
  readonly status = signal('');
  readonly error = signal('');
  readonly diagnostics = signal('');
  readonly issues = computed(() => {
    try {
      return authorIssues(
        JSON.parse(this.diagnostics()),
        this.document().graph,
      );
    } catch {
      return [];
    }
  });
  readonly readonly = computed(() => this.busy() || this.status() !== 'DRAFT');
  readonly selected = signal('');
  selectedJson = '{}';
  graphJson = '{}';
  stepKey = 'step';
  typeKey = '';
  outcome = 'next';
  selectorKind = 'forms';
  selectorSearch = '';
  requestType = '';
  startForm = '';
  source = '';
  target = '';
  collapsedJson = '[]';
  routingJson = '{}';
  protected readonly history = new WorkspaceHistory();
  protected generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    void this.load();
    void this.loadCatalog();
  }
  protected clear(): void {
    this.generation++;
    this.reference.set('');
    this.selected.set('');
    this.source = '';
    this.target = '';
    this.requestType = '';
    this.startForm = '';
    this.selectorSearch = '';
    this.collapsedJson = '';
    this.routingJson = '';
    this.document.set(emptyWorkspace());
    this.state.set(null);
    this.catalog.set([]);
    this.catalogEntries.set([]);
    this.pending.set([]);
    this.status.set('');
    this.error.set('');
    this.busy.set(false);
    this.history.clear();
    this.dirty.set(false);
    this.selectedJson = '';
    this.graphJson = '';
    this.diagnostics.set('');
  }
  async canLeave(): Promise<boolean> {
    return (
      (!this.dirty() && !this.pending().length) ||
      this.feedback.confirm('Discard unsaved workflow workspace changes?')
    );
  }
  async load(): Promise<void> {
    if (
      (this.dirty() || this.pending().length > 0) &&
      !(await this.feedback.confirm(
        'Reload current workspace and discard local changes?',
      ))
    ) {
      return;
    }
    await this.run(async (generation) => {
      const version = await this.api.get('workflow-versions', this.reference());
      const state = await this.api.workspace(String(version['ref_id']));
      if (generation !== this.generation) {
        return;
      }
      this.status.set(String(version['status']));
      this.reference.set(state.version);
      this.state.set(state);
      this.document.set(state.document);
      this.selected.set('');
      this.selectedJson = '{}';
      this.graphJson = JSON.stringify(state.document.graph, null, 2);
      this.collapsedJson = JSON.stringify(state.document.collapsed);
      this.routingJson = JSON.stringify(state.document.routing, null, 2);
      this.history.clear();
      this.pending.set([]);
      this.dirty.set(false);
    });
  }
  async loadCatalog(page = 1): Promise<void> {
    const generation = this.generation;
    try {
      if (!this.catalogEntries().length) {
        const entries: JsonObject[] = [];
        let totalPages = 1;
        for (let index = 1; index <= totalPages; index++) {
          const result = (await this.api.auxiliary('catalog', {
            page: index,
            size: 100,
          })) as { items: JsonObject[]; totalPages: number };
          if (generation !== this.generation) {
            return;
          }
          totalPages = result.totalPages;
          if (totalPages > 10) {
            throw Error(
              'Designer catalog exceeds the supported workspace budget',
            );
          }
          entries.push(
            ...result.items.filter((row) => row['category'] === 'step_type'),
          );
        }
        this.catalogEntries.set(entries);
      }
      this.catalog.set(this.catalogEntries().slice((page - 1) * 20, page * 20));
      this.catalogPage.set(page);
      this.catalogPages.set(Math.ceil(this.catalogEntries().length / 20));
      if (!this.typeKey && this.catalog()[0]) {
        this.typeKey = String(this.catalog()[0]['key']);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'Designer catalog unavailable or exceeds the supported workspace budget',
        );
      }
    }
  }
  async save(): Promise<void> {
    if (!this.state() || this.readonly() || this.pending().length) {
      return;
    }
    await this.run(async (generation) => {
      const saved = await this.api.saveWorkspace(
        this.state()!,
        this.document(),
      );
      if (generation !== this.generation) {
        return;
      }
      this.state.set(saved);
      this.document.set(saved.document);
      this.dirty.set(false);
      this.diagnostics.set('Workspace saved. This is not an executable graph.');
    });
  }
  async validate(): Promise<void> {
    await this.run(async (generation) => {
      const result = await this.api.auxiliary('graph', this.document().graph);
      if (generation === this.generation) {
        this.diagnostics.set(JSON.stringify(result, null, 2));
      }
    });
  }
  async promote(): Promise<void> {
    if (
      this.dirty() ||
      this.pending().length > 0 ||
      !this.state()?.reference ||
      this.readonly() ||
      !(await this.feedback.confirm(
        'Validate and promote this saved workspace into the draft executable graph?',
      ))
    ) {
      return;
    }
    await this.run(async (generation) => {
      const row = await this.api.promote(this.state()!);
      const state = await this.api.workspace(String(row['ref_id']));
      if (generation !== this.generation) {
        return;
      }
      this.state.set(state);
      this.reference.set(state.version);
      this.diagnostics.set(
        'Promoted. Publication is a separate explicit action.',
      );
    });
  }
  async publish(): Promise<void> {
    if (
      this.dirty() ||
      this.pending().length > 0 ||
      this.readonly() ||
      !(await this.feedback.confirm(
        'Publish this promoted version as an immutable executable workflow?',
      ))
    ) {
      return;
    }
    await this.run(async (generation) => {
      const row = await this.api.action(
        'workflow-versions',
        this.reference(),
        'publish',
      );
      if (generation !== this.generation) {
        return;
      }
      this.reference.set(String(row['ref_id']));
      this.status.set(String(row['status']));
      this.diagnostics.set('Published immutable workflow version');
    });
  }
  readonly assistantPage = signal(1);
  readonly assistantPages = signal(0);
  assistantTool = 'selectors';
  async inspect(tool: string, page = 1): Promise<void> {
    this.assistantTool = tool;
    this.assistantPage.set(page);
    await this.run(async (generation) => {
      const body: JsonObject =
        tool === 'workspaceHistory'
          ? { page, size: 20 }
          : tool === 'selectors'
            ? {
                page,
                size: 20,
                ...(this.selectorSearch ? { search: this.selectorSearch } : {}),
              }
            : tool === 'inventory'
              ? {
                  workflow_version_ref_id: this.reference(),
                  ...(this.startForm
                    ? { start_form_version_ref_id: this.startForm }
                    : {}),
                  page,
                  size: 20,
                }
              : {
                  workflow_version_ref_id: this.reference(),
                  request_type_ref_id: this.requestType,
                  current_step_key: this.selected(),
                  page,
                  size: 20,
                };
      const value = await this.api.auxiliary(
        tool,
        body,
        tool === 'workspaceHistory'
          ? { ref_id: this.reference() }
          : tool === 'selectors'
            ? { kind: this.selectorKind }
            : undefined,
      );
      if (generation === this.generation) {
        this.diagnostics.set(JSON.stringify(value, null, 2));
        const pagination = value as {
          totalPages?: number;
          total_pages?: number;
          total?: number;
          size?: number;
        };
        this.assistantPages.set(
          pagination.totalPages ??
            pagination.total_pages ??
            Math.ceil((pagination.total ?? 0) / (pagination.size ?? 20)),
        );
      }
    });
  }
  protected async run(
    work: (generation: number) => Promise<void>,
  ): Promise<void> {
    if (this.busy()) {
      return;
    }
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      await work(generation);
    } catch (error) {
      if (generation === this.generation) {
        if (error instanceof ApiFailure) {
          this.diagnostics.set(
            JSON.stringify({ issues: error.issues }, null, 2),
          );
        }
        this.error.set(
          'The operation failed or conflicted. Local WIP is retained; reload and reconcile before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
