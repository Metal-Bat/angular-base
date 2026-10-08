import { computed, DestroyRef, inject, signal } from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { SessionContext } from '../../../core/auth/session-context';
import { AuthSession } from '../../../core/auth/auth-session';
import { hasPermissions } from '../../../core/permissions/area-access';
import { Feedback } from '../../../core/feedback/feedback';
import { ApiFailure } from '../../../core/transport/api-failure';
import { BinaryTransfer } from '../../../core/transport/binary-transfer';
import { BoundedPolling } from '../../../core/transport/bounded-polling';
import { emptyQuery, ListQuery } from '../../../shared/domain/list-query';
import {
  HISTORY_DEFINITION,
  RECORD_DEFINITION,
  RECORDS,
  ROLE_DEFINITION,
} from '../bindings';
import {
  RecordDefinition,
  RecordPage,
  recordReference,
  RecordRow,
} from '../domain/records';
export class ResourceState {
  protected readonly entityHistoryDefinition = inject(HISTORY_DEFINITION);
  readonly definition = inject(RECORD_DEFINITION);
  readonly rolesDefinition = inject(ROLE_DEFINITION);
  protected readonly api = inject(RECORDS);
  protected readonly actor = inject(ActorState);
  protected readonly session = inject(SessionContext);
  protected readonly feedback = inject(Feedback);
  protected readonly auth = inject(AuthSession);
  readonly transfer = inject(BinaryTransfer);
  readonly applied = signal<ListQuery>(emptyQuery());
  readonly page = signal<RecordPage | null>(null);
  readonly detail = signal<RecordRow | null>(null);
  readonly busy = signal(false);
  readonly actionBusy = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly queuedReport = signal<RecordRow | null>(null);
  readonly polling = inject(BoundedPolling);
  readonly mode = signal<'create' | 'edit' | 'password' | null>(null);
  readonly roleModal = signal(false);
  readonly historyModal = signal(false);
  readonly rolesPage = signal<RecordPage | null>(null);
  readonly historyPage = signal<RecordPage | null>(null);
  readonly historyQuery = signal<ListQuery>(emptyQuery());
  readonly rolesQuery = signal<ListQuery>(emptyQuery());
  readonly historyDefinition = signal<RecordDefinition | null>(null);
  readonly selectedRole = signal<RecordRow | null>(null);
  fieldErrors: Record<string, string> = {};
  readonly modalError = signal('');
  readonly formDirty = signal(false);
  values: Record<string, string | boolean> = {};
  password = '';
  entityName = 'USER';
  historyDetail: RecordRow | null = null;
  readonly entries = Object.entries;
  private appliedEntityName = 'USER';
  showEntityHistory(): void {
    void this.load({ ...this.applied(), page: 1 }, this.entityName);
  }
  protected generation = 0;
  protected roleGeneration = 0;
  protected historyGeneration = 0;
  readonly user = this.definition.userPartition !== undefined;
  readonly allowed = computed(() => this.can(this.definition.permission));
  readonly roleAllowed = computed(() => this.can('admin.permissions.manage'));
  readonly visibleFields = computed(() =>
    this.mode() === 'create'
      ? this.definition.createFields
      : this.definition.fields,
  );
  readonly formWidth = computed(() =>
    this.visibleFields().some((field) => field.type === 'json')
      ? '56rem'
      : '38rem',
  );
  readonly deleted = computed(
    () =>
      !!this.detail()?.['deleted_at'] ||
      (this.user && this.detail()?.['is_active'] === false),
  );
  readonly immutable = computed(
    () =>
      this.definition.immutableStatuses?.includes(
        String(this.detail()?.['status']),
      ) ?? false,
  );
  constructor() {
    const release = this.actor.register(() => this.clear());
    inject(DestroyRef).onDestroy(() => {
      this.clear();
      release();
    });
    void this.load();
    if (this.definition.key === 'reports') {
      this.polling.start(
        async (abort) => {
          if (abort.aborted) {
            return;
          }
          const row = this.detail();
          if (row) {
            await this.open(row, abort);
          } else {
            await this.load(undefined, undefined, abort);
          }
        },
        () =>
          this.allowed() &&
          !this.busy() &&
          !this.actionBusy() &&
          !this.mode() &&
          !this.transfer.busy() &&
          (!this.detail() ||
            ['PENDING', 'PROCESSING', 'QUEUED'].includes(
              String(this.detail()?.['status']),
            )),
      );
    }
  }
  can(permission: string): boolean {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, permission ? [permission] : [])
    );
  }
  closeRole(): void {
    if (this.actionBusy()) {
      return;
    }
    this.roleGeneration++;
    this.roleModal.set(false);
    this.selectedRole.set(null);
    this.rolesPage.set(null);
    this.modalError.set('');
    this.fieldErrors = {};
  }
  closeHistory(): void {
    if (this.actionBusy()) {
      return;
    }
    this.historyGeneration++;
    this.historyModal.set(false);
    this.historyPage.set(null);
    this.historyDetail = null;
    this.modalError.set('');
    this.fieldErrors = {};
  }
  private clear(): void {
    this.feedback.answer(false);
    this.generation++;
    this.roleGeneration++;
    this.historyGeneration++;
    this.page.set(null);
    this.detail.set(null);
    this.rolesPage.set(null);
    this.historyPage.set(null);
    this.selectedRole.set(null);
    this.mode.set(null);
    this.roleModal.set(false);
    this.historyModal.set(false);
    this.values = {};
    this.password = '';
    this.historyDetail = null;
    this.applied.set(emptyQuery());
    this.historyQuery.set(emptyQuery());
    this.rolesQuery.set(emptyQuery());
    this.formDirty.set(false);
    this.busy.set(false);
    this.actionBusy.set(false);
    this.notice.set('');
    this.queuedReport.set(null);
    this.historyDefinition.set(null);
    this.modalError.set('');
    this.fieldErrors = {};
    this.entityName = 'USER';
    this.appliedEntityName = 'USER';
    this.error.set('');
  }
  async canLeave(): Promise<boolean> {
    return (
      !this.formDirty() || this.feedback.confirm('Discard unsaved changes?')
    );
  }
  async load(
    query = this.applied(),
    entityName = this.appliedEntityName,
    abort?: AbortSignal,
  ): Promise<void> {
    if (!this.allowed()) {
      return;
    }
    const generation = ++this.generation;
    const snapshot = structuredClone(query);
    this.busy.set(true);
    this.error.set('');
    try {
      const page = await this.api.list(
        this.definition,
        snapshot,
        this.definition.key === 'history'
          ? { entity_name: entityName }
          : undefined,
        abort,
      );
      if (generation !== this.generation || abort?.aborted) {
        return;
      }
      this.page.set(page);
      this.appliedEntityName = entityName;
      this.applied.set({ ...snapshot, page: page.page, size: page.size });
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(this.message(error));
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
  async actionChanged(): Promise<void> {
    this.notice.set('Command accepted. Checking current state.');
    const row = this.detail();
    if (row) {
      await this.open(row);
    }
    await this.load();
  }
  pageTo(page: number): void {
    void this.load({ ...this.applied(), page });
  }
  protected message(error: unknown): string {
    if (error instanceof ApiFailure && error.httpStatus !== 409) {
      return error.message;
    }
    return error instanceof ApiFailure && error.httpStatus === 409
      ? 'The record changed. Reload the current record before retrying.'
      : 'The service is unavailable. Your current view has been retained.';
  }
  async open(row: Record<string, unknown>, abort?: AbortSignal): Promise<void> {
    if (this.busy() || this.actionBusy()) {
      return;
    }
    const reference = recordReference(row as RecordRow);
    if (!this.definition.operations.get) {
      this.detail.set(row as RecordRow);
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const detail = await this.api.detail(this.definition, reference, abort);
      if (generation === this.generation && !abort?.aborted) {
        this.detail.set(detail);
      }
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(this.message(error));
      }
    } finally {
      if (generation === this.generation) {
        this.busy.set(false);
      }
    }
  }
}
