import { computed, DestroyRef, Directive, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { FieldEdit } from '../../../forms/domain/canonical-values';
import { replaceRow } from '../../../forms/domain/row-values';
import {
  JsonObject,
  RuntimeCompatibility,
} from '../../../forms/domain/runtime-document';
import { parseDocument } from '../../domain/authoring';
import { authorIssues } from '../../domain/authoring-diagnostics';
import { outline, palette } from '../../domain/form-authoring';
import { STUDIO_API } from '../../bindings';
const documentKeys = [
  'data_dialect',
  'render_dialect',
  'behavior_dialect',
  'data_schema',
  'render_schema',
  'page_settings',
  'variants',
  'reuse_instances',
  'localization',
];
@Directive()
export abstract class FormBuilderCommands {
  abstract select(path: readonly number[]): void;
  readonly api = inject(STUDIO_API);
  protected readonly feedback = inject(Feedback);
  readonly reference = signal(
    inject(ActivatedRoute).snapshot.paramMap.get('ref') ?? '',
  );
  readonly documents = signal<JsonObject>({
    data_schema: { type: 'object', properties: {} },
    render_schema: { root: { component: 'vertical', children: [] } },
  });
  readonly status = signal('');
  readonly dirty = signal(false);
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
  readonly outline = computed(() =>
    outline(this.documents()['render_schema'] as JsonObject),
  );
  readonly readonly = computed(() => this.status() !== 'DRAFT' || this.busy());
  readonly preview = signal<RuntimeCompatibility | null>(null);
  readonly runtime = computed(() => {
    const value = this.preview();
    return value?.status === 'ready' ? value.document : null;
  });
  readonly data = signal<JsonObject>({});
  selectedJson = '{}';
  schemaJson = '{}';
  behaviorJson = '{}';
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
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    void this.load();
  }
  protected abstract resetEditorHistory(): void;
  protected clear(): void {
    this.resetEditorHistory();
    this.generation++;
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
    this.selectedJson = '';
    this.schemaJson = '';
    this.behaviorJson = '';
    this.sampleJson = '';
    this.dirty.set(false);
  }
  async canLeave(): Promise<boolean> {
    return (
      (!(this.dirty() || this.pending().length > 0) &&
        !this.pending().length) ||
      this.feedback.confirm('Discard unsaved form changes?')
    );
  }
  async load(): Promise<void> {
    if (
      (this.dirty() || this.pending().length > 0) &&
      !(await this.feedback.confirm('Reload and discard local form changes?'))
    ) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    try {
      const row = await this.api.get('form-versions', this.reference());
      if (generation === this.generation) {
        this.reference.set(String(row['ref_id']));
        this.status.set(String(row['status']));
        this.documents.set(
          Object.fromEntries(
            documentKeys
              .filter((key) => row[key] !== undefined)
              .map((key) => [key, row[key]]),
          ),
        );
        this.schemaJson = JSON.stringify(row['data_schema'], null, 2);
        this.behaviorJson = JSON.stringify(
          {
            page_settings: row['page_settings'] ?? {},
            variants: row['variants'] ?? [],
            localization: row['localization'] ?? null,
            reuse_instances: row['reuse_instances'] ?? null,
            behavior_dialect: row['behavior_dialect'] ?? null,
          },
          null,
          2,
        );
        this.resetEditorHistory();
        this.pending.set([]);
        this.select([]);
        this.dirty.set(false);
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
    this.preview.set(null);
  }
  async save(): Promise<void> {
    if (this.readonly() || this.pending().length) {
      return;
    }
    await this.run(async (generation) => {
      const row = await this.api.write(
        'form-versions',
        this.reference(),
        this.documents(),
      );
      if (generation !== this.generation) {
        return;
      }
      this.reference.set(String(row['ref_id']));
      this.dirty.set(false);
      this.diagnostics.set('Saved');
    });
  }
  async validate(): Promise<void> {
    await this.run(async (generation) => {
      const result = await this.api.auxiliary('validate', this.documents());
      if (generation === this.generation) {
        this.diagnostics.set(JSON.stringify(result, null, 2));
      }
    });
  }
  async renderPreview(): Promise<void> {
    await this.run(async (generation) => {
      const sample = parseDocument(this.sampleJson);
      const result = await this.api.preview(
        this.documents(),
        sample,
        this.purpose,
        this.locale,
        parseDocument(this.previewContextJson),
      );
      if (generation !== this.generation) {
        return;
      }
      this.preview.set(result);
      if (result.status === 'ready') {
        this.data.set(result.document.canonical);
      } else {
        this.error.set('Preview is incompatible');
      }
    });
  }
  editSample(change: FieldEdit): void {
    if (change.error) {
      this.error.set(change.error);
      return;
    }
    try {
      this.data.set(
        replaceRow(
          this.data(),
          change.scope,
          change.indices ?? [],
          change.value,
        ),
      );
      this.sampleJson = JSON.stringify(this.data(), null, 2);
    } catch {
      this.error.set('Sample change is unavailable');
    }
  }
  async inspect(tool: string): Promise<void> {
    await this.run(async (generation) => {
      const body =
        tool === 'navigation' || tool === 'options'
          ? {
              documents: this.documents(),
              query: parseDocument(this.interactionJson),
            }
          : tool === 'schema'
            ? {}
            : tool === 'behavior'
              ? {
                  documents: this.documents(),
                  data: parseDocument(this.sampleJson),
                  initialize: true,
                }
              : this.documents();
      const result = await this.api.auxiliary(tool, body);
      if (generation === this.generation) {
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
