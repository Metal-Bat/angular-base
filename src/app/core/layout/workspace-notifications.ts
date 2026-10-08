import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { AppShell } from './app-shell';
import { ButtonModule } from 'primeng/button';
import { LocalizePipe } from '../../shared/ui/localize-pipe';

@Component({
  selector: 'app-workspace-notifications',
  imports: [ButtonModule, LocalizePipe],
  templateUrl: './workspace-notifications.html',
  styleUrl: './workspace-notifications.scss',
  host: { style: 'display: contents' },
  // Render with the owning OnPush view so shared state stays in sync.
  changeDetection: ChangeDetectionStrategy.Default,
})
export class WorkspaceNotifications {
  readonly view =
    input.required<
      Pick<AppShell, 'auth' | 'notifications' | 'notificationsOpen'>
    >();
}
