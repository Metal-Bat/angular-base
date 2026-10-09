import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { WorkflowCanvas } from './workflow-canvas';
import { FormsModule } from '@angular/forms';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-canvas-toolbar',
  imports: [LocalizePipe, SelectControl, FormsModule],
  templateUrl: './canvas-toolbar.html',
  styleUrl: './canvas-toolbar.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CanvasToolbar {
  readonly view =
    input.required<
      Pick<
        WorkflowCanvas,
        | 'disabled'
        | 'edges'
        | 'fit'
        | 'nodes'
        | 'reset'
        | 'viewport'
        | 'zoom'
        | 'zoomPercent'
        | 'find'
        | 'rendered'
      >
    >();
}
