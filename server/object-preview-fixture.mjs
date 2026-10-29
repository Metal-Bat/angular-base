// Bounded structural wire fixture only; real validation/execution is tested by paired services.
export function objectPreviewFixture(body) {
  const bindings = body.graph.bindings.filter(
    (row) =>
      row.step === body.target_step && row.target_port === body.target_port,
  );
  const samples = new Map(body.samples.map((row) => [row.ordinal, row.value]));
  const missing = bindings.filter(
    (row) => row.source_kind !== "CONSTANT" && !samples.has(row.ordinal),
  );
  return {
    success: true,
    data: {
      workflow_version_ref: "fixture-flow",
      candidate_checksum: "a".repeat(64),
      target_step: body.target_step,
      target_port: body.target_port,
      sample_state: missing.length ? "MISSING" : "VALID",
      fields: bindings
        .filter(
          (row) => row.source_kind === "CONSTANT" || samples.has(row.ordinal),
        )
        .map((row) => {
          const value =
            row.source_kind === "CONSTANT"
              ? row.constant_value
              : samples.get(row.ordinal);
          return {
            path: row.target_projection.path,
            source_kind: row.source_kind,
            sample_origin:
              row.source_kind === "CONSTANT" ? "VISIBLE_CONSTANT" : "AUTHOR",
            value_type:
              value === null
                ? "null"
                : Array.isArray(value)
                  ? "array"
                  : typeof value === "number" && Number.isInteger(value)
                    ? "integer"
                    : typeof value,
          };
        }),
      issues: missing.map((row) => ({
        pointer: "/samples/" + row.ordinal,
        code: "binding.preview.sample.missing",
      })),
      values_redacted: true,
      provider_called: false,
      tool_called: false,
      handler_called: false,
    },
  };
}
