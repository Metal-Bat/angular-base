import { SelectModule } from 'primeng/select';
import { NgTemplateOutlet } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Locale } from '../../../../core/localization/locale';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ListQueryEditor } from '../../../../shared/ui/list-query/list-query';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { ApiFailure } from '../../../../core/transport/api-failure';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { JsonObject, JsonValue } from '../../../forms/domain/runtime-document';
import { parseDocument } from '../../domain/authoring';
import { resourceLabel } from './resource-values';
import { WorkflowDiagram } from '../workflow-diagram/workflow-diagram';
import { CatalogParents } from './catalog-parents';
@Component({
  host: { class: 'console-page' },
  selector: 'app-resource-catalog',
  imports: [
    ControlField,
    SelectModule,
    NgTemplateOutlet,
    TabsModule,
    RecordSummary,
    WorkflowDiagram,
    DialogModule,
    InputTextModule,
    ListQueryEditor,
    RecordTable,
    ButtonDirective,
    FormsModule,
    RouterLink,
    LocalizePipe,
  ],
  templateUrl: './resource-catalog.html',
  styleUrl: './resource-catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceCatalog extends CatalogParents {
  private readonly locale = inject(Locale);
  readonly enumChoices = computed(() =>
    Object.fromEntries(
      this.fields().map((field) => [
        field.key,
        field.options.map((value) => ({
          value,
          label: this.locale.text(
            field.key === 'access_mode'
              ? ((
                  {
                    OPEN: 'Open access',
                    RESTRICTED: 'Restricted access',
                  } as Record<string, string>
                )[value] ?? value)
              : value,
          ),
        })),
      ]),
    ),
  );

  readonly canEditRow = (row: Record<string, unknown>): boolean =>
    this.spec.actions.includes('update') &&
    !['PUBLISHED', 'RETIRED'].includes(String(row['status']));
  readonly rowActions = (): { key: string; label: string; icon: string }[] =>
    this.spec.actions.includes('history')
      ? [{ key: 'history', label: 'History', icon: 'pi pi-history' }]
      : [];
  async editRow(row: Record<string, unknown>): Promise<void> {
    if (this.busy() || !this.canEditRow(row)) {
      return;
    }
    const epoch = this.actor.epoch;
    await this.open(this.ref(row as JsonObject));
    if (
      epoch === this.actor.epoch &&
      !this.error() &&
      this.selected() &&
      !this.immutable()
    ) {
      this.edit();
    }
  }
  async rowAction(event: {
    key: string;
    row: Record<string, unknown>;
  }): Promise<void> {
    if (event.key !== 'history' || !this.rowActions().length || this.busy()) {
      return;
    }
    const epoch = this.actor.epoch;
    await this.open(this.ref(event.row as JsonObject));
    if (epoch === this.actor.epoch && !this.error() && this.selected()) {
      await this.history();
    }
  }
  async save(): Promise<void> {
    const reference = this.reference();
    const values = structuredClone(this.values());
    const epoch = this.actor.epoch;
    if (!this.canSave() || this.error()) {
      return;
    }
    if (
      this.key === 'request-types' &&
      Array.isArray(this.selected()?.['client_targets']) &&
      (this.selected()!['client_targets'] as JsonValue[]).length &&
      Array.isArray(values['client_targets']) &&
      !(values['client_targets'] as JsonValue[]).length &&
      !(await this.feedback.confirm(
        'Remove all confidential-client restrictions from this request type?',
      ))
    ) {
      return;
    }
    if (epoch !== this.actor.epoch) {
      return;
    }
    await this.command(() =>
      this.api.write(this.key, reference || null, values),
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
          this.notice.set('Saved');
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
    const reference = this.reference();
    const epoch = this.actor.epoch;
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
    if (epoch !== this.actor.epoch) {
      return;
    }
    await this.command(() => this.api.action(this.key, reference, action));
    if (action === 'remove' && !this.error()) {
      this.reset();
      await this.load(this.page());
    }
  }
  async history(page = 1, size = this.auditQuery().size): Promise<void> {
    if (page === 1) {
      this.historyDetail.set(null);
    }
    this.historyOpen.set(true);
    if (!this.reference() || this.busy()) {
      return;
    }
    const generation = ++this.generation;
    this.busy.set(true);
    try {
      const result = await this.api.history(
        this.key,
        this.reference(),
        page,
        size,
      );
      if (generation === this.generation) {
        this.audit.set(result.items);
        this.auditQuery.update((query) => ({
          ...query,
          page: result.page,
          size,
        }));
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
    if (this.dirty() || this.busy()) {
      return;
    }
    const reference = this.reference();
    const target = this.grantTarget;
    const epoch = this.actor.epoch;
    let body: JsonObject | undefined;
    try {
      body = remove ? undefined : parseDocument(this.grantBody);
    } catch {
      this.error.set('Invalid grant document');
      return;
    }
    if (
      !(await this.feedback.confirm(
        remove ? 'Revoke this exact grant?' : 'Add this access grant?',
      )) ||
      epoch !== this.actor.epoch
    ) {
      return;
    }
    await this.command(() =>
      this.api.action(
        this.key,
        reference,
        remove ? 'revoke' : 'grant',
        body,
        remove ? target : undefined,
      ),
    );
  }
  label(row: JsonObject): string {
    return resourceLabel(row);
  }
  ref(row: JsonObject): string {
    return String(row['ref_id']);
  }
}
