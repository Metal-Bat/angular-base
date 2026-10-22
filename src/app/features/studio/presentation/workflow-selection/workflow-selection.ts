import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { SelectControl } from '../../../../shared/ui/select-control/select-control';
import { CanvasEdge } from '../../domain/workflow-authoring';
import { workflowStepName } from '../../domain/workflow-labels';
import type { WorkflowBoard } from '../workflow-board/workflow-board';
@Component({
  selector: 'app-workflow-selection',
  imports: [FormsModule, ButtonDirective, LocalizePipe, SelectControl],
  templateUrl: './workflow-selection.html',
  styleUrl: './workflow-selection.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WorkflowSelection {
  readonly canAddNext = computed(() =>
    this.view()
      .nodes()
      .some((node) => node.key === this.view().selected() && node.canContinue),
  );
  canInsert(): boolean {
    return this.view()
      .connections()
      .some(
        (edge) =>
          edge.id === this.view().connectionId && edge.kind === 'control',
      );
  }
  readonly view =
    input.required<
      Pick<
        WorkflowBoard,
        | 'beginInsert'
        | 'beginNext'
        | 'selected'
        | 'nodes'
        | 'pending'
        | 'readonly'
        | 'selectionKeys'
        | 'toggleSelection'
        | 'selectMany'
        | 'duplicate'
        | 'removeSelection'
        | 'align'
        | 'document'
        | 'collapseStep'
        | 'connections'
        | 'connectionId'
        | 'inspectConnection'
        | 'removeConnection'
        | 'routeEdge'
      >
    >();
  readonly nodeKey = (node: { key: string }): string => node.key;
  edgeName(edge: CanvasEdge): string {
    return (
      workflowStepName(edge.source.split(':')[1]) +
      ' → ' +
      workflowStepName(edge.target.split(':')[1]) +
      (edge.label ? ' · ' + edge.label : '')
    );
  }
}
