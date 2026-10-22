import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../localize-pipe';
import type { RecordSummary } from '../record-summary';
@Component({
  selector: 'app-record-identity',
  imports: [LocalizePipe],
  templateUrl: './record-identity.html',
  styleUrl: './record-identity.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordIdentity {
  readonly summary =
    input.required<
      Pick<
        RecordSummary,
        | 'isHistory'
        | 'record'
        | 'caption'
        | 'icon'
        | 'displayTitle'
        | 'subtitle'
        | 'status'
        | 'value'
      >
    >();
}
