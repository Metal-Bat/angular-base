import { JsonObject } from '../../forms/domain/runtime-document';

/** Bounded business settings; release-version grammar remains producer-owned. */
export function catalogSettingsErrors(
  resource: string,
  values: JsonObject,
): Readonly<Record<string, string>> {
  const errors: Record<string, string> = {};
  const capabilities = values['renderer_capabilities'];
  if (resource === 'client-releases' && capabilities !== undefined) {
    if (
      !Array.isArray(capabilities) ||
      capabilities.length > 32 ||
      new Set(capabilities).size !== capabilities.length ||
      capabilities.some(
        (value) => typeof value !== 'string' || !value || value.length > 128,
      )
    ) {
      errors['renderer_capabilities'] =
        'Enter up to 32 unique capabilities, each with 1 to 128 characters.';
    }
  }
  const targets = values['client_targets'];
  if (resource === 'request-types' && targets !== undefined) {
    if (
      !Array.isArray(targets) ||
      targets.length > 32 ||
      targets.some(
        (value) =>
          !value ||
          typeof value !== 'object' ||
          Array.isArray(value) ||
          typeof value['client_ref_id'] !== 'string' ||
          !value['client_ref_id'].trim(),
      )
    ) {
      errors['client_targets'] =
        'Choose a client for every restriction or remove the unfinished restriction.';
    }
  }
  return errors;
}
