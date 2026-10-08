import { InjectionToken } from '@angular/core';
import { RecordsPort } from './application/records-port';
import { RecordDefinition } from './domain/records';
export const RECORDS = new InjectionToken<RecordsPort>('RECORDS');
export const RECORD_DEFINITION = new InjectionToken<RecordDefinition>(
  'RECORD_DEFINITION',
);
export const ROLE_DEFINITION = new InjectionToken<RecordDefinition>(
  'ROLE_DEFINITION',
);

export const HISTORY_DEFINITION = new InjectionToken<RecordDefinition>(
  'History definition',
);
