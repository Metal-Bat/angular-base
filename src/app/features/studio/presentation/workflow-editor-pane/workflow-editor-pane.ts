import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { NodeInspector } from '../node-inspector/node-inspector';
import { GraphConnections } from '../graph-connections/graph-connections';
import type { WorkflowBoard } from '../workflow-board/workflow-board';
@Component({
  selector: 'app-workflow-editor-pane',
  imports: [
    FormsModule,
    ButtonDirective,
    LocalizePipe,
    NodeInspector,
    GraphConnections,
  ],
  templateUrl: './workflow-editor-pane.html',
  host: { style: 'display: contents' },
  styles: `
    section {
      min-inline-size: 0;
      padding: 1.5rem;
      border: 1px solid var(--console-border);
      border-radius: 1rem;
      background: var(--console-surface);
      overflow-wrap: anywhere;
    }
    textarea {
      max-inline-size: 100%;
      box-sizing: border-box;
    }
    h2 {
      overflow-wrap: anywhere;
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WorkflowEditorPane {
  readonly view =
    input.required<
      Pick<
        WorkflowBoard,
        | 'selected'
        | 'selectedStep'
        | 'catalogEntries'
        | 'childCatalog'
        | 'readonly'
        | 'typedReadonly'
        | 'expertReadonly'
        | 'pending'
        | 'document'
        | 'nodes'
        | 'reference'
        | 'markPending'
        | 'applyTyped'
        | 'applyConnections'
        | 'applyNode'
        | 'remove'
        | 'selectedJson'
      >
    >();
}
