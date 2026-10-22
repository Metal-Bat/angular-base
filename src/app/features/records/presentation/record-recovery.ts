import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';
import { ActorState } from '../../../core/auth/actor-state';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { RecordSummary } from '../../../shared/ui/record-summary/record-summary';
import { formBody, RecordRow } from '../domain/records';
import type { ResourcePage } from './resource-page';

@Component({
  selector: 'app-record-recovery',
  imports: [ButtonDirective, LocalizePipe, RecordSummary],
  templateUrl: './record-recovery.html',
  styleUrl: './record-recovery.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordRecovery {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly actor = inject(ActorState);
  async useRevision(): Promise<void> {
    const vm = this.view();
    if (!vm.canReapply()) {
      return;
    }
    const epoch = this.actor.epoch;
    await vm.useCurrentRevision();
    afterNextRender(
      () => {
        if (
          epoch === this.actor.epoch &&
          vm.mode() === 'edit' &&
          !vm.reconcileRequired()
        ) {
          this.host.nativeElement
            .closest('app-record-editor')
            ?.querySelector<HTMLButtonElement>('#record-editor-save')
            ?.focus();
        }
      },
      { injector: this.injector },
    );
  }
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'busy'
        | 'actionBusy'
        | 'mode'
        | 'reconcileRequired'
        | 'recoveryRecord'
        | 'inspectCurrent'
        | 'canReapply'
        | 'useCurrentRevision'
        | 'values'
        | 'visibleFields'
      >
    >();
  comparison(): RecordRow | null {
    const vm = this.view();
    const current = vm.recoveryRecord();
    if (!current) {
      return null;
    }
    try {
      return {
        from_values: Object.fromEntries(
          vm
            .visibleFields()
            .filter((field) => Object.hasOwn(current, field.key))
            .map((field) => [field.key, current[field.key]]),
        ),
        to_values: formBody(vm.visibleFields(), vm.values),
      };
    } catch {
      return null;
    }
  }
}
