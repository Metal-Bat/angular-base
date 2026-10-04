import { routeAccessGuard } from './core/permissions/route-access-guard';
import { previewRoutes } from './core/development/preview-routes';
import { Routes } from '@angular/router';

import { AppShell } from './core/layout/app-shell';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      {
        path: 'login',
        title: 'Sign in | Workflow workspace',
        loadComponent: () =>
          import('./core/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'reset-password',
        title: 'Reset password | Workflow workspace',
        loadComponent: () =>
          import('./core/auth/password-reset/password-reset').then(
            (m) => m.PasswordReset,
          ),
      },
      {
        path: 'account',
        canActivate: [routeAccessGuard],
        data: { access: 'authenticated', requiredPermissions: [] },
        loadComponent: () =>
          import('./core/auth/account/account').then((m) => m.Account),
      },
      { path: '', pathMatch: 'full', redirectTo: 'operations' },
      {
        path: 'operations',
        loadChildren: () =>
          import('./features/operations/presentation/operations.routes').then(
            (m) => m.operationsRoutes,
          ),
      },
      {
        path: 'studio',
        loadChildren: () =>
          import('./features/studio/presentation/studio.routes').then(
            (m) => m.studioRoutes,
          ),
      },
      {
        path: 'administration',
        loadChildren: () =>
          import('./features/administration/presentation/administration.routes').then(
            (m) => m.administrationRoutes,
          ),
      },
      {
        path: 'forbidden',
        title: 'Access denied | Workflow workspace',
        data: { unavailable: false },
        loadComponent: () =>
          import('./shared/ui/access-denied/access-denied').then(
            (m) => m.AccessDenied,
          ),
      },
      {
        path: 'access-unavailable',
        title: 'Access unavailable | Workflow workspace',
        data: { unavailable: true },
        loadComponent: () =>
          import('./shared/ui/access-denied/access-denied').then(
            (m) => m.AccessDenied,
          ),
      },
      ...previewRoutes,
      {
        path: '**',
        title: 'Page not found | Workflow workspace',
        loadComponent: () =>
          import('./shared/ui/not-found').then((m) => m.NotFound),
      },
    ],
  },
];
