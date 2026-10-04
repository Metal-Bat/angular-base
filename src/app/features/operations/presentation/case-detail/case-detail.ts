import { RequestActions } from '../request-actions/request-actions';
import { BoundedPolling } from '../../../../core/transport/bounded-polling';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BinaryTransfer } from '../../../../core/transport/binary-transfer';
import { RuntimeForm } from '../../../forms/presentation/runtime-form/runtime-form';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { FormResources } from '../../../forms/application/form-resources';
import { EditorPort } from '../../application/workspace-ports';
import {
  CASE_EDITOR,
  CASE_EDITOR_FACTORY,
  FORM_RESOURCE_FACTORY,
} from '../../bindings';
import { CaseSummary } from '../case-summary/case-summary';
import { TaskControls } from '../task-controls/task-controls';
import { CaseOverrides } from '../case-overrides/case-overrides';
import { CaseHistory } from '../case-history/case-history';
import { AiApproval } from '../ai-approval/ai-approval';
import { AdvancedTask } from '../advanced-task/advanced-task';
@Component({
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
    CaseSummary,
    RequestActions,
    TaskControls,
    CaseOverrides,
    CaseHistory,
    AiApproval,
    AdvancedTask,
    FormsModule,
    RouterLink,
    LocalizePipe,
    RuntimeForm,
  ],
  templateUrl: './case-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseDetail {
  readonly resources = inject(FORM_RESOURCES);
  readonly editor = inject(CASE_EDITOR);
  readonly kind =
    inject(ActivatedRoute).snapshot.data['caseKind'] === 'task'
      ? 'task'
      : 'request';
  readonly formBusy = computed(
    () =>
      this.editor.busy() ||
      this.editor.blocked() ||
      this.resources.transferBusy(),
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
        !this.editor.blocked(),
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
        this.editor.dirty() ||
        this.editor.busy() ||
        this.editor.blocked() ||
        this.resources.transferBusy()
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
  canLeave(): boolean | Promise<boolean> {
    if (this.editor.busy() || this.resources.transferBusy()) {
      return false;
    }
    return this.editor.dirty() || this.editor.blocked()
      ? this.editor.feedback.confirm('Discard unsaved changes?')
      : true;
  }
}
