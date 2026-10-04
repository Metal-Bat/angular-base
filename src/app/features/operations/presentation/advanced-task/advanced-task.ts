import { ValueTextPipe } from '../../../forms/presentation/value-text-pipe';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { FORM_RESOURCES } from '../../../forms/bindings';
import { CaseFeedback } from '../../../forms/application/form-resources';
import { EditorPort } from '../../application/workspace-ports';
@Component({
  selector: 'app-advanced-task',
  imports: [FormsModule, LocalizePipe, ValueTextPipe],
  templateUrl: './advanced-task.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedTask {
  readonly editor = input.required<EditorPort>();
  readonly resources = inject(FORM_RESOURCES);
  private readonly router = inject(Router);
  readonly feedback = signal<readonly CaseFeedback[]>([]);
  readonly comment = signal('');
  readonly user = signal('');
  readonly group = signal('');
  readonly reason = signal('');
  readonly error = signal('');
  constructor() {
    effect((onCleanup) => {
      const document = this.editor().document();
      let active = true;
      this.feedback.set([]);
      if (document) {
        void this.resources
          .view()
          .then((feedback) => {
            if (active) {
              this.feedback.set(feedback);
            }
          })
          .catch((): void => {
            if (active) {
              this.error.set('The service is unavailable.');
            }
          });
      }
      onCleanup((): void => {
        active = false;
        this.comment.set('');
        this.reason.set('');
        this.user.set('');
        this.group.set('');
      });
    });
  }
  async forward(): Promise<void> {
    const previous = this.editor().item()?.ref;
    await this.resources.forward(
      this.user() ? [this.user()] : [],
      this.group() ? [this.group()] : [],
      this.reason(),
    );
    if (!this.editor().error() && this.editor().item()?.ref !== previous) {
      await this.router.navigate([
        '/operations/tasks',
        this.editor().item()!.ref,
      ]);
    }
  }
  async resolve(key: string): Promise<void> {
    await this.resources.resolveFeedback(key);
  }
}
