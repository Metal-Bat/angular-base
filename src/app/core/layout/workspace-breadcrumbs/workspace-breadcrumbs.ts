import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { WorkspaceNavigationService } from '../workspace-navigation.service';
@Component({
  selector: 'app-workspace-breadcrumbs',
  imports: [RouterLink, ButtonDirective, LocalizePipe],
  templateUrl: './workspace-breadcrumbs.html',
  styleUrl: './workspace-breadcrumbs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceBreadcrumbs {
  readonly navigation = inject(WorkspaceNavigationService);
}
