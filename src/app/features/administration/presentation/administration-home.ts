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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './administration-home.scss',
  templateUrl: './administration-home.html',
})
export class AdministrationHome {
  private readonly api = inject(ADMIN_API);
  private readonly session = inject(SessionContext);
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
