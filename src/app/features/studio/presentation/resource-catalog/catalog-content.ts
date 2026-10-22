import { JsonObject } from '../../../forms/domain/runtime-document';
import { CatalogRelations } from '../catalog-relations';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
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
import { FormDisplay } from '../form-display/form-display';

@Component({
  selector: 'app-catalog-content',
  imports: [
    CatalogRelations,
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
    FormDisplay,
  ],
  templateUrl: './catalog-content.html',
  styleUrl: './resource-catalog.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class CatalogContent {
  businessRecord(key: string, row: JsonObject): JsonObject {
    if (key !== 'request-types') {
      return row;
    }
    return Object.fromEntries(
      Object.entries(row).filter(([field]) => field !== 'client_targets'),
    );
  }
  businessSections(
    key: string,
  ): readonly { title: string; keys: readonly string[] }[] {
    const sections: Readonly<
      Record<string, readonly { title: string; keys: readonly string[] }[]>
    > = {
      clients: [
        { title: 'Identity', keys: ['name', 'code', 'kind', 'platform'] },
        { title: 'Access', keys: ['confidential', 'is_active'] },
      ],
      'client-releases': [
        {
          title: 'Release',
          keys: [
            'version',
            'api_version',
            'renderer_capabilities',
            'is_enabled',
          ],
        },
      ],
      'request-types': [
        { title: 'Identity', keys: ['name', 'code', 'is_active'] },
        {
          title: 'Request settings',
          keys: [
            'default_priority',
            'extension_contract',
            'allow_cross_client_resume',
          ],
        },
      ],
    };
    return sections[key] ?? [];
  }
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly repairNode = computed(
    () => this.query().get('repair_node')?.slice(0, 256) ?? '',
  );

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
