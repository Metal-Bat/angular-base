import { InjectionToken } from '@angular/core';
import { CalendarPort } from './application/calendar-port';
export const CALENDAR = new InjectionToken<CalendarPort>(
  'Authorized Gregorian calendar',
);
