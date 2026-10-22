import { createHash } from "node:crypto";
import { runtimeFixture } from "../src/app/features/forms/testing/runtime-fixtures.ts";

// Local browser fixture only: the real backend owns policy and behavior evaluation.
export function formPreviewFixture(body) {
  const dto = runtimeFixture("REQUEST");
  const properties = body.documents.data_schema.properties ?? {};
  const scopes = Object.keys(properties).map((name) => "/properties/" + name);
  const writable = ["edit", "correction"].includes(body.purpose);
  dto.data = { ...body.data };
  dto.before_data = body.before_data ?? null;
  dto.before_item_identity = body.before_item_identity ?? null;
  dto.item_identity = body.item_identity ?? {};
  dto.render_schema = projectedRender(body.documents.render_schema);
  dto.page_settings = body.documents.page_settings ?? {};
  dto.purpose = body.purpose;
  dto.resolved_locale = body.locale;
  dto.direction = body.locale === "en" ? "ltr" : "rtl";
  dto.actions = [];
  dto.readable_scopes = scopes;
  dto.writable_scopes = writable ? scopes : [];
  dto.required_scopes = (body.documents.data_schema.required ?? []).map(
    (name) => "/properties/" + name,
  );
  dto.field_metadata = Object.entries(properties).map(([name, schema]) => ({
    scope: "/properties/" + name,
    validation_schema: schema,
    writable,
    required: dto.required_scopes.includes("/properties/" + name),
  }));
  return { success: true, data: dto };
}

// Match the producer's runtime projection; never relax the consumer's policy checks.
function projectedRender(value) {
  if (Array.isArray(value)) return value.map(projectedRender);
  if (!value || typeof value !== "object") return value;
  const authored = new Set([
    "calculation",
    "conditions",
    "rules",
    "default",
    "default_value",
    "context_bindings",
    "parameters",
    "reuse_instances",
    "localization",
    "source",
    "navigation",
    "messages",
    "option_messages",
  ]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !authored.has(key))
      .map(([key, child]) => [key, projectedRender(child)]),
  );
}
// Static owned fixture choices only. This does not simulate server policy or calculations.
export function formOptionsFixture(body) {
  let node = body.documents.render_schema;
  for (const token of body.query.node_pointer.split("/").slice(1)) {
    node = node?.[token.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  const domain = ["user", "group"].includes(node?.component);
  const source =
    node?.source ??
    (domain
      ? {
          kind: "domain",
          selector: node.component === "user" ? "users" : "work_groups",
        }
      : {});
  // Owned default selector rows only; this fixture does not simulate backend authorization or dependencies.
  if (
    (!domain && source.kind !== "custom") ||
    Object.keys(source.dependencies ?? {}).length
  )
    return undefined;
  const query = body.query;
  const rows = domain
    ? [{ key: "fixture-reviewer", value: "Review person" }]
    : source.items;
  const options = rows.map((item) => ({
    key: "json:" + JSON.stringify(item.key),
    value: item.value,
  }));
  const filtered = options.filter((item) =>
    query.selected_keys?.length
      ? query.selected_keys.includes(item.key)
      : item.value
          .toLocaleLowerCase()
          .includes((query.search ?? "").toLocaleLowerCase()),
  );
  const total = filtered.length;
  const hash = (value) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  return {
    success: true,
    result: {
      dialect: "bpms.options/1",
      key_encoding: "json-scalar/1",
      state: total ? "READY" : "EMPTY",
      generation: query.generation,
      locale: body.locale ?? "en",
      source_revision: hash(source),
      dependency_fingerprint: hash(query.data),
      dependencies: {},
      page: query.page,
      size: query.size,
      total,
      total_pages: Math.ceil(total / query.size),
      items: filtered.slice(
        (query.page - 1) * query.size,
        query.page * query.size,
      ),
    },
  };
}
