import { ProcessReader } from './domain/process-tracking';
import { InjectionToken } from '@angular/core';
import {
  CreationPort,
  EditorPort,
  PagesPort,
} from './application/workspace-ports';
export const CASE_EDITOR = new InjectionToken<EditorPort>('Case editor');
export const WORKSPACE_PAGES = new InjectionToken<PagesPort>('Workspace pages');
export const REQUEST_CREATION = new InjectionToken<CreationPort>(
  'Request creation',
);

export const CASE_EDITOR_FACTORY = new InjectionToken<() => EditorPort>(
  'Case editor factory',
);
export const WORKSPACE_PAGES_FACTORY = new InjectionToken<() => PagesPort>(
  'Workspace pages factory',
);

export const PROCESS_READER = new InjectionToken<ProcessReader>(
  'Authorized process reader',
);

export const FORM_RESOURCE_FACTORY = new InjectionToken<
  (
    editor: EditorPort,
  ) => import('../forms/application/form-resources').FormResources
>('Case resources factory');

export const PERSONAL_SERVICES = new InjectionToken<
  import('./application/personal-services-port').PersonalServicesPort
>('Personal services');
