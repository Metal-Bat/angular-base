import { PersonalServices } from '../infrastructure/personal-services';
import { CaseResources } from '../infrastructure/case-resources';
import { EditorPort } from '../application/workspace-ports';
import { areaPermissions } from '../../../core/permissions/area-access';
import { inject } from '@angular/core';
import { ProcessTracking } from '../infrastructure/process-tracking';
import { ProcessReader } from '../domain/process-tracking';
import { Routes } from '@angular/router';

import { routeAccessGuard } from '../../../core/permissions/route-access-guard';

import {
  CASE_EDITOR_FACTORY,
  FORM_RESOURCE_FACTORY,
  PERSONAL_SERVICES,
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
        path: 'media',
        data: { access: 'authenticated', requiredPermissions: [] },
        loadComponent: () =>
          import('./generic-media/generic-media').then((m) => m.GenericMedia),
      },
      ...(['notifications', 'reports'] as const).map((kind) => ({
        path: kind,
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
        providers: [
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
      },
      {
        path: 'catalog',
        providers: [
          {
            provide: WORKSPACE_PAGES_FACTORY,
            useValue: () => new WorkspacePages(),
          },
        ],
        title: 'RequestCatalog | Workflow workspace',
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
        providers: [
          {
            provide: WORKSPACE_PAGES_FACTORY,
            useValue: () => new WorkspacePages(),
          },
        ],
        title: 'RequestList | Workflow workspace',
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
        providers: [
          {
            provide: WORKSPACE_PAGES_FACTORY,
            useValue: () => new WorkspacePages(),
          },
        ],
        title: 'TaskInbox | Workflow workspace',
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
        title: 'CaseDetail | Workflow workspace',
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
          { provide: CASE_EDITOR_FACTORY, useValue: () => new CaseEditor() },
        ],
        title: 'CaseDetail | Workflow workspace',
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
