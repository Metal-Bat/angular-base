import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResourcePage } from './resource-page';
import { ButtonDirective } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ListQueryEditor } from '../../../shared/ui/list-query/list-query';
import { RecordTable } from '../../../shared/ui/record-table/record-table';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-record-role-dialog',
  imports: [
    ButtonDirective,
    DialogModule,
    ListQueryEditor,
    RecordTable,
    LocalizePipe,
  ],
  templateUrl: './record-role-dialog.html',
  styleUrl: './resource-page.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordRoleDialog {
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'actionBusy'
        | 'closeRole'
        | 'loadRoles'
        | 'modalError'
        | 'roleModal'
        | 'rolesDefinition'
        | 'rolesPage'
        | 'rolesPageTo'
        | 'rolesQuery'
        | 'saveRole'
        | 'selectedRole'
      >
    >();
}
