import { FormVersion } from '../domain/form-version';

// Read-only projection of FormVersionDTO in docs/reference/openapi.json.
// Generated full DTOs will replace this projection in API-01; use only on authorized authoring responses.
export function readFormVersionIdentity(value: unknown): FormVersion {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid form version identity.');
  }
  const dto = value as Record<string, unknown>;
  if (
    typeof dto['form_ref_id'] !== 'string' ||
    dto['form_ref_id'].length === 0 ||
    typeof dto['ref_id'] !== 'string' ||
    dto['ref_id'].length === 0 ||
    typeof dto['number'] !== 'number' ||
    !Number.isSafeInteger(dto['number']) ||
    dto['number'] < 1
  ) {
    throw new Error('Invalid form version identity.');
  }
  return {
    definitionReference: dto['form_ref_id'],
    versionReference: dto['ref_id'],
    number: dto['number'],
  };
}
