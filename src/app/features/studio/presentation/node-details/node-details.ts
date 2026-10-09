import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LocalizePipe } from '../../../../shared/ui/localize-pipe';
import { Inspector } from '../../domain/node-inspector';
@Component({
  selector: 'app-node-details',
  imports: [LocalizePipe],
  templateUrl: './node-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeDetails {
  readonly handler = input.required<Inspector>();
}
