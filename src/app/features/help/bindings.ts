import { InjectionToken } from '@angular/core';
import { HelpStatePort } from './application/help-state-port';
export const HELP_STATE = new InjectionToken<HelpStatePort>(
  'Account-owned help acknowledgments',
);
