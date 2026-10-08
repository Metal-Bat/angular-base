import { ADMIN_API } from '../../administration/bindings';
import { AdminApi } from '../../administration/infrastructure/admin-api';
import { Route } from '@angular/router';
import {
  HISTORY_DEFINITION,
  RECORD_DEFINITION,
  RECORDS,
  ROLE_DEFINITION,
} from '../bindings';
import { RecordsApi } from '../infrastructure/records-api';
import { recordDefinitions } from '../infrastructure/record-definitions';
import { routeAccessGuard } from '../../../core/permissions/route-access-guard';
export function recordRoute(key: string, path = key): Route {
  const definition = recordDefinitions[key];
  return {
    path,
    title: definition.title + ' | Workflow workspace',
    providers: [
      { provide: ADMIN_API, useExisting: AdminApi },
      { provide: RECORDS, useExisting: RecordsApi },
      { provide: HISTORY_DEFINITION, useValue: recordDefinitions['history'] },
      { provide: RECORD_DEFINITION, useValue: definition },
      { provide: ROLE_DEFINITION, useValue: recordDefinitions['roles'] },
    ],
    canActivate: [routeAccessGuard],
    data: {
      access: 'authenticated',
      requiredPermissions: definition.permission ? [definition.permission] : [],
    },
    canDeactivate: [
      (component: { canLeave(): Promise<boolean> }): Promise<boolean> =>
        component.canLeave(),
    ],
    loadComponent: () => import('./resource-page').then((m) => m.ResourcePage),
  };
}
