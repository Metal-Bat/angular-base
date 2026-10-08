import { computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import {
  emptyQuery,
  ListQuery,
  queryBody,
} from '../../../../shared/domain/list-query';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { FieldSpec, parseDocument, ResourceKey } from '../../domain/authoring';
import { STUDIO_API } from '../../bindings';
import { displayValue, initialValue } from './resource-values';
export class CatalogState {
  protected readonly actor = inject(ActorState);
  readonly historyDetail = signal<JsonObject | null>(null);
  readonly historyColumns = [
    { key: 'operation', label: 'Operation' },
    { key: 'changed_at', label: 'Changed at' },
    { key: 'modifier_type', label: 'Actor type' },
    { key: 'reason', label: 'Reason' },
  ];
  readonly formOpen = signal(false);
  readonly historyOpen = signal(false);
  readonly listQuery = signal<ListQuery>(emptyQuery());
  readonly appliedQuery = signal<JsonObject | null>(null);
  readonly queuedReport = signal<JsonObject | null>(null);
  readonly columns = computed(
    () => this.spec.list?.columns ?? [{ key: 'name', label: 'Name' }],
  );
  readonly controlsDisabled = computed(() => this.busy() || this.immutable());
  protected readonly api = inject(STUDIO_API);
  protected readonly route = inject(ActivatedRoute);
  protected readonly feedback = inject(Feedback);
  readonly key = this.route.snapshot.data['resourceKey'] as ResourceKey;
  readonly spec = this.api.spec(this.key);
  readonly items = signal<readonly JsonObject[]>([]);
  readonly selected = signal<JsonObject | null>(null);
  readonly values = signal<JsonObject>({});
  readonly query = signal<JsonObject>({});
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly busy = signal(false);
  readonly dirty = signal(false);
  readonly invalid = signal<readonly string[]>([]);
  readonly error = signal('');
  readonly notice = signal('');
  readonly secret = signal('');
  readonly audit = signal<readonly JsonObject[]>([]);
  readonly auditQuery = signal<ListQuery>(emptyQuery());
  readonly auditPage = signal(1);
  readonly auditPages = signal(0);
  readonly grants = signal('');
  readonly grantPage = signal(1);
  readonly grantPages = signal(0);
  readonly fields = computed(() =>
    (this.selected() ? this.spec.fields : this.spec.createFields).filter(
      (field) =>
        field.key !== 'ref_id' &&
        !(
          this.spec.queryFields.some((scope) => scope.key === field.key) &&
          this.query()[field.key]
        ),
    ),
  );
  readonly immutable = computed(() =>
    ['PUBLISHED', 'RETIRED'].includes(String(this.selected()?.['status'])),
  );
  readonly canSave = computed(
    () =>
      !this.busy() &&
      !this.invalid().length &&
      !this.immutable() &&
      (!this.selected() || this.spec.actions.includes('update')),
  );
  readonly reference = computed(() =>
    String(this.selected()?.['ref_id'] ?? ''),
  );
  readonly versionCatalog: string | null =
    (
      {
        forms: 'form-versions',
        workflows: 'workflow-versions',
        clients: 'client-releases',
        'form-components': 'form-component-versions',
        'form-data-types': 'form-data-type-versions',
      } as Record<string, string>
    )[this.key] ?? null;
  readonly json = JSON.stringify;
  grantBody = '{}';
  grantTarget = '';
  protected generation = 0;
  constructor() {
    const release = inject(ActorState).register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    const parent = this.route.snapshot.queryParamMap.get('parent');
    if (parent && this.spec.queryFields[0]) {
      this.query.set({ [this.spec.queryFields[0].key]: parent });
    }
    this.reset();
    if (!this.spec.queryFields.length || parent) {
      void this.load();
    }
  }
  private clear(): void {
    this.historyDetail.set(null);
    this.historyOpen.set(false);
    this.busy.set(false);
    this.notice.set('');
    this.error.set('');
    this.generation++;
    this.formOpen.set(false);
    this.appliedQuery.set(null);
    this.queuedReport.set(null);
    this.listQuery.set(emptyQuery());
    this.items.set([]);
    this.query.set({});
    this.selected.set(null);
    this.values.set({});
    this.audit.set([]);
    this.auditQuery.set(emptyQuery());
    this.secret.set('');
    this.grants.set('');
    this.grantBody = '{}';
    this.grantTarget = '';
    this.dirty.set(false);
    this.invalid.set([]);
  }
  async canLeave(): Promise<boolean> {
    return (
      !this.dirty() ||
      this.feedback.confirm('Discard unsaved authoring changes?')
    );
  }
  reset(): void {
    this.selected.set(null);
    this.historyDetail.set(null);
    this.audit.set([]);
    this.auditQuery.set(emptyQuery());
    this.secret.set('');
    this.grants.set('');
    this.grantBody = '{}';
    this.grantTarget = '';
    this.error.set('');
    this.dirty.set(false);
    this.invalid.set([]);
    const values: Record<string, JsonValue> = {};
    for (const field of this.spec.createFields) {
      const value = this.query()[field.key] ?? initialValue(field);
      if (value !== undefined) {
        values[field.key] = value;
      }
    }
    this.values.set(values);
  }
  async create(): Promise<void> {
    if (await this.canLeave()) {
      this.reset();
      this.formOpen.set(true);
    }
  }
  edit(): void {
    this.values.set({ ...this.selected()! });
    this.dirty.set(false);
    this.formOpen.set(true);
  }
  async closeForm(): Promise<void> {
    if (this.busy() || !(await this.canLeave())) {
      return;
    }
    this.formOpen.set(false);
    this.values.set({ ...(this.selected() ?? {}) });
    this.invalid.set([]);
    this.error.set('');
    this.dirty.set(false);
  }
  applyList(query: ListQuery): void {
    void this.load(1, false, {
      ...this.query(),
      ...queryBody(query),
    } as JsonObject);
  }
  applyScope(): void {
    this.applyList(this.listQuery());
  }
  back(): void {
    this.reset();
    this.formOpen.set(false);
    void this.load(this.page());
  }
  display(field: FieldSpec, query = false): string {
    return displayValue(field, query ? this.query() : this.values());
  }
  change(field: FieldSpec, raw: string | boolean, query = false): void {
    if (!query) {
      this.dirty.set(true);
    }
    try {
      let value: JsonValue | undefined;
      if (raw === '' && !field.required) {
        value = undefined;
      } else if (field.type === 'boolean') {
        value = Boolean(raw);
      } else if (field.type === 'number') {
        value = Number(raw);
        if (!Number.isFinite(value)) {
          throw Error('Invalid number');
        }
      } else if (field.type === 'json') {
        if (String(raw).length > 262144) {
          throw Error('Document too large');
        }
        value = JSON.parse(String(raw)) as JsonValue;
        parseDocument(JSON.stringify({ value }));
      } else {
        value = String(raw);
      }
      const state = query ? this.query : this.values;
      const next = { ...state() };
      if (value === undefined) {
        delete next[field.key];
      } else {
        next[field.key] = value;
      }
      state.set(next);
      if (!query) {
        this.dirty.set(true);
      }
      this.invalid.update((keys) => keys.filter((key) => key !== field.key));
      this.error.set(
        this.invalid().length ? 'Correct all invalid fields before saving' : '',
      );
    } catch {
      this.invalid.update((keys) => [...new Set([...keys, field.key])]);
      this.error.set('Invalid value: ' + field.title);
    }
  }
  async load(page = 1, report = false, draft?: JsonObject): Promise<void> {
    const snapshot = structuredClone({
      size: 20,
      filters: [],
      sort_orders: [],
      ...(draft ?? this.appliedQuery() ?? this.query()),
      page,
    });
    const epoch = this.actor.epoch;
    if (
      report &&
      (!this.appliedQuery() ||
        !(await this.feedback.confirm('Request a report of the current list?')))
    ) {
      return;
    }
    if (epoch !== this.actor.epoch) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.search(this.key, page, snapshot, report);
      if (generation !== this.generation) {
        return;
      }
      if (report) {
        this.queuedReport.set(result.items[0] ?? null);
        this.notice.set('Report requested. Track it in My Reports.');
      } else {
        this.items.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.appliedQuery.set({ ...snapshot, page: result.page });
        this.listQuery.set({
          page: result.page,
          size: Number(snapshot.size),
          filters: snapshot.filters as unknown as ListQuery['filters'],
          sort_orders:
            snapshot.sort_orders as unknown as ListQuery['sort_orders'],
          extras: {},
        });
      }
    } catch {
      if (generation === this.generation) {
        this.error.set(
          'The catalog is unavailable. Check required filters and permissions.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async open(reference: string): Promise<void> {
    if (!(await this.canLeave())) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.secret.set('');
    this.grants.set('');
    this.grantBody = '{}';
    this.grantTarget = '';
    this.error.set('');
    try {
      const row = await this.api.get(this.key, reference);
      if (generation === this.generation) {
        this.accept(row);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('This definition is unavailable.');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  protected accept(row: JsonObject): void {
    const nested = row['client'];
    this.secret.set(typeof row['secret'] === 'string' ? row['secret'] : '');
    const value: JsonObject =
      nested && typeof nested === 'object' && !Array.isArray(nested)
        ? (nested as JsonObject)
        : row;
    this.selected.set(value);
    this.values.set({ ...value });
    this.dirty.set(false);
    this.invalid.set([]);
    this.audit.set([]);
    this.auditQuery.set(emptyQuery());
    this.historyDetail.set(null);
    this.formOpen.set(false);
    this.notice.set('');
  }
}
