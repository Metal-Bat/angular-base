import { InjectionToken } from '@angular/core';
import { SupportPort } from './application/support-port';
export const SUPPORT = new InjectionToken<SupportPort>(
  'Authorized support incidents',
);
