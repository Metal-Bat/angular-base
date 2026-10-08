import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResourceCatalog } from './resource-catalog';
import { NgTemplateOutlet } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { RecordSummary } from '../../../../shared/ui/record-summary/record-summary';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ListQueryEditor } from '../../../../shared/ui/list-query/list-query';
import { RecordTable } from '../../../../shared/ui/record-table/record-table';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { WorkflowDiagram } from '../workflow-diagram/workflow-diagram';

@Component({
  selector: 'app-catalog-content',
  imports: [
    NgTemplateOutlet,
    TabsModule,
    RecordSummary,
    FormsModule,
    ButtonDirective,
    InputTextModule,
    ListQueryEditor,
    RecordTable,
    LocalizePipe,
    WorkflowDiagram,
  ],
  templateUrl: './catalog-content.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogContent {
  readonly view =
    input.required<
      Pick<
        ResourceCatalog,
        | 'appliedQuery'
        | 'applyList'
        | 'applyScope'
        | 'back'
        | 'busy'
        | 'canEditRow'
        | 'canScope'
        | 'change'
        | 'chooseParents'
        | 'columns'
        | 'display'
        | 'editRow'
        | 'immutable'
        | 'items'
        | 'key'
        | 'label'
        | 'listQuery'
        | 'load'
        | 'open'
        | 'page'
        | 'parentLabel'
        | 'parentSpec'
        | 'ref'
        | 'reference'
        | 'rowAction'
        | 'rowActions'
        | 'selected'
        | 'spec'
        | 'totalPages'
      >
    >();
}
