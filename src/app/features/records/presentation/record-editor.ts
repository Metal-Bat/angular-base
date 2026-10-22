import { recordDetailSections } from './record-detail-sections';
import { updateFieldValues } from '../domain/record-draft';
import { AgentFields } from './agent-fields/agent-fields';
import { RecordRecovery } from './record-recovery';
import { focusRecordActions } from './record-action-focus';
import { RecordSummary } from '../../../shared/ui/record-summary/record-summary';
import { userRecordSections } from './record-sections';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ActorState } from '../../../core/auth/actor-state';
import { ControlField } from '../../../shared/ui/control-field/control-field';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { focusInvalidControl } from '../../../shared/ui/focus-invalid-control';
import { RecordFields } from './record-fields/record-fields';
import type { ResourcePage } from './resource-page';
@Component({
  selector: 'app-record-editor',
  imports: [
    AgentFields,
    RecordRecovery,
    FormsModule,
    ButtonDirective,
    DialogModule,
    InputTextModule,
    ControlField,
    LocalizePipe,
    RecordFields,
    RecordSummary,
  ],
  templateUrl: './record-editor.html',
  styleUrl: './resource-page.scss',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordEditor {
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'definition'
        | 'detail'
        | 'mode'
        | 'formDirty'
        | 'modalError'
        | 'fieldErrors'
        | 'Object'
        | 'actionBusy'
        | 'busy'
        | 'reconcileRequired'
        | 'recoveryRecord'
        | 'inspectCurrent'
        | 'canReapply'
        | 'useCurrentRevision'
        | 'saveForm'
        | 'closeForm'
        | 'visibleFields'
        | 'values'
        | 'user'
        | 'password'
        | 'formWidth'
      >
    >();
  readonly readonlySections = userRecordSections.slice(1);
  groups(): {
    title: string;
    fields: readonly import('../domain/records').RecordField[];
  }[] {
    const vm = this.view();
    const fields = vm.visibleFields();
    const sections = recordDetailSections(vm.definition.key, vm.user)
      .map((section) => ({
        title: section.title,
        fields: fields.filter((field) =>
          section.keys.some((key) => key === field.key),
        ),
      }))
      .filter((section) => section.fields.length);
    const additional = fields.filter(
      (field) => !sections.some((section) => section.fields.includes(field)),
    );
    return additional.length
      ? [...sections, { title: 'Additional settings', fields: additional }]
      : sections;
  }
  private readonly agentFields = viewChild(AgentFields);
  changeGroup(
    fields: readonly import('../domain/records').RecordField[],
    values: Record<string, string | boolean>,
  ): void {
    const vm = this.view();
    vm.values = updateFieldValues(vm.values, fields, values);
    vm.formDirty.set(true);
  }
  scheduleHint(): string {
    const vm = this.view();
    if (vm.definition.key !== 'task-schedules') {
      return '';
    }
    return vm.mode() === 'create'
      ? 'Choose interval, cron, or a one-time scheduled run.'
      : vm.detail()?.['schedule_type'] === 'interval'
        ? 'Leave interval blank to keep it unchanged; it cannot be cleared.'
        : '';
  }
  canSubmit(): boolean {
    return this.agentFields()?.valid() !== false;
  }
  submit(): void {
    if (this.canSubmit()) {
      void this.view().saveForm();
    }
  }
  fieldAnchor(path: string): string {
    const field = [
      ...(this.editor()?.nativeElement.querySelectorAll<HTMLElement>(
        '[data-field-path]',
      ) ?? []),
    ].find((element) => element.dataset['fieldPath'] === path);
    return (
      field?.id ||
      field?.querySelector<HTMLElement>(
        'input[id], textarea[id], [role="combobox"][id], fieldset[id]',
      )?.id ||
      'record-' + path.replaceAll('.', '-')
    );
  }
  revealField(event: MouseEvent, path: string): void {
    if (!this.agentFields()) {
      return;
    }
    event.preventDefault();
    this.agentFields()?.reveal(path);
    afterNextRender(
      () => document.getElementById(this.fieldAnchor(path))?.focus(),
      { injector: this.injector },
    );
  }
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  restoreActions(): void {
    focusRecordActions(this.host.nativeElement);
  }
  private readonly injector = inject(Injector);
  private readonly actor = inject(ActorState);
  private readonly editor =
    viewChild<ElementRef<HTMLFormElement>>('recordEditor');
  private readonly passwordEditor =
    viewChild<ElementRef<HTMLFormElement>>('passwordEditor');
  constructor() {
    let returnFocus: HTMLElement | null = null;
    effect(() => {
      const vm = this.view();
      const mode = vm.mode();
      const epoch = this.actor.epoch;
      if (mode === 'create' || mode === 'edit') {
        returnFocus = document.activeElement as HTMLElement | null;
        afterNextRender(
          () => {
            if (vm.mode() === mode && this.actor.epoch === epoch) {
              this.editor()
                ?.nativeElement.querySelector<HTMLElement>(
                  'input, textarea, [role="combobox"]',
                )
                ?.focus();
            }
          },
          { injector: this.injector },
        );
      } else if (!mode && returnFocus) {
        const target = returnFocus;
        returnFocus = null;
        afterNextRender(
          () => {
            if (
              this.actor.epoch === epoch &&
              target.isConnected &&
              !target.closest('[hidden]')
            ) {
              target.focus();
            }
          },
          { injector: this.injector },
        );
      }
    });
  }
  focusError(): void {
    const vm = this.view();
    this.agentFields()?.reveal(Object.keys(vm.fieldErrors)[0] ?? '');
    const mode = vm.mode();
    const epoch = this.actor.epoch;
    focusInvalidControl(
      () =>
        (mode === 'password' ? this.passwordEditor() : this.editor())
          ?.nativeElement,
      () => vm.mode() === mode && this.actor.epoch === epoch,
      this.injector,
    );
  }
}
