import { HttpContextToken } from '@angular/common/http';
import type { components } from '../transport/generated/schema';
export const SUPPORT_INTAKE = new HttpContextToken(() => false);
export type SupportReceipt = components['schemas']['SupportReceipt'];
export const isSupportReference = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
