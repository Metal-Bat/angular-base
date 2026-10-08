import { InjectionToken } from '@angular/core';
import { AdminPort } from './application/admin-port';
export const ADMIN_API = new InjectionToken<AdminPort>('Administration API');
