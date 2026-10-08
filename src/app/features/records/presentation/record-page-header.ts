import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ResourcePage } from './resource-page';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';

@Component({
  selector: 'app-record-page-header',
  imports: [RouterLink, ButtonDirective, LocalizePipe],
  templateUrl: './record-page-header.html',
  styleUrl: './resource-page.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class RecordPageHeader {
  readonly view =
    input.required<
      Pick<
        ResourcePage,
        | 'actionBusy'
        | 'allowed'
        | 'busy'
        | 'canEditRow'
        | 'create'
        | 'definition'
        | 'detail'
        | 'edit'
        | 'history'
        | 'page'
        | 'report'
        | 'user'
      >
    >();
}
