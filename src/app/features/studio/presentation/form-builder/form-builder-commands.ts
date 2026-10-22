import { formOutline } from '../form-selection-label';
import {
  inspectionBody,
  inspectionContext,
} from '../../domain/form-inspection';
import { componentLabels, quickFieldTypes } from './form-palette';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { FieldEdit } from '../../../forms/domain/canonical-values';
import { editFormSample } from '../form-preview-sample';
import {
  JsonObject,
  RuntimeCompatibility,
} from '../../../forms/domain/runtime-document';
import { parseDocument } from '../../domain/authoring';
import { authorIssues } from '../../domain/authoring-diagnostics';
import { palette } from '../../domain/form-authoring';
import { STUDIO_API } from '../../bindings';
import { formDocuments } from '../../domain/form-documents';
@Directive()
export abstract class FormBuilderCommands {
  readonly quickFieldTypes = quickFieldTypes;
  readonly componentLabels = componentLabels;
  readonly workspaceTab = signal('design');
  readonly toolsOpen = signal(false);
  readonly dragging = signal(false);
  readonly paletteSearch = signal('');
  componentLabel = '';
  readonly paletteCategory = signal('');

  readonly toolsTab = signal<string | number>('components');
  readonly previewMode = signal(false);
  readonly previewDevice = signal<'desktop' | 'phone'>('desktop');
  abstract select(path: readonly number[]): boolean;
  readonly api = inject(STUDIO_API);
  protected readonly feedback = inject(Feedback);
  private readonly route = inject(ActivatedRoute);
  readonly reference = signal(this.route.snapshot.paramMap.get('ref') ?? '');
  readonly documents = signal<JsonObject>({
    data_schema: { type: 'object', properties: {} },
    render_schema: { root: { component: 'vertical', children: [] } },
  });
  readonly status = signal('');
  readonly dirty = signal(false);
  readonly contextEpoch = signal(0);
  protected savedDocuments: JsonObject | null = null;
  readonly pending = signal<readonly string[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly diagnostics = signal('');
  readonly issues = computed(() => {
    try {
      return authorIssues(
        JSON.parse(this.diagnostics()),
        this.documents(),
        true,
      );
    } catch {
      return [];
    }
  });
  readonly selected = signal<readonly number[]>([]);
  readonly outline = computed(() => formOutline(this));
  readonly readonly = computed(() => this.status() !== 'DRAFT' || this.busy());
  readonly preview = signal<RuntimeCompatibility | null>(null);
  readonly previewBusy = signal(false);
  readonly previewError = signal('');
  readonly previewFreshness = signal<
    'idle' | 'pending' | 'loading' | 'ready' | 'invalid' | 'failed'
  >('idle');
  private previewSequence = 0;
  private previewController: AbortController | undefined;
  private previewTimer: ReturnType<typeof setTimeout> | undefined;
  queuePreview(): void {
    this.previewSequence++;
    this.previewController?.abort();
    this.previewController = undefined;
    clearTimeout(this.previewTimer);
    this.previewBusy.set(false);
    this.previewError.set('');
    if (!this.reference() || !this.status()) {
      this.preview.set(null);
      this.previewFreshness.set('idle');
      return;
    }
    if (this.pending().length) {
      this.previewFreshness.set('pending');
      return;
    }
    this.previewFreshness.set('loading');
    this.previewTimer = setTimeout(() => void this.renderPreview(), 300);
  }
  readonly runtime = computed(() => {
    const value = this.preview();
    return value?.status === 'ready' ? value.document : null;
  });
  readonly data = signal<JsonObject>({});
  sampleJson = '{}';
  previewContextJson =
    '{"policy":null,"before_data":null,"item_identity":{},"before_item_identity":{}}';
  interactionJson = '{"node_pointer":"/root","data":{},"generation":1}';
  purpose = 'edit';
  locale = 'en';
  propertyName = 'field';
  primitive: (typeof palette)[number] = 'text';
  protected generation = 0;
  protected initialize(): void {
    effect(() => {
      this.documents();
      this.pending();
      this.status();
      this.reference();
      this.queuePreview();
    });
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    this.route.paramMap
      .pipe(
        map((parameters) => parameters.get('ref') ?? ''),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((reference) => void this.load(reference));
  }
  protected abstract resetEditorHistory(): void;
  protected clear(): void {
    this.contextEpoch.update((value) => value + 1);
    this.savedDocuments = null;
    this.resetEditorHistory();
    this.generation++;
    this.previewSequence++;
    this.previewController?.abort();
    this.previewController = undefined;
    clearTimeout(this.previewTimer);
    this.previewBusy.set(false);
    this.previewFreshness.set('idle');
    this.previewError.set('');
    this.reference.set('');
    this.selected.set([]);
    this.previewContextJson = '';
    this.interactionJson = '';
    this.documents.set({
      data_schema: { type: 'object', properties: {} },
      render_schema: { root: { component: 'vertical', children: [] } },
    });
    this.status.set('');
    this.pending.set([]);
    this.diagnostics.set('');
    this.busy.set(false);
    this.preview.set(null);
    this.data.set({});
    this.sampleJson = '';
    this.toolsTab.set('components');
    this.previewMode.set(false);
    this.previewDevice.set('desktop');
    this.dirty.set(false);
  }
  async canLeave(): Promise<boolean> {
    return (
      !(this.dirty() || this.pending().length > 0) ||
      this.feedback.confirm('Discard unsaved form changes?')
    );
  }
  async load(routeReference?: string): Promise<void> {
    const originGeneration = this.generation;
    if (
      (this.dirty() || this.pending().length > 0) &&
      !(await this.feedback.confirm('Reload and discard local form changes?'))
    ) {
      return;
    }
    if (originGeneration !== this.generation) {
      return;
    }
    if (routeReference !== undefined && routeReference !== this.reference()) {
      this.clear();
      this.reference.set(routeReference);
      this.sampleJson = '{}';
      this.previewContextJson =
        '{"policy":null,"before_data":null,"item_identity":{},"before_item_identity":{}}';
    }
    const generation = ++this.generation;
    this.busy.set(true);
    try {
      const row = await this.api.get('form-versions', this.reference());
      if (generation === this.generation) {
        this.reference.set(String(row['ref_id']));
        this.status.set(String(row['status']));
        this.contextEpoch.update((value) => value + 1);
        this.documents.set(formDocuments(row));
        this.savedDocuments = this.documents();
        this.resetEditorHistory();
        this.pending.set([]);
        this.select([]);
        this.dirty.set(false);
        this.preview.set(null);
        this.diagnostics.set('');
        this.error.set('');
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('Form version unavailable');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  markPending(key: string): void {
    this.pending.update((keys) => [...new Set([...keys, key])]);
    this.dirty.set(true);
  }
  async save(): Promise<void> {
    if (this.readonly() || this.pending().length) {
      return;
    }
    await this.run(async (generation) => {
      const documents = this.documents();
      const row = await this.api.write(
        'form-versions',
        this.reference(),
        documents,
      );
      if (generation !== this.generation) {
        return;
      }
      this.reference.set(String(row['ref_id']));
      this.savedDocuments = documents;
      this.reconcileDirty();
      this.diagnostics.set('Saved');
    });
  }
  protected reconcileDirty(): void {
    this.dirty.set(
      this.pending().length > 0 ||
        JSON.stringify(this.documents()) !==
          JSON.stringify(this.savedDocuments),
    );
  }
  async validate(): Promise<void> {
    await this.run(async (generation) => {
      const result = await this.api.auxiliary('validate', this.documents());
      if (generation === this.generation) {
        this.diagnostics.set(JSON.stringify(result, null, 2));
        this.workspaceTab.set('diagnostics');
      }
    });
  }
  async renderPreview(): Promise<void> {
    clearTimeout(this.previewTimer);
    if (!this.reference() || !this.status() || this.pending().length) {
      this.queuePreview();
      return;
    }
    const sequence = ++this.previewSequence;
    this.previewController?.abort();
    const controller = new AbortController();
    this.previewController = controller;
    const generation = this.generation;
    const documents = this.documents();
    const purpose = this.purpose;
    const locale = this.locale;
    const context = this.previewContextJson;
    const sampleJson = this.sampleJson;
    const current = (): boolean =>
      sequence === this.previewSequence &&
      !controller.signal.aborted &&
      generation === this.generation &&
      documents === this.documents() &&
      purpose === this.purpose &&
      locale === this.locale &&
      context === this.previewContextJson &&
      sampleJson === this.sampleJson &&
      !this.pending().length;
    this.previewBusy.set(true);
    this.previewFreshness.set('loading');
    this.previewError.set('');
    try {
      const result = await this.api.preview(
        documents,
        parseDocument(sampleJson),
        purpose,
        locale,
        parseDocument(context),
        controller.signal,
      );
      if (!current()) {
        return;
      }
      if (result.status === 'ready') {
        this.preview.set(result);
        this.data.set(result.document.canonical);
        this.previewFreshness.set('ready');
      } else {
        this.previewFreshness.set('invalid');
        this.previewError.set('Preview is incompatible');
      }
    } catch (error) {
      if (current()) {
        if (error instanceof ApiFailure && error.httpStatus === 422) {
          this.diagnostics.set(JSON.stringify({ issues: error.issues }));
          this.previewFreshness.set('invalid');
          this.previewError.set(
            'Review diagnostics to correct the form configuration.',
          );
        } else {
          this.previewFreshness.set('failed');
          this.previewError.set('The form display is unavailable.');
        }
      }
    } finally {
      if (sequence === this.previewSequence && generation === this.generation) {
        this.previewController = undefined;
        this.previewBusy.set(false);
      }
    }
  }
  editSample(change: FieldEdit): void {
    editFormSample(this, change);
  }
  async inspect(tool: string, query?: JsonObject): Promise<void> {
    await this.run(async (generation) => {
      const current = inspectionContext(this, tool);
      const body = inspectionBody(tool, this, query);
      const result = await this.api.auxiliary(tool, body);
      if (generation === this.generation && current()) {
        this.diagnostics.set(JSON.stringify(result, null, 2));
      }
    });
  }
  private async run(
    work: (generation: number) => Promise<void>,
  ): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const generation = this.generation;
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
          'The operation failed. Review diagnostics or reload current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
