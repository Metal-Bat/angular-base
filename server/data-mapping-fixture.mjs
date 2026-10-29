// Contract-shaped disposable UI data. This never establishes real-service acceptance.
export function dataMappingFixture(handlers) {
  const definitions = [
    ["convert", "transform", "2"],
    ["notify", "notification", "1"],
  ];
  const catalog = definitions.map(([key, handlerKey, version]) => {
    const handler = handlers.find(
      (item) =>
        item.handler_key === handlerKey && item.handler_version === version,
    );
    return {
      key,
      title: key === "convert" ? "Typed conversion" : "Notification",
      category: "step_type",
      type_schema: handler.config_schema,
      metadata: {
        ref_id: "fixture-" + key,
        code: handler.code,
        handler_key: handlerKey,
        handler_version: version,
        number: Number(version),
        runtime_available: true,
        ports: handler.ports,
      },
    };
  });
  const profile = {
    type: "object",
    properties: {
      person: {
        type: "object",
        properties: { name: { type: "string", title: "Full name" } },
      },
      names: { type: "array", items: { type: "string" } },
      rows: {
        type: "array",
        items: { type: "object", properties: { note: { type: "string" } } },
      },
    },
  };
  return {
    users: {
      success: true,
      result: {
        items: [
          { key: "fixture-alice", value: "Alice Example" },
          { key: "fixture-bob", value: "Bob Example" },
        ],
        page: 1,
        size: 20,
        total: 2,
        total_pages: 1,
      },
    },
    catalog,
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
            key: "convert",
            type_code: "TRANSFORM",
            type_version_ref: "fixture-convert",
            config: {
              conversion_key: "object",
              projection: { name: "/person/name" },
            },
          },
          {
            key: "notify",
            type_code: "NOTIFICATION",
            type_version_ref: "fixture-notify",
            config: {},
          },
        ],
        transitions: [
          { source: "prepare", target: "convert", outcome: "next" },
          { source: "convert", target: "notify", outcome: "next" },
        ],
        bindings: [
          {
            step: "convert",
            target_port: "value",
            target_schema: { type: "object" },
            ordinal: 0,
            source_kind: "REQUEST",
            source_path: "/profile",
            source_schema: { type: "object", properties: { profile } },
          },
        ],
        targets: [],
      },
      positions: {
        prepare: { x: 40, y: 40 },
        convert: { x: 400, y: 40 },
        notify: { x: 760, y: 40 },
      },
      viewport: { x: 0, y: 0, zoom: 1 },
      collapsed: [],
      routing: {},
    },
    completion: {
      success: true,
      result: {
        items: [
          {
            path: "request.profile",
            source: "request",
            cardinality: "SCALAR",
            type_schema: profile,
          },
          {
            path: "process.status",
            source: "process",
            cardinality: "SCALAR",
            type_schema: { type: "string" },
          },
          {
            path: "request.amount",
            source: "request",
            cardinality: "SCALAR",
            type_schema: { type: "integer" },
          },
          {
            path: "steps.convert.outputs.result",
            source: "step_output",
            source_step: "convert",
            cardinality: "SCALAR",
            type_schema: {
              type: "object",
              properties: { name: {} },
              additionalProperties: false,
            },
          },
        ],
        page: 1,
        size: 100,
        total: 4,
        total_pages: 1,
      },
    },
  };
}
