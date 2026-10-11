import { Routes } from '@angular/router';
import { HELP_STATE } from '../bindings';
import { HelpState } from '../infrastructure/help-state';
export const helpRoutes: Routes = [
  {
    path: '',
    providers: [{ provide: HELP_STATE, useExisting: HelpState }],
    loadComponent: () =>
      import('./help-page/help-page').then((module) => module.HelpPage),
  },
];
