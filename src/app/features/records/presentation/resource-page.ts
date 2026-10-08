import { focusInvalidControl } from '../../../shared/ui/focus-invalid-control';
import { RecordFields } from './record-fields/record-fields';
import { ResourceActions } from '../../administration/presentation/resource-actions/resource-actions';
import { ApiFailure } from '../../../core/transport/api-failure';
import { CopyField } from '../../../shared/ui/copy-field/copy-field';
import { ControlField } from '../../../shared/ui/control-field/control-field';
import { RecordSummary } from '../../../shared/ui/record-summary/record-summary';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { BoundedPolling } from '../../../core/transport/bounded-polling';
import { BinaryTransfer } from '../../../core/transport/binary-transfer';
import { emptyQuery, queryBody } from '../../../shared/domain/list-query';
import { ListQueryEditor } from '../../../shared/ui/list-query/list-query';
import { RecordTable } from '../../../shared/ui/record-table/record-table';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import {
  formValues,
  issueFieldErrors,
  passwordFields,
  recordReference,
  RecordRow,
} from '../domain/records';
import { ResourceRowActions } from './resource-row-actions';
@Component({
  selector: 'app-resource-page',
  host: { class: 'console-page', '[attr.data-resource]': 'definition.key' },
  imports: [
    RecordFields,
    ResourceActions,
    ControlField,
    CopyField,
    RecordSummary,
    FormsModule,
    RouterLink,
    ButtonDirective,
    DialogModule,
    InputTextModule,
    ListQueryEditor,
    RecordTable,
    LocalizePipe,
  ],
  providers: [BinaryTransfer, BoundedPolling],
  templateUrl: './resource-page.html',
  styleUrl: './resource-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourcePage extends ResourceRowActions {
  private readonly renderInjector = inject(Injector);
  private readonly recordEditor =
    viewChild<ElementRef<HTMLFormElement>>('recordEditor');
  private focusFormError(): void {
    const mode = this.mode();
    const epoch = this.actor.epoch;
    focusInvalidControl(
      () => this.recordEditor()?.nativeElement,
      () => this.mode() === mode && this.actor.epoch === epoch,
      this.renderInjector,
    );
  }

  readonly actionDialogs = viewChildren(ResourceActions);
  override async canLeave(): Promise<boolean> {
    if (!(await super.canLeave())) {
      return false;
    }
    for (const dialog of this.actionDialogs()) {
      if (!(await dialog.canLeave())) {
        return false;
      }
    }
    return true;
  }
  rolesPageTo(page: number): void {
    void this.loadRoles({ ...this.rolesQuery(), page });
  }
  historyPageTo(page: number): void {
    void this.loadHistory({ ...this.historyQuery(), page });
  }
  create(): void {
    if (!this.allowed()) {
      return;
    }
    this.values = formValues(this.definition.createFields, null);
    this.formDirty.set(false);
    this.modalError.set('');
    this.fieldErrors = {};
    this.mode.set('create');
  }
  resetPassword(): void {
    this.password = '';
    this.modalError.set('');
    this.fieldErrors = {};
    this.mode.set('password');
  }
  async closeForm(): Promise<void> {
    if (this.actionBusy()) {
      return;
    }
    if (!(await this.canLeave())) {
      return;
    }
    this.mode.set(null);
    this.values = {};
    this.password = '';
    this.formDirty.set(false);
  }
  private async mutate(
    operation: string,
    body: RecordRow | undefined,
    reference: string | undefined,
    message: string,
  ): Promise<RecordRow | null | undefined> {
    if (!this.allowed() || this.actionBusy()) {
      return undefined;
    }
    const generation = this.generation;
    const epoch = this.actor.epoch;
    const snapshot = body ? structuredClone(body) : undefined;
    if (!(await this.feedback.confirm(message))) {
      return undefined;
    }
    if (
      generation !== this.generation ||
      epoch !== this.actor.epoch ||
      !this.allowed() ||
      this.actionBusy()
    ) {
      return undefined;
    }
    this.actionBusy.set(true);
    this.error.set('');
    this.modalError.set('');
    try {
      const result = await this.api.command(
        operation,
        snapshot,
        reference ? { ref_id: reference } : undefined,
      );
      if (generation !== this.generation || epoch !== this.actor.epoch) {
        return undefined;
      }
      return result;
    } catch (error) {
      if (generation === this.generation) {
        this.error.set(this.message(error));
        this.modalError.set(this.message(error));
        if (error instanceof ApiFailure) {
          this.fieldErrors = {
            ...this.fieldErrors,
            ...issueFieldErrors(error.issues),
          };
          this.focusFormError();
        }
      }
      return undefined;
    } finally {
      if (generation === this.generation) {
        this.actionBusy.set(false);
      }
    }
  }
  async saveForm(): Promise<void> {
    const mode = this.mode();
    if (!mode) {
      return;
    }
    const reference = recordReference(this.detail() ?? {}) || undefined;
    const fields = mode === 'password' ? passwordFields : this.visibleFields();
    const values =
      mode === 'password' ? { new_password: this.password } : this.values;
    let body = this.formSnapshot(fields, values);
    if (!body) {
      this.focusFormError();
      return;
    }
    if (!this.validSchedule(body, mode)) {
      this.focusFormError();
      return;
    }
    if (mode === 'create' && this.user) {
      body = { ...body, is_superuser: this.definition.userPartition! };
    }
    if (mode === 'edit' && this.user) {
      body = { ...body, ref_id: reference! };
    }
    const operation =
      mode === 'password'
        ? 'reset_user_password_api_v1_admin_users__ref_id__reset_password_post'
        : mode === 'create'
          ? this.definition.operations.create
          : this.definition.operations.update;
    if (!operation) {
      return;
    }
    const result = await this.mutate(
      operation,
      body,
      mode === 'create' ? undefined : reference,
      mode === 'password'
        ? 'Reset this user password and revoke existing credentials?'
        : mode === 'create'
          ? 'Create this record?'
          : 'Save changes to this record?',
    );
    if (result === undefined) {
      return;
    }
    await this.finishForm(mode, result);
  }
  async remove(): Promise<void> {
    const row = this.detail();
    const operation = this.definition.operations.delete;
    if (!row || !operation || this.immutable()) {
      return;
    }
    const result = await this.mutate(
      operation,
      undefined,
      recordReference(row),
      'Delete this record?',
    );
    if (result !== undefined) {
      this.detail.set(null);
      this.notice.set('Record deleted.');
      await this.load();
    }
  }
  async restore(): Promise<void> {
    const row = this.detail();
    const operation = this.definition.operations.restore;
    if (!row || !operation) {
      return;
    }
    const result = await this.mutate(
      operation,
      undefined,
      recordReference(row),
      'Restore this user?',
    );
    if (result !== undefined) {
      this.detail.set(result && recordReference(result) ? result : null);
      this.notice.set('User restored.');
      await this.load();
    }
  }
  async report(): Promise<void> {
    const operation = this.definition.operations.report;
    if (!operation || !this.page()) {
      return;
    }
    const snapshot = queryBody(
      this.applied(),
      this.definition.fixed,
      this.definition.extras.map((e) => e.key),
    ) as RecordRow;
    const result = await this.mutate(
      operation,
      snapshot,
      undefined,
      'Request a report of the current list?',
    );
    if (result !== undefined) {
      this.queuedReport.set(result);
      this.notice.set('Report requested. Track it in My Reports.');
    }
  }
  history(): void {
    const operation = this.definition.operations.history;
    if (!operation || !this.detail()) {
      return;
    }
    this.modalError.set('');
    this.historyDetail = null;
    this.historyDefinition.set({
      ...this.entityHistoryDefinition,
      key: 'record-history',
      columns: this.entityHistoryDefinition.columns.filter(
        (column) => column.key !== 'modifier_id',
      ),
      title: 'History',
      permission: this.definition.permission,
      operations: { search: operation },
    });
    this.historyModal.set(true);
    void this.loadHistory(emptyQuery());
  }
  async loadHistory(query = this.historyQuery()): Promise<void> {
    const definition = this.historyDefinition();
    const row = this.detail();
    if (!definition || !row) {
      return;
    }
    const generation = ++this.historyGeneration;
    this.actionBusy.set(true);
    try {
      const page = await this.api.list(definition, query, {
        ref_id: recordReference(row),
      });
      if (generation === this.historyGeneration) {
        this.historyPage.set(page);
        this.historyQuery.set(structuredClone(query));
      }
    } catch (error) {
      if (generation === this.historyGeneration) {
        this.modalError.set(this.message(error));
      }
    } finally {
      if (generation === this.historyGeneration) {
        this.actionBusy.set(false);
      }
    }
  }
  assignRole(): void {
    this.selectedRole.set(null);
    this.modalError.set('');
    this.roleModal.set(true);
    void this.loadRoles(emptyQuery());
  }
  async loadRoles(query = this.rolesQuery()): Promise<void> {
    if (!this.roleAllowed()) {
      return;
    }
    const generation = ++this.roleGeneration;
    this.actionBusy.set(true);
    try {
      const page = await this.api.list(this.rolesDefinition, query);
      if (generation === this.roleGeneration) {
        this.rolesPage.set(page);
        this.rolesQuery.set(structuredClone(query));
      }
    } catch (error) {
      if (generation === this.roleGeneration) {
        this.modalError.set(this.message(error));
      }
    } finally {
      if (generation === this.roleGeneration) {
        this.actionBusy.set(false);
      }
    }
  }
  async saveRole(): Promise<void> {
    const role = this.selectedRole();
    const user = this.detail();
    if (!role || !user || !this.roleAllowed()) {
      return;
    }
    const result = await this.mutate(
      'assign_role_api_v1_admin_users__ref_id__roles_post',
      { role_name: role['name'] },
      recordReference(user),
      'Assign this role to the selected user?',
    );
    if (result !== undefined) {
      this.roleModal.set(false);
      this.selectedRole.set(null);
      this.notice.set('Role assigned.');
      await this.open(user);
      await this.auth.revalidate();
    }
  }
  async download(): Promise<void> {
    const row = this.detail();
    if (!row || row['status'] !== 'READY') {
      return;
    }
    try {
      this.transfer.download(
        await this.transfer.run(
          'download_report_api_v1_reports__ref_id__download_get',
          { path: { ref_id: recordReference(row) } },
        ),
      );
    } catch (error) {
      this.error.set(this.message(error));
    }
  }
}
