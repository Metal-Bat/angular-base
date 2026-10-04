import { InjectionToken, Type } from '@angular/core';
import { StudioPort } from './application/studio-port';
export const STUDIO_API = new InjectionToken<StudioPort>('Authoring API');
export const CANVAS_VIEW = new InjectionToken<Type<unknown>>(
  'Workflow canvas adapter',
);
