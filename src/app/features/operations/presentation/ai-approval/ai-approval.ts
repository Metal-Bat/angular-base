import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { Approval } from '../../../forms/application/form-resources';
import { EditorPort } from '../../application/workspace-ports';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-ai-approval',
  imports: [ButtonDirective, LocalizePipe],
  templateUrl: './ai-approval.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiApproval {
  readonly editor = input.required<EditorPort>();
  private readonly resources = inject(FORM_RESOURCES);
  readonly approval = signal<Approval | null>(null);
  readonly argumentsText = signal('');
  readonly error = signal('');
  constructor() {
    effect((onCleanup) => {
      const item = this.editor().item();
      let active = true;
      this.approval.set(null);
      this.argumentsText.set('');
      this.error.set('');
      if (item?.kind === 'AI_APPROVAL' && this.editor().ownTask()) {
        void this.resources
          .approval()
          .then((approval) => {
            if (active) {
              this.approval.set(approval);
              this.argumentsText.set(
                approval.arguments === null
                  ? ''
                  : JSON.stringify(approval.arguments, null, 2),
              );
            }
          })
          .catch((): void => {
            if (active) {
              this.error.set(
                'This approval is unavailable, expired or already decided',
              );
            }
          });
      }
      onCleanup((): void => {
        active = false;
        this.approval.set(null);
        this.argumentsText.set('');
      });
    });
  }
  async decide(approved: boolean): Promise<void> {
    const current = this.approval();
    if (
      current?.status !== 'PENDING' ||
      !current.arguments ||
      Date.parse(current.expires) <= Date.now()
    ) {
      return;
    }
    await this.resources.decideApproval(approved);
    this.approval.set(null);
    this.argumentsText.set('');
    if (this.editor().error()) {
      this.error.set(this.editor().error());
    }
  }
}
