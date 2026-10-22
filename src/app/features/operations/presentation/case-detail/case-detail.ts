import { SessionContext } from '../../../../core/auth/session-context';
import { ButtonDirective } from 'primeng/button';
import { CasePageHeader } from '../case-page-header/case-page-header';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinaryTransfer } from '../../../../core/transport/binary-transfer';
import { RuntimeForm } from '../../../forms/presentation/runtime-form/runtime-form';
import { AttachmentRecovery } from '../../../forms/presentation/attachment-recovery/attachment-recovery';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FORM_RESOURCES } from '../../../forms/bindings';
import {
  CaseFeedback,
  FormResources,
} from '../../../forms/application/form-resources';
import { correctionLocations } from '../../domain/correction-feedback';
import { EditorPort } from '../../application/workspace-ports';
import {
  CASE_EDITOR,
  CASE_EDITOR_FACTORY,
  FORM_RESOURCE_FACTORY,
} from '../../bindings';
import { CaseSummary } from '../case-summary/case-summary';
import { TaskControls } from '../task-controls/task-controls';
import { CaseOverrides } from '../case-overrides/case-overrides';
import { AiApproval } from '../ai-approval/ai-approval';
import { AdvancedTask } from '../advanced-task/advanced-task';
@Component({
  host: { class: 'console-page' },
  selector: 'app-case-detail',
  providers: [
    BinaryTransfer,
    BoundedPolling,
    {
      provide: FORM_RESOURCES,
      useFactory: (): FormResources =>
        inject(FORM_RESOURCE_FACTORY)(inject(CASE_EDITOR)),
    },
    {
      provide: CASE_EDITOR,
      useFactory: (): EditorPort => inject(CASE_EDITOR_FACTORY)(),
    },
  ],
  imports: [
    ButtonDirective,
    CaseSummary,
    CasePageHeader,
    TaskControls,
    CaseOverrides,
    AiApproval,
    AdvancedTask,
    FormsModule,
    LocalizePipe,
    RuntimeForm,
    AttachmentRecovery,
  ],
  templateUrl: './case-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseDetail {
  private readonly form = viewChild(RuntimeForm);
  focusCorrection(entry: Pick<CaseFeedback, 'scope' | 'item'>): void {
    const document = this.editor.document();
    const matches = document
      ? correctionLocations(document, new Set([entry.scope])).filter(
          (location) =>
            location.scope === entry.scope && location.item_key === entry.item,
        )
      : [];
    const target = matches.length === 1 ? matches[0] : null;
    this.form()?.focusField(entry.scope, target?.pointer ?? '');
  }
  private readonly session = inject(SessionContext);
  private readonly taskActions = viewChild(AdvancedTask);
  readonly resources = inject(FORM_RESOURCES);
  readonly editor = inject(CASE_EDITOR);
  readonly kind =
    inject(ActivatedRoute).snapshot.data['caseKind'] === 'task'
      ? 'task'
      : 'request';
  readonly saveBusy = computed(
    () =>
      this.editor.busy() ||
      this.editor.blocked() ||
      this.resources.transferBusy(),
  );
  readonly formBusy = computed(
    () => this.saveBusy() || !!this.resources.pendingAttachment(),
  );
  readonly runtimeIncompatible = computed(() => {
    const runtime = this.editor.runtime();
    return !!runtime && runtime.status !== 'ready';
  });
  readonly aiApproval = computed(
    () => this.editor.item()?.kind === 'AI_APPROVAL',
  );
  readonly canSubmit = computed(
    () => this.kind === 'request' && this.editor.item()?.status === 'DRAFT',
  );
  constructor() {
    inject(BoundedPolling).start(
      (abort) => this.resources.poll(abort),
      () =>
        !['COMPLETED', 'CANCELLED', 'EXPIRED', 'REJECTED'].includes(
          this.editor.item()?.status ?? '',
        ) &&
        !this.editor.busy() &&
        !this.editor.dirty() &&
        !this.editor.decisionDirty() &&
        !this.editor.blocked() &&
        !this.resources.pendingAttachment() &&
        !this.taskActions()?.dialog(),
    );
    const route = inject(ActivatedRoute);
    combineLatest([route.paramMap, route.queryParamMap])
      .pipe(takeUntilDestroyed())
      .subscribe(([params, query]) => {
        void this.editor.open(
          this.kind,
          params.get('ref') ?? '',
          query.get('view') ?? '',
        );
      });
    const warn = (event: BeforeUnloadEvent): void => {
      if (
        this.taskActions()?.dirty() ||
        this.editor.dirty() ||
        this.editor.decisionDirty() ||
        this.editor.busy() ||
        this.editor.blocked() ||
        this.resources.transferBusy() ||
        this.resources.pendingAttachment()
      ) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    inject(DestroyRef).onDestroy(() =>
      window.removeEventListener('beforeunload', warn),
    );
  }
  async canLeave(): Promise<boolean> {
    if (this.session.snapshot().status === 'signed-out') {
      return true;
    }
    if (this.editor.busy() || this.resources.transferBusy()) {
      return false;
    }
    if (!((await this.taskActions()?.canLeave()) ?? true)) {
      return false;
    }
    return this.editor.dirty() ||
      this.editor.decisionDirty() ||
      this.editor.blocked() ||
      this.resources.pendingAttachment()
      ? this.editor.feedback.confirm('Discard unsaved changes?')
      : true;
  }
}
