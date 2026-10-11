import { InjectionToken } from '@angular/core';
import { AnalyticsPort } from './application/analytics-port';
export const ANALYTICS = new InjectionToken<AnalyticsPort>(
  'Authorized personal analytics',
);
