import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorPort } from '../../application/workspace-ports';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
@Component({
  selector: 'app-task-controls',
  imports: [FormsModule, LocalizePipe],
  templateUrl: './task-controls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskControls {
  readonly editor = input.required<EditorPort>();
  readonly kind = 'task';
}
