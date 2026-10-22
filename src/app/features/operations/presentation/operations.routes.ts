import { ADMIN_API } from '../../administration/bindings';
import { AdminApi } from '../../administration/infrastructure/admin-api';
import { installationOperatorGuard } from '../../../core/permissions/installation-operator-guard';
import { SUPPORT } from '../../support/bindings';
import { SupportApi } from '../../support/infrastructure/support-api';
import { CALENDAR } from '../../calendar/bindings';
import { CalendarApi } from '../../calendar/infrastructure/calendar-api';
import { ANALYTICS } from '../../analytics/bindings';
import { AnalyticsApi } from '../../analytics/infrastructure/analytics-api';
import { recordRoute } from '../../records/presentation/record.routes';
import { PersonalServices } from '../infrastructure/personal-services';
import { CaseResources } from '../infrastructure/case-resources';
import { EditorPort } from '../application/workspace-ports';
import { areaPermissions } from '../../../core/permissions/area-access';
import { inject } from '@angular/core';
import { ProcessTracking } from '../infrastructure/process-tracking';
import { ProcessEvidenceApi } from '../infrastructure/process-evidence';
import { OrderRecoveryApi } from '../infrastructure/order-recovery';
import { ProcessReader } from '../domain/process-tracking';
import { Routes } from '@angular/router';

import { routeAccessGuard } from '../../../core/permissions/route-access-guard';

import {
  CASE_EDITOR_FACTORY,
  FORM_RESOURCE_FACTORY,
  ORDER_RECOVERY,
  PERSONAL_SERVICES,
  PROCESS_DESTINATION,
  PROCESS_EVIDENCE,
  PROCESS_READER,
  REQUEST_CREATION,
  WORKSPACE_PAGES_FACTORY,
} from '../bindings';
import { RUNTIME_OPTIONS } from '../../forms/bindings';
import { CaseEditor } from '../infrastructure/case-editor';
import { WorkspacePages } from '../infrastructure/workspace-pages';
import { RequestCreation } from '../infrastructure/request-creation';
import { RuntimeOptions } from '../../forms/infrastructure/runtime-options';

