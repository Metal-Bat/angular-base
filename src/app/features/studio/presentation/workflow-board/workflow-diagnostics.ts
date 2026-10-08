import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { WorkflowBoard } from './workflow-board';
import { ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-workflow-diagnostics',
  imports: [ButtonDirective],
  templateUrl: './workflow-diagnostics.html',
  styleUrl: './workflow-board.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WorkflowDiagnostics {
  readonly view =
    input.required<Pick<WorkflowBoard, 'diagnostics' | 'issues' | 'select'>>();
}
