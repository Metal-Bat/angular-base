import { areaPermissions } from '../../../core/permissions/area-access';
import { StudioApi } from '../infrastructure/studio-api';
import { STUDIO_API } from '../bindings';
import { ResourceKey } from '../domain/authoring';
import { Routes } from '@angular/router';

import { routeAccessGuard } from '../../../core/permissions/route-access-guard';

export const studioRoutes: Routes = [
  {
    path: '',
    providers: [{ provide: STUDIO_API, useExisting: StudioApi }],
    canActivateChild: [routeAccessGuard],
    children: [
      ...(
        [
          'forms',
          'form-versions',
          'workflows',
          'workflow-versions',
          'clients',
          'client-releases',
          'request-types',
          'form-components',
          'form-component-versions',
          'form-data-types',
          'form-data-type-versions',
        ] as ResourceKey[]
      ).map((key) => ({
        path: key,
        title: key + ' | Studio',
        data: {
          resourceKey: key,
          access: 'authenticated',
          requiredPermissions: [
            key.startsWith('workflow')
              ? 'workflows.manage'
              : key === 'request-types'
                ? 'requests.manage'
                : 'forms.manage',
          ],
        },
        canDeactivate: [
          (component: { canLeave: () => Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        loadComponent: () =>
          import('./resource-catalog/resource-catalog').then(
            (module) => module.ResourceCatalog,
          ),
      })),
      {
        path: 'form-versions/:ref/edit',
        title: 'Form designer | Studio',
        data: {
          access: 'authenticated',
          requiredPermissions: ['forms.manage'],
        },
        canDeactivate: [
          (component: { canLeave: () => Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        loadComponent: () =>
          import('./form-builder/form-builder').then(
            (module) => module.FormBuilder,
          ),
      },
      {
        path: 'workflow-versions/:ref/edit',
        title: 'Workflow designer | Studio',
        data: {
          access: 'authenticated',
          requiredPermissions: ['workflows.manage'],
        },
        loadChildren: () =>
          import('./workflow-board.routes').then(
            (module) => module.workflowBoardRoutes,
          ),
      },
      {
        path: 'library',
        title: 'Reusable library | Studio',
        data: {
          access: 'authenticated',
          requiredPermissions: ['workflows.manage'],
        },
        loadComponent: () =>
          import('./library-tools/library-tools').then(
            (module) => module.LibraryTools,
          ),
      },

      {
        path: '',
        pathMatch: 'full',
        title: 'Studio | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: [],
          anyPermissions: areaPermissions.studio,
        },
        loadComponent: () => import('./studio-home').then((m) => m.StudioHome),
      },
    ],
  },
];
