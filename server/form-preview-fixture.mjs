import { runtimeFixture } from "../src/app/features/forms/testing/runtime-fixtures.ts";

// Local browser fixture only: the real backend owns policy and behavior evaluation.
export function formPreviewFixture(body) {
  const dto = runtimeFixture("REQUEST");
  const properties = body.documents.data_schema.properties ?? {};
  const scopes = Object.keys(properties).map((name) => "/properties/" + name);
  const writable = ["edit", "correction"].includes(body.purpose);
  dto.data = { ...body.data };
  dto.render_schema = body.documents.render_schema;
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
