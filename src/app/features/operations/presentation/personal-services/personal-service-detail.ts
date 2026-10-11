import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { PersonalServices } from './personal-services';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CaseHistory } from '../case-history/case-history';

@Component({
  selector: 'app-personal-service-detail',
  imports: [ButtonDirective, LocalizePipe, CaseHistory],
  templateUrl: './personal-service-detail.html',
  styleUrl: './personal-services.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class PersonalServiceDetail {
  readonly view =
    input.required<
      Pick<
        PersonalServices,
        | 'busy'
        | 'detail'
        | 'download'
        | 'destination'
        | 'notifications'
        | 'open'
        | 'readyReport'
        | 'remove'
        | 'transfer'
      >
    >();
}
