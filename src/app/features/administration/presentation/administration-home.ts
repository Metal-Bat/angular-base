import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionContext } from '../../../core/auth/session-context';
import { hasPermissions } from '../../../core/permissions/area-access';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import { ADMIN_API } from '../bindings';
@Component({
  imports: [RouterLink, LocalizePipe],
  selector: 'app-administration-home',
  host: { class: 'console-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './administration-home.scss',
  templateUrl: './administration-home.html',
})
export class AdministrationHome {
  private readonly api = inject(ADMIN_API);
  private readonly session = inject(SessionContext);
  readonly groupIcons: Readonly<Record<string, string>> = {
    users: 'pi pi-users',
    roles: 'pi pi-id-card',
    groups: 'pi pi-users',
    agents: 'pi pi-sparkles',
    audit: 'pi pi-history',
    permissions: 'pi pi-key',
    work_groups: 'pi pi-users',
    tasks: 'pi pi-inbox',
    processes: 'pi pi-sitemap',
    history: 'pi pi-history',
    integrations: 'pi pi-link',
  };
  readonly groupDescriptions: Readonly<Record<string, string>> = {
    users: 'Manage user accounts and access.',
    roles: 'Organize roles and their permissions.',
    permissions: 'Review available access permissions.',
    groups: 'Organize people into work groups.',
    integrations: 'Manage connections to external services.',
    agents: 'Configure AI agents and their tools.',
    tasks: 'Inspect and manage background tasks.',
    processes: 'Review and control running processes.',
    audit: 'Review recorded workspace activity.',
    history: 'Inspect changes to workspace records.',
  };
  readonly groups = computed(() => {
    const actor = this.session.snapshot();
    return actor.status === 'authenticated'
      ? this.api
          .groups()
          .filter((group) =>
            this.api
              .commands(group.key)
              .some((command) =>
                hasPermissions(actor.permissions, [command.permission]),
              ),
          )
      : [];
  });
  readonly canManageClients = computed(() => {
    const actor = this.session.snapshot();
    return (
      actor.status === 'authenticated' &&
      hasPermissions(actor.permissions, ['forms.manage'])
    );
  });
}
