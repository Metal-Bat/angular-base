import { scheduleErrors } from '../domain/schedule-validation';
import { fieldLabel } from '../../../shared/domain/field-label';
import {
  fieldErrors,
  formBody,
  formValues,
  RecordField,
  recordReference,
  RecordRow,
  redactRecord,
} from '../domain/records';
import { ResourceState } from './resource-state';

export abstract class ResourceRowActions extends ResourceState {
  abstract history(): void;
  edit(): void {
    if (
      !this.allowed() ||
      !this.definition.operations.update ||
      !this.detail() ||
      this.deleted() ||
      this.immutable()
    ) {
      return;
    }
    this.values = formValues(this.definition.fields, this.detail());
    this.formDirty.set(false);
    this.modalError.set('');
    this.fieldErrors = {};
    this.mode.set('edit');
  }
  readonly canEditRow = (row: Record<string, unknown>): boolean =>
    !!this.definition.operations.update &&
    this.allowed() &&
    !row['deleted_at'] &&
    (!this.user || row['is_active'] !== false) &&
    !this.definition.immutableStatuses?.includes(String(row['status']));
  readonly rowActions = (): { key: string; label: string; icon: string }[] =>
    this.definition.operations.history && this.allowed()
      ? [{ key: 'history', label: 'History', icon: 'pi pi-history' }]
      : [];
  async editRow(row: Record<string, unknown>): Promise<void> {
    if (this.busy() || this.actionBusy() || !this.canEditRow(row)) {
      return;
    }
    const epoch = this.actor.epoch;
    await this.open(row);
    if (epoch === this.actor.epoch && !this.error() && this.detail()) {
      this.edit();
    }
  }
  async rowAction(event: {
    key: string;
    row: Record<string, unknown>;
  }): Promise<void> {
    if (
      event.key !== 'history' ||
      !this.rowActions().length ||
      this.busy() ||
      this.actionBusy()
    ) {
      return;
    }
    const epoch = this.actor.epoch;
    await this.open(event.row);
    if (epoch === this.actor.epoch && !this.error() && this.detail()) {
      this.history();
    }
  }
  protected async finishForm(
    mode: 'create' | 'edit' | 'password',
    result: RecordRow | null,
  ): Promise<void> {
    this.mode.set(null);
    this.values = {};
    this.password = '';
    this.formDirty.set(false);
    this.notice.set('Changes saved.');
    if (result && recordReference(result)) {
      this.detail.set(result);
    }
    if (mode === 'create') {
      this.detail.set(null);
    }
    await this.load();
    if (mode === 'password') {
      const row = this.detail();
      if (row) {
        await this.open(row);
      }
      await this.auth.revalidate();
    }
  }
  protected formSnapshot(
    fields: readonly RecordField[],
    values: Record<string, string | boolean>,
  ): RecordRow | null {
    this.fieldErrors = fieldErrors(fields, values);
    if (Object.keys(this.fieldErrors).length) {
      this.modalError.set('Complete the required fields with valid values.');
      return null;
    }
    try {
      return formBody(fields, values);
    } catch (error) {
      this.modalError.set(
        error instanceof Error ? error.message : 'Invalid values',
      );
      return null;
    }
  }
  protected validSchedule(body: RecordRow, mode: string): boolean {
    if (mode === 'create' && this.definition.key === 'task-schedules') {
      Object.assign(this.fieldErrors, scheduleErrors(body));
      if (Object.keys(this.fieldErrors).length) {
        this.modalError.set('Complete the required fields with valid values.');
        return false;
      }
    }
    return true;
  }
  display(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      return JSON.stringify(redactRecord(value as RecordRow), null, 2);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }
  label(key: string): string {
    return fieldLabel(key);
  }
}
