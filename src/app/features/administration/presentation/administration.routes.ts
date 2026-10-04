import { ADMIN_API } from '../bindings';
import { AdminApi } from '../infrastructure/admin-api';
import contracts from '../infrastructure/admin-contracts.json';
import { STUDIO_API } from '../../studio/bindings';
import { StudioApi } from '../../studio/infrastructure/studio-api';
import { areaPermissions } from '../../../core/permissions/area-access';
import { Routes } from '@angular/router';

import { routeAccessGuard } from '../../../core/permissions/route-access-guard';

export const administrationRoutes: Routes = [
  {
    path: '',
    canActivateChild: [routeAccessGuard],
    children: [
      ...Object.entries(contracts).map(([key, group]) => ({
        path: key,
        providers: [{ provide: ADMIN_API, useExisting: AdminApi }],
        title: group.title + ' | Administration',
        data: {
          access: 'authenticated',
          requiredPermissions: [],
          anyPermissions: [
            ...new Set(group.commands.map((command) => command.permission)),
          ],
          adminGroup: key,
        },
        canDeactivate: [
          (component: { canLeave: () => Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        loadComponent: () =>
          import('./admin-console/admin-console').then(
            (module) => module.AdminConsole,
          ),
      })),

      ...['clients', 'client-releases'].map((key) => ({
        path: key,
        providers: [{ provide: STUDIO_API, useExisting: StudioApi }],
        title: key + ' | Administration',
        data: {
          access: 'authenticated',
          requiredPermissions: ['forms.manage'],
          resourceKey: key,
        },
        canDeactivate: [
          (component: { canLeave: () => Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        loadComponent: () =>
          import('../../studio/presentation/resource-catalog/resource-catalog').then(
            (module) => module.ResourceCatalog,
          ),
      })),
      {
        path: '',
        providers: [{ provide: ADMIN_API, useExisting: AdminApi }],
        pathMatch: 'full',
        title: 'Administration | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: [],
          anyPermissions: areaPermissions.administration,
        },
        loadComponent: () =>
          import('./administration-home').then((m) => m.AdministrationHome),
      },
    ],
  },
];
