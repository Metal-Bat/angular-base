import { RouterLink } from '@angular/router';
import { LocalizePipe } from '../../../shared/ui/localize-pipe';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SessionContext } from '../../../core/auth/session-context';
import { hasPermissions } from '../../../core/permissions/area-access';

@Component({
  imports: [RouterLink, LocalizePipe],
  selector: 'app-studio-home',
  host: { class: 'console-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './studio-home.scss',
  templateUrl: './studio-home.html',
})
export class StudioHome {
  private readonly session = inject(SessionContext);
  readonly catalogs = computed(() => {
    const actor = this.session.snapshot();
    const cards = [
      {
        title: 'Forms',
        description: 'Author and preview versioned forms.',
        path: 'forms',
        icon: 'pi pi-file-edit',
        permission: 'forms.manage',
      },
      {
        title: 'Workflows',
        description: 'Build and validate workflow graphs.',
        path: 'workflows',
        icon: 'pi pi-sitemap',
        permission: 'workflows.manage',
      },
      {
        title: 'Request types',
        description: 'Configure how requests start and run.',
        path: 'request-types',
        icon: 'pi pi-send',
        permission: 'requests.manage',
      },
      {
        title: 'Clients and releases',
        description: 'Configure trusted clients and release policies.',
        path: 'clients',
        icon: 'pi pi-desktop',
        permission: 'forms.manage',
      },
      {
        title: 'Reusable components',
        description: 'Build reusable pieces for your forms.',
        path: 'form-components',
        icon: 'pi pi-objects-column',
        permission: 'forms.manage',
      },
      {
        title: 'Data types',
        description: 'Define consistent data across your forms.',
        path: 'form-data-types',
        icon: 'pi pi-database',
        permission: 'forms.manage',
      },
      {
        title: 'Library and upgrades',
        description: 'Review dependencies and plan version upgrades.',
        path: 'library',
        icon: 'pi pi-book',
        permission: 'workflows.manage',
      },
    ];
    return actor.status === 'authenticated'
      ? cards.filter((card) =>
          hasPermissions(actor.permissions, [card.permission]),
        )
      : [];
  });
}
