// Actor-private, disposable fixture evidence only. No provider or real service runs.
export function createAgentAuthoringFixture() {
  const stamp = "2026-10-28T08:00:00Z";
  const source = {
    report_ref: "owned-report",
    source_key: "report.users",
    created_at: stamp,
    definition_version: 1,
    classification: "PUBLIC",
    fields: ["username"],
    max_rows: 3,
  };
  const draft = {
    ref_id: "evaluation-request",
    workflow_version_ref_id: "evaluation-version",
    status: "DRAFT",
    data: { title: "Quarterly invoice" },
    created_at: stamp,
  };
  const decision = (sample) => ({
    sample_state:
      sample === null
        ? "MISSING"
        : Object.keys(sample).sort().join(",") !== "choices,question"
          ? "INVALID"
          : !sample.choices?.length
            ? "EMPTY"
            : "VALID",
    options_input_key: "choices",
    options: sample?.choices ?? [],
    issue_codes:
      sample !== null &&
      Object.keys(sample).sort().join(",") !== "choices,question"
        ? ["sample.permitted_fields.mismatch"]
        : [],
    provider_called: false,
  });
  let submission = null;
  return (method, path, raw) => {
    const input = raw ? JSON.parse(raw) : {};
    const data = (value) => ({ success: true, data: value });
    const page = (items) => ({
      success: true,
      result: {
        items,
        page: input.page ?? 1,
        size: input.size ?? 10,
        total: items.length,
        total_pages: items.length ? 1 : 0,
      },
    });
    if (path === "/api/v1/workflows/search")
      return page([
        {
          ref_id: "evaluation-workflow",
          name: "Invoice review",
          is_active: true,
        },
      ]);
    if (path === "/api/v1/workflow-versions/search")
      return page([
        { ref_id: "evaluation-version", number: 1, status: "PUBLISHED" },
      ]);
    if (path === "/api/v1/workflow-versions/evaluation-version/graph")
      return data({
        steps: [
          {
            key: "classify",
            type_code: "AI_DECISION",
            config: { agent_ref: "agent-current" },
          },
        ],
      });
    if (path === "/api/v1/business-requests/search") return page([draft]);
    if (path === "/api/v1/business-requests/evaluation-request")
      return data(draft);
    if (!path.startsWith("/api/v1/ai-agents/agent-current/")) return null;
    if (method !== "POST") return null;
    if (path.endsWith("/decision-preview"))
      return data(decision(input.sample_inputs));
    if (path.endsWith("/workflow-context"))
      return data({
        agent_ref: "agent-current",
        workflow_version_ref: "evaluation-version",
        step_key: "classify",
        workflow_checksum: "fixture-checksum",
        sample_origin: input.sample_inputs === null ? "NONE" : "AUTHOR",
        input_schema: {
          type: "object",
          properties: {
            question: { type: "string" },
            choices: { type: "array" },
          },
        },
        decision: decision(input.sample_inputs),
      });
    if (path.endsWith("/retrieval-sources/search")) return page([source]);
    if (path.endsWith("/retrieval-preview"))
      return data({
        agent_ref: "agent-current",
        source,
        limit: input.limit,
        tool_key: "lookup_saved_report",
        tool_version: "1",
        tool_called: false,
        requires_human_tool_approval: true,
      });
    if (path.endsWith("/evaluations")) {
      if (input.request_ref !== "evaluation-request" || !input.submit_key)
        throw Error("Expected exact owned draft and replay key");
      if (submission && JSON.stringify(input) !== submission)
        throw Error("Changed original submission");
      submission = JSON.stringify(input);
      draft.status = "RUNNING";
      return data({
        agent_ref: "agent-current",
        request_ref: draft.ref_id,
        request_status: draft.status,
        process_ref: "evaluation-process",
        evidence_kind: "GOVERNED_REQUEST_SUBMISSION",
      });
    }
    return null;
  };
}
