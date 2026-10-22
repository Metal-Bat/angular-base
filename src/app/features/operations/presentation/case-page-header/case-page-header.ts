import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CaseHistory } from '../case-history/case-history';
import { RequestActions } from '../request-actions/request-actions';
import type { CaseDetail } from '../case-detail/case-detail';
@Component({
  selector: 'app-case-page-header',
  imports: [
    RouterLink,
    ButtonDirective,
    LocalizePipe,
    CaseHistory,
    RequestActions,
  ],
  host: { style: 'display: contents' },
  templateUrl: './case-page-header.html',
  styleUrl: './case-page-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasePageHeader {
  readonly view =
    input.required<
      Pick<
        CaseDetail,
        'editor' | 'kind' | 'saveBusy' | 'formBusy' | 'canSubmit'
      >
    >();
}
