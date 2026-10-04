import { Routes } from '@angular/router';
import { routeAccessGuard } from '../permissions/route-access-guard';
export const previewRoutes: Routes = [
  {
    path: 'ui-preview',
    canActivate: [routeAccessGuard],
    data: { access: 'authenticated', requiredPermissions: [] },
    title: 'Form controls | Workflow workspace',
    loadComponent: () =>
      import('../../shared/ui/ui-showcase/ui-showcase').then(
        (m) => m.UiShowcase,
      ),
  },
];
