import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { JsonObject } from '../../../../shared/domain/json-value';
import { ControlField } from '../../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { catalogGrantBody, GrantRow } from '../../domain/catalog-access';
import { StudioChoice } from '../studio-choice/studio-choice';
import { CatalogAccessState } from './catalog-access-state';
import { CatalogGrantList } from './catalog-grant-list';
@Component({
  selector: 'app-catalog-actions',
  imports: [
    FormsModule,
    ButtonDirective,
    CheckboxModule,
    DialogModule,
    CatalogGrantList,
    ControlField,
    LocalizePipe,
    SelectControl,
    StudioChoice,
  ],
  templateUrl: './catalog-actions.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogActions extends CatalogAccessState {
  private readonly choice = viewChild<StudioChoice>('recipientChoice');
  async add(): Promise<void> {
    const vm = this.view();
    if (this.mutationsBlocked()) {
      return;
    }
    let body: JsonObject;
    try {
      body = catalogGrantBody(vm.key === 'workflows', {
        kind: this.kind,
        target: this.target,
        view: this.viewPermission,
        start: this.startPermission,
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Invalid values');
      return;
    }
    const recipient =
      this.choice()?.selected()?.label ??
      this.locale.text(this.kind === 'users' ? 'User' : 'Work group');
    await this.change(body, recipient);
  }
  async revoke(row: GrantRow): Promise<void> {
    if (!row.named || !this.rows().includes(row)) {
      return;
    }
    await this.change(undefined, row.recipient, row);
  }
  private async change(
    body: JsonObject | undefined,
    recipient: string,
    row?: GrantRow,
  ): Promise<void> {
    const vm = this.view();
    const reference = vm.reference();
    const epoch = this.actor.epoch;
    if (this.mutationsBlocked() || !reference) {
      return;
    }
    if (
      !(await this.feedback.confirm(
        row ? 'Revoke this exact grant?' : 'Add this access grant?',
      )) ||
      !this.current(reference, epoch) ||
      this.mutationsBlocked()
    ) {
      return;
    }
    this.pendingChange = row ? { ref: row.ref } : { body };
    let accepted: JsonObject | null = null;
    await vm.command(async () => {
      accepted = await this.api.action(
        vm.key,
        reference,
        row ? 'revoke' : 'grant',
        body,
        row?.ref,
      );
      // A grant DTO is not the owning definition. Only its authorized read may replace the record.
      return this.api.get(vm.key, reference);
    });
    if (!this.current(reference, epoch)) {
      return;
    }
    if (!accepted) {
      this.uncertain.set(vm.reconcileRequired());
      return;
    }
    this.pendingChange = null;
    this.uncertain.set(false);
    this.clearDraft();
    if (!vm.reconcileRequired() && vm.spec.actions.includes('grants')) {
      await this.load(this.page());
    } else if (row && !vm.reconcileRequired()) {
      this.rows.update((rows) => rows.filter((item) => item !== row));
    } else if (!row) {
      const grant = accepted as JsonObject;
      if (typeof grant['ref_id'] === 'string') {
        this.rows.update((rows) => [
          ...rows,
          {
            ref: String(grant['ref_id']),
            recipient,
            named: true,
            view: body?.['can_view'] === true,
            start: body?.['can_start'] === true,
            use: vm.key !== 'workflows',
          },
        ]);
      }
    }
  }
}
