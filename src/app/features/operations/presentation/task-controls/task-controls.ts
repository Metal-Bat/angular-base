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
  imports: [ButtonDirective, FormsModule, LocalizePipe],
  templateUrl: './task-controls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskControls {
  readonly editor = input.required<EditorPort>();
  readonly kind = 'task';
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
