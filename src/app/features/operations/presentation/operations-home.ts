import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  AreaOverview,
  PlannedCapability,
} from '../../../shared/ui/area-overview';

import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
@Component({
  imports: [RouterLink, LocalizePipe, AreaOverview],
  selector: 'app-operations-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './operations-home.scss',
  templateUrl: './operations-home.html',
})
export class OperationsHome {
  protected readonly capabilities: readonly PlannedCapability[] = [
    {
      name: 'Requests',
      description: 'Create drafts and track submitted requests.',
    },
    {
      name: 'Task inbox',
      description: 'Claim, review, and complete assigned work.',
    },
    {
      name: 'Process tracking',
      description: 'Follow authorized timelines and outcomes.',
    },
  ];
}
