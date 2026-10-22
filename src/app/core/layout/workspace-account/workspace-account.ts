import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import type { AppShell } from '../app-shell';
@Component({
  selector: 'app-workspace-account',
  imports: [RouterLink, ButtonDirective, LocalizePipe],
  templateUrl: './workspace-account.html',
  styleUrl: './workspace-account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceAccount {
  readonly view =
    input.required<
      Pick<
        AppShell,
        'auth' | 'notifications' | 'notificationsOpen' | 'toggleNotifications'
      >
    >();
}
