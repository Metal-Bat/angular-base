import { InjectionToken } from '@angular/core';
import { RuntimeOptionsPort } from './application/runtime-options-port';
export const RUNTIME_OPTIONS = new InjectionToken<RuntimeOptionsPort>(
  'Runtime option reader',
);

import { RuntimeCompatibility } from './domain/runtime-document';
export const PREVIEW_DOCUMENT = new InjectionToken<RuntimeCompatibility>(
  'Development preview document',
);

export const FORM_RESOURCES = new InjectionToken<
  import('./application/form-resources').FormResources
>('Authorized form resources');
