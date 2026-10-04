import { Routes } from '@angular/router';
import { CANVAS_VIEW } from '../bindings';
import { WorkflowCanvas } from '../infrastructure/workflow-canvas/workflow-canvas';
export const workflowBoardRoutes: Routes = [
  {
    path: '',
    data: {
      access: 'authenticated',
      requiredPermissions: ['workflows.manage'],
    },
    providers: [{ provide: CANVAS_VIEW, useValue: WorkflowCanvas }],
    canDeactivate: [
      (component: { canLeave: () => Promise<boolean> }): Promise<boolean> =>
        component.canLeave(),
    ],
    loadComponent: () =>
      import('./workflow-board/workflow-board').then(
        (module) => module.WorkflowBoard,
      ),
  },
];
