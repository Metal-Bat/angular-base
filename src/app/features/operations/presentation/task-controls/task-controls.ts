import { Textarea } from 'primeng/textarea';
import { CorrectionFeedbackEditor } from '../correction-feedback-editor/correction-feedback-editor';
import { validCorrectionFeedback } from '../../domain/correction-feedback';
import { ButtonDirective } from 'primeng/button';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorPort } from '../../application/workspace-ports';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  host: { class: 'console-fragment' },
  selector: 'app-task-controls',
  imports: [
    ButtonDirective,
    FormsModule,
    LocalizePipe,
    CorrectionFeedbackEditor,
    Textarea,
  ],
  templateUrl: './task-controls.html',
  styleUrl: './task-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskControls {
  readonly editor = input.required<EditorPort>();
  readonly disabled = input(false);
  readonly kind = 'task';
  readonly hasReturn = computed(() =>
    this.editor()
      .document()
      ?.actions.some((action) => action.kind === 'return'),
  );
  readonly validCorrections = computed(() => {
    const document = this.editor().document();
    return (
      !!document &&
      validCorrectionFeedback(document, this.editor().corrections())
    );
  });
  readonly guidance = computed(() => {
    const editor = this.editor();
    if (editor.blocked()) {
      return 'Read current state before attempting another task action.';
    }
    if (!['CLAIMED', 'IN_PROGRESS'].includes(editor.item()?.status ?? '')) {
      return '';
    }
    return editor.ownTask()
      ? 'You own this task.'
      : 'This task is claimed by another reviewer. Read-only access does not grant permission to decide.';
  });
}
