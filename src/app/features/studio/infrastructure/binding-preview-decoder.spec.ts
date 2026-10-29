import { bindingPreview } from './binding-preview-decoder';
const body = { target_step: 'assemble', target_port: 'data' };
const reply = {
  workflow_version_ref: 'current',
  candidate_checksum: 'a'.repeat(64),
  ...body,
  sample_state: 'VALID',
  fields: [
    {
      path: '/count',
      source_kind: 'REQUEST',
      sample_origin: 'AUTHOR',
      value_type: 'integer',
    },
  ],
  issues: [],
  values_redacted: true,
  provider_called: false,
  tool_called: false,
  handler_called: false,
};
it('accepts structural output and rejects value leakage, execution claims and wrong targets', () => {
  expect(bindingPreview(reply, body).fields[0].path).toBe('/count');
  for (const invalid of [
    { ...reply, provider_called: true },
    { ...reply, values_redacted: false },
    { ...reply, target_step: 'foreign' },
    { ...reply, fields: [{ ...reply.fields[0], value: 'PRIVATE' }] },
    { ...reply, fields: [{ ...reply.fields[0], value_type: 'made-up' }] },
  ]) {
    expect(() => bindingPreview(invalid, body)).toThrow();
  }
});
