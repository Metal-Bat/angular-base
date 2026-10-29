import { JsonObject } from '../../../shared/domain/json-value';
export type BindingPreview = {
  workflow_version_ref: string;
  candidate_checksum: string | null;
  target_step: string;
  target_port: string;
  sample_state: 'VALID' | 'MISSING' | 'INVALID';
  fields: readonly {
    path: string;
    source_kind: string;
    sample_origin: string;
    value_type: string;
  }[];
  issues: readonly { pointer: string; code: string }[];
};
export function sampleIdentity(binding: JsonObject): string {
  const { ordinal, ...rest } = binding;
  void ordinal;
  return JSON.stringify(rest);
}
