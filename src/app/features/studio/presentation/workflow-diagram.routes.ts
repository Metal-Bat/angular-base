import { Type } from '@angular/core';
export const loadWorkflowCanvas = (): Promise<Type<unknown>> =>
  import('../infrastructure/workflow-canvas/workflow-canvas').then(
    (module) => module.WorkflowCanvas,
  );