import { runtimePreviewRoutes } from './runtime-preview.routes';
export const operationsRoutes: Routes = [
  {
    path: '',
    providers: [
      {
        provide: PROCESS_DESTINATION,
        useFactory:
          (): import('../domain/process-tracking').ProcessDestinationReader => {
            const reader = inject(ProcessTracking);
            return (request, abort) => reader.destination(request, abort);
          },
      },
      { provide: PERSONAL_SERVICES, useExisting: PersonalServices },
      { provide: REQUEST_CREATION, useExisting: RequestCreation },
      {
        provide: FORM_RESOURCE_FACTORY,
        useValue: (editor: EditorPort) => new CaseResources(editor),
      },
      { provide: RUNTIME_OPTIONS, useExisting: RuntimeOptions },
    ],
    canActivateChild: [routeAccessGuard],
    children: [
      ...runtimePreviewRoutes,
      {
        path: 'support',
        title: 'Support | Workflow workspace',
        providers: [{ provide: SUPPORT, useExisting: SupportApi }],
        data: {
          access: 'authenticated',
          requiredPermissions: ['support.incidents.manage'],
        },
        loadComponent: () =>
          import('../../support/presentation/support-page/support-page').then(
            (m) => m.SupportPage,
          ),
      },
      {
        path: 'calendar',
        title: 'Calendar | Workflow workspace',
        providers: [{ provide: CALENDAR, useExisting: CalendarApi }],
        data: { access: 'authenticated', requiredPermissions: [] },
        canDeactivate: [
          (component: { canLeave(): Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        loadComponent: () =>
          import('../../calendar/presentation/calendar-page/calendar-page').then(
            (m) => m.CalendarPage,
          ),
      },
      {
        path: 'dashboard',
        title: 'Dashboard | Workflow workspace',
        providers: [{ provide: ANALYTICS, useExisting: AnalyticsApi }],
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
        },
        loadComponent: () =>
          import('../../analytics/presentation/dashboard/dashboard').then(
            (m) => m.Dashboard,
          ),
      },
      {
        path: 'favorites',
        title: 'Favorites | Workflow workspace',
        data: { access: 'authenticated', requiredPermissions: [] },
        loadComponent: () =>
          import('../../records/presentation/favorites/favorites').then(
            (m) => m.Favorites,
          ),
      },
      {
        path: 'readiness',
        title: 'Setup checklist | Workflow workspace',
        canActivate: [installationOperatorGuard],
        data: { access: 'authenticated', requiredPermissions: [] },
        loadComponent: () =>
          import('../../readiness/presentation/readiness-page/readiness-page').then(
            (m) => m.ReadinessPage,
          ),
      },
      {
        path: 'media',
        title: 'Private uploads | Workflow workspace',
        data: { access: 'authenticated', requiredPermissions: [] },
        loadComponent: () =>
          import('./generic-media/generic-media').then((m) => m.GenericMedia),
      },
      recordRoute('reports'),
      ...(['notifications'] as const).map((kind) => ({
        path: kind,
        title: 'Notifications | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: [],
          serviceKind: kind,
        },
        loadComponent: () =>
          import('./personal-services/personal-services').then(
            (m) => m.PersonalServices,
          ),
      })),
      {
        path: 'processes/:ref',
        title: 'Process tracking | Workflow workspace',
        providers: [
          { provide: PROCESS_EVIDENCE, useExisting: ProcessEvidenceApi },
          { provide: ORDER_RECOVERY, useExisting: OrderRecoveryApi },
          {
            provide: PROCESS_READER,
            useFactory: (): ProcessReader => {
              const reader = inject(ProcessTracking);
              return (reference, page, report, abort) =>
                reader.read(reference, page, report, abort);
            },
          },
        ],
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
        },
        loadComponent: () =>
          import('./process-entry/process-entry').then((m) => m.ProcessEntry),
        canDeactivate: [
          (component: { canLeave(): Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
      },
      {
        path: 'catalog',
        providers: [
          {
            provide: WORKSPACE_PAGES_FACTORY,
            useValue: () => new WorkspacePages(),
          },
        ],
        title: 'Start a request | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
          caseKind: 'request',
        },
        loadComponent: () =>
          import('./request-catalog/request-catalog').then(
            (m) => m.RequestCatalog,
          ),
      },
      {
        path: 'requests',
        canDeactivate: [
          (component: { canLeave(): Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        providers: [
          {
            provide: WORKSPACE_PAGES_FACTORY,
            useValue: () => new WorkspacePages(),
          },
        ],
        title: 'My requests | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
          caseKind: 'request',
        },
        loadComponent: () =>
          import('./request-list/request-list').then((m) => m.RequestList),
      },
      {
        path: 'tasks',
        canDeactivate: [
          (component: { canLeave(): Promise<boolean> }): Promise<boolean> =>
            component.canLeave(),
        ],
        providers: [
          {
            provide: WORKSPACE_PAGES_FACTORY,
            useValue: () => new WorkspacePages(),
          },
        ],
        title: 'Task inbox | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
          caseKind: 'task',
        },
        loadComponent: () =>
          import('./task-inbox/task-inbox').then((m) => m.TaskInbox),
      },
      {
        path: 'requests/:ref',
        providers: [
          { provide: CASE_EDITOR_FACTORY, useValue: () => new CaseEditor() },
        ],
        title: 'Request detail | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
          caseKind: 'request',
        },
        canDeactivate: [
          (component: {
            canLeave(): boolean | Promise<boolean>;
          }): boolean | Promise<boolean> => component.canLeave(),
        ],
        loadComponent: () =>
          import('./case-detail/case-detail').then((m) => m.CaseDetail),
      },
      {
        path: 'tasks/:ref',
        providers: [
          { provide: ADMIN_API, useExisting: AdminApi },
          { provide: CASE_EDITOR_FACTORY, useValue: () => new CaseEditor() },
        ],
        title: 'Task detail | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: ['requests.start'],
          caseKind: 'task',
        },
        canDeactivate: [
          (component: {
            canLeave(): boolean | Promise<boolean>;
          }): boolean | Promise<boolean> => component.canLeave(),
        ],
        loadComponent: () =>
          import('./case-detail/case-detail').then((m) => m.CaseDetail),
      },
      {
        path: '',
        pathMatch: 'full',
        title: 'Operations | Workflow workspace',
        data: {
          access: 'authenticated',
          requiredPermissions: [],
          anyPermissions: areaPermissions.operations,
        },
        loadComponent: () =>
          import('./operations-home').then((m) => m.OperationsHome),
      },
    ],
  },
];
