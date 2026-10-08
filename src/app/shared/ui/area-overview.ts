import { LocalizePipe } from './localize-pipe';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type PlannedCapability = {
  readonly name: string;
  readonly description: string;
};

@Component({
  imports: [LocalizePipe],
  selector: 'app-area-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './area-overview.scss',
  templateUrl: './area-overview.html',
})
export class AreaOverview {
  readonly heading = input.required<string>();
  readonly description = input.required<string>();
  readonly capabilities = input.required<readonly PlannedCapability[]>();
}
