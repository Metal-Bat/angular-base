import { displayValue, initialValue, resourceLabel } from './resource-values';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActorState } from '../../../../core/auth/actor-state';
import { Feedback } from '../../../../core/feedback/feedback';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { FieldSpec, parseDocument, ResourceKey } from '../../domain/authoring';
import { STUDIO_API } from '../../bindings';
@Component({
  selector: 'app-resource-catalog',
  imports: [FormsModule, RouterLink, LocalizePipe],
  templateUrl: './resource-catalog.html',
  styleUrl: './resource-catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCatalog {
  private readonly api = inject(STUDIO_API);
  private readonly route = inject(ActivatedRoute);
  private readonly feedback = inject(Feedback);
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
  readonly auditPage = signal(1);
  readonly auditPages = signal(0);
  readonly grants = signal('');
  readonly grantPage = signal(1);
  readonly grantPages = signal(0);
  readonly fields = computed(() =>
    this.selected() ? this.spec.fields : this.spec.createFields,
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
  private generation = 0;
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
    this.generation++;
    this.items.set([]);
    this.query.set({});
    this.selected.set(null);
    this.values.set({});
    this.audit.set([]);
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
    this.audit.set([]);
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
    }
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
  async load(page = 1, report = false): Promise<void> {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.search(
        this.key,
        page,
        this.query(),
        report,
      );
      if (generation === this.generation) {
        this.items.set(result.items);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
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
  private accept(row: JsonObject): void {
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
    this.notice.set('Saved');
  }
  async save(): Promise<void> {
    if (!this.canSave() || this.error()) {
      return;
    }
    if (
      this.key === 'request-types' &&
      Array.isArray(this.selected()?.['client_targets']) &&
      (this.selected()!['client_targets'] as JsonValue[]).length &&
      Array.isArray(this.values()['client_targets']) &&
      !(this.values()['client_targets'] as JsonValue[]).length &&
      !(await this.feedback.confirm(
        'Remove all confidential-client restrictions from this request type?',
      ))
    ) {
      return;
    }
    await this.command(() =>
      this.api.write(this.key, this.reference() || null, this.values()),
    );
  }
  async command(send: () => Promise<JsonObject>): Promise<void> {
    if (this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await send();
      if (generation === this.generation) {
        if (result['ref_id'] || result['client']) {
          this.accept(result);
        } else {
          this.notice.set('Command completed. Refresh current state.');
        }
      }
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(
          error instanceof ApiFailure && error.httpStatus === 409
            ? 'This definition changed. Your edits are retained; reopen and compare before retrying.'
            : 'The command could not be confirmed. Refresh current state before retrying.',
        );
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async act(action: string): Promise<void> {
    if (!this.reference() || this.dirty() || this.busy()) {
      return;
    }
    if (
      !(await this.feedback.confirm(
        action + ' ' + this.spec.title + '? This may affect availability.',
      ))
    ) {
      return;
    }
    await this.command(() =>
      this.api.action(this.key, this.reference(), action),
    );
    if (action === 'remove' && !this.error()) {
      this.reset();
      await this.load(this.page());
    }
  }
  async history(page = 1): Promise<void> {
    if (!this.reference() || this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    try {
      const result = await this.api.history(this.key, this.reference(), page);
      if (generation === this.generation) {
        this.audit.set(result.items);
        this.auditPage.set(result.page);
        this.auditPages.set(result.totalPages);
      }
    } catch {
      if (generation === this.generation) {
        this.error.set('History is unavailable');
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async loadGrants(page = 1): Promise<void> {
    const generation = this.generation;
    try {
      const result = await this.api.action(
        this.key,
        this.reference(),
        'grants',
        { page, size: 20, filters: [], sort_orders: [] },
      );
      if (generation !== this.generation) {
        return;
      }
      this.grants.set(JSON.stringify(result['items'], null, 2));
      this.grantPage.set(Number(result['page']));
      this.grantPages.set(Number(result['total_pages']));
    } catch {
      if (generation === this.generation) {
        this.error.set('Grant list unavailable');
      }
    }
  }
  async grant(remove = false): Promise<void> {
    if (
      this.dirty() ||
      !(await this.feedback.confirm(
        remove ? 'Revoke this exact grant?' : 'Add this access grant?',
      ))
    ) {
      return;
    }
    try {
      const body = remove ? undefined : parseDocument(this.grantBody);
      await this.command(() =>
        this.api.action(
          this.key,
          this.reference(),
          remove ? 'revoke' : 'grant',
          body,
          remove ? this.grantTarget : undefined,
        ),
      );
    } catch {
      this.error.set('Invalid grant document');
    }
  }
  label(row: JsonObject): string {
    return resourceLabel(row);
  }
  ref(row: JsonObject): string {
    return String(row['ref_id']);
  }
}
