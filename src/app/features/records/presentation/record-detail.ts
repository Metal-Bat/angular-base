import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ResourcePage } from './resource-page';
import { CopyField } from '../../../shared/ui/copy-field/copy-field';
import { RecordSummary } from '../../../shared/ui/record-summary/record-summary';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-record-detail',
  imports: [CopyField, RecordSummary, ButtonDirective, LocalizePipe],
  templateUrl: './record-detail.html',
  styleUrl: './resource-page.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordDetail {
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'actionBusy'
        | 'allowed'
        | 'assignRole'
        | 'busy'
        | 'definition'
        | 'deleted'
        | 'detail'
        | 'download'
        | 'immutable'
        | 'open'
        | 'remove'
        | 'resetPassword'
        | 'restore'
        | 'roleAllowed'
        | 'transfer'
        | 'user'
      >
    >();
}
