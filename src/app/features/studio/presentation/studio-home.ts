import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  AreaOverview,
  PlannedCapability,
} from '../../../shared/ui/area-overview';

@Component({
  imports: [RouterLink, AreaOverview, LocalizePipe],
  selector: 'app-studio-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './studio-home.scss',
  templateUrl: './studio-home.html',
})
export class StudioHome {
  protected readonly capabilities: readonly PlannedCapability[] = [
    { name: 'Form design', description: 'Author and preview versioned forms.' },
    {
      name: 'Workflow design',
      description: 'Build and validate workflow graphs.',
    },
    {
      name: 'Publication',
      description: 'Publish immutable versions for execution.',
    },
  ];
}
