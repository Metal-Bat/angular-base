import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { CaseKind, CaseRecord } from '../../domain/workspace-models';
@Component({
  selector: 'app-case-summary',
  imports: [RouterLink, LocalizePipe],
  templateUrl: './case-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseSummary {
  readonly item = input.required<CaseRecord>();
  readonly kind = input.required<CaseKind>();
}
