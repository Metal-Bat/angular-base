// UI fixtures only. Actual publication/execution is verified by the disposable service journey.
export function subprocessMappingFixture() {
  const payload = {
    type: "object",
    properties: { model_id: { type: "string" }, enabled: { type: "boolean" } },
    required: ["model_id", "enabled"],
  };
  const contract = {
    inputs: [
      { name: "payload", value_schema: payload },
      {
        name: "rows",
        required: false,
        value_schema: { type: "array", items: { type: "string" } },
      },
      {
        name: "note",
        required: false,
        value_schema: { type: ["string", "null"] },
      },
      { name: "amount", value_schema: { type: "integer", minimum: 0 } },
    ],
    outputs: [
      {
        name: "answer",
        value_schema: { type: "string" },
        source_step: "finish",
        source_port: "result",
      },
    ],
    outcomes: { done: "finish" },
    required_capabilities: ["workflows.manage"],
  };
  return {
    interface: contract,
    childDocument: {
      dialect: "bpms.workspace/1",
      graph: {
        steps: [
          {
            key: "child_only",
            type_code: "TRANSFORM",
            type_version_ref: "fixture-type",
            config: { conversion_key: "string" },
          },
        ],
        transitions: [],
        bindings: [],
        targets: [],
      },
      positions: { child_only: { x: 40, y: 40 } },
      viewport: { x: 0, y: 0, zoom: 1 },
      collapsed: [],
      routing: {},
    },
    catalog: [],
    users: {
      success: true,
      result: { items: [], total: 0, page: 1, total_pages: 1, size: 20 },
    },
    document: {
      dialect: "bpms.workspace/1",
      graph: {
        steps: [
          {
            key: "prepare",
            type_code: "TRANSFORM",
            type_version_ref: "fixture-type",
            config: { conversion_key: "string" },
          },
          {
            key: "call",
            type_code: "SUBPROCESS",
            type_version_ref: "fixture-subprocess",
            config: {},
            subprocess: {
              workflow_version_ref: "fixture-child",
              inputs: [
                {
                  name: "payload",
                  source_kind: "CONSTANT",
                  source_schema: payload,
                  constant_value: { model_id: "saved", enabled: false },
                },
                {
                  name: "rows",
                  source_kind: "CONSTANT",
                  source_schema: contract.inputs[1].value_schema,
                  constant_value: [""],
                },
                {
                  name: "note",
                  source_kind: "CONSTANT",
                  source_schema: contract.inputs[2].value_schema,
                  constant_value: null,
                },
                {
                  name: "amount",
                  source_kind: "CONSTANT",
                  source_schema: { type: "integer", minimum: 0 },
                  constant_value: 1,
                },
              ],
            },
          },
        ],
        transitions: [{ source: "prepare", target: "call", outcome: "next" }],
        bindings: [],
        targets: [],
      },
      positions: { prepare: { x: 40, y: 40 }, call: { x: 400, y: 40 } },
      viewport: { x: 0, y: 0, zoom: 1 },
      collapsed: [],
      routing: {},
    },
    completion: {
      success: true,
      result: {
        items: [
          {
            source: "request",
            path: "request.profile",
            type_schema: payload,
            cardinality: "SCALAR",
          },
          {
            source: "request",
            path: "request.amount",
            type_schema: { type: "integer" },
            cardinality: "SCALAR",
          },
          {
            source: "process",
            path: "process.status",
            type_schema: { type: "string" },
            cardinality: "SCALAR",
          },
          {
            source: "step_output",
            source_step: "prepare",
            path: "steps.prepare.outputs.result",
            type_schema: { type: "string" },
            cardinality: "SCALAR",
          },
        ],
        total: 4,
        total_pages: 1,
        page: 1,
        size: 100,
      },
    },
  };
}
