import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { WorkflowDiagram } from './workflow-diagram';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-workflow-step-inspector',
  imports: [LocalizePipe],
  templateUrl: './workflow-step-inspector.html',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WorkflowStepInspector {
  readonly view =
    input.required<Pick<WorkflowDiagram, 'selectedStep' | 'transitions'>>();
}
