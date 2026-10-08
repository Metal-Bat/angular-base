import { fieldLabel as label } from "../src/app/shared/domain/field-label.ts";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
const api = JSON.parse(
  await readFile("docs/reference/platform-openapi.json", "utf8"),
);
const names = {
  forms: "Forms",
  "form-versions": "Form versions",
  workflows: "Workflows",
  "workflow-versions": "Workflow versions",
  clients: "Clients",
  "client-releases": "Client releases",
  "request-types": "Request types",
  "form-components": "Reusable components",
  "form-component-versions": "Component versions",
  "form-data-types": "Reusable data types",
  "form-data-type-versions": "Data type versions",
};
const listDtos = {
  forms: "FormDTO",
  "form-versions": "FormVersionDTO",
  workflows: "WorkflowDTO",
  "workflow-versions": "WorkflowVersionDTO",
  clients: "ClientDTO",
  "client-releases": "ClientReleaseDTO",
  "request-types": "RequestTypeDTO",
  "form-components": "LibraryDTO",
  "form-component-versions": "LibraryVersionDTO",
  "form-data-types": "LibraryDTO",
  "form-data-type-versions": "LibraryVersionDTO",
};
// Query fields are audited against backend __query_fields__, not inferred from all response fields.
const queryAllowlist = {
  "form-versions": ["number", "status"],
  "workflow-versions": ["number", "status", "default_priority"],
  "client-releases": ["release_version", "api_version", "is_enabled"],
  "form-components": ["code", "name", "is_active"],
  "form-data-types": ["code", "name", "is_active"],
  "form-component-versions": ["number", "status"],
  "form-data-type-versions": ["number", "status"],
};
function listMetadata(key) {
  const properties = api.components.schemas[listDtos[key]].properties;
  const allowed =
    queryAllowlist[key] ??
    Object.keys(properties).filter(
      (name) =>
        ![
          "ref_id",
          "confidential",
          ...(key === "request-types"
            ? ["workflow_ref_id", "form_ref_id"]
            : []),
        ].includes(name),
    );
  const queryFields = allowed.flatMap((name) => {
    const raw = properties[name] ?? { type: "string" };
    const shape = raw.anyOf?.find((v) => v.type !== "null") ?? raw;
    if (!["string", "integer", "number", "boolean"].includes(shape.type))
      return [];
    return [
      {
        key: name,
        label: label(name, raw.title),
        type:
          shape.format === "date-time"
            ? "datetime"
            : shape.type === "boolean"
              ? "boolean"
              : ["integer", "number"].includes(shape.type)
                ? "number"
                : "text",
        nullable: raw.anyOf?.some((v) => v.type === "null") ?? false,
      },
    ];
  });
  const keys = [
    "code",
    "name",
    "number",
    "version",
    "status",
    "kind",
    "platform",
    "access_mode",
    "default_priority",
    "is_active",
    "is_enabled",
    "created_at",
  ].filter((name) => name in properties);
  return {
    queryFields,
    columns: keys.map((name) => ({ key: name, label: label(name) })),
  };
}
const resources = {};
for (const [key, title] of Object.entries(names)) {
  const base = "/api/v1/" + key;
  const operations = {};
  const schemas = {};
  for (const [action, method, suffix] of [
    ["search", "post", "/search"],
    ["get", "get", "/{ref_id}"],
    ["create", "post", ""],
    ["update", "put", "/{ref_id}"],
    ["remove", "delete", "/{ref_id}"],
    ["history", "post", "/{ref_id}/history"],
    ["report", "post", "/report"],
    ["select", "post", "/select"],
    ["publish", "post", "/{ref_id}/publish"],
    ["retire", "post", "/{ref_id}/retire"],
    ["disable", "post", "/{ref_id}/disable"],
    ["rotate", "post", "/{ref_id}/rotate-secret"],
    ["grants", "post", "/{ref_id}/grants/search"],
    ["grant", "post", "/{ref_id}/grants"],
    ["revoke", "delete", "/{ref_id}/grants/{grant_ref_id}"],
  ]) {
    const operation = api.paths[base + suffix]?.[method];
    if (!operation) continue;
    operations[action] = operation.operationId;
    let shape = operation.requestBody?.content?.["application/json"]?.schema;
    while (shape?.$ref)
      shape = api.components.schemas[shape.$ref.split("/").at(-1)];
    if (
      shape &&
      ["create", "update", "search", "grant", "select"].includes(action)
    )
      schemas[action] = {
        required: shape.required ?? [],
        properties: shape.properties ?? {},
      };
  }
  resources[key] = {
    title,
    list: listMetadata(key),
    permission: key.startsWith("workflow")
      ? "workflows.manage"
      : key === "request-types"
        ? "requests.manage"
        : "forms.manage",
    operations,
    schemas,
    editor:
      key === "form-versions"
        ? "form"
        : key === "workflow-versions"
          ? "workflow"
          : null,
  };
}
const target = "src/app/features/studio/infrastructure/resource-contracts.json";
const output = await format(JSON.stringify(resources), { parser: "json" });
if (process.argv.includes("--check"))
  assert.equal(
    await readFile(target, "utf8"),
    output,
    "Regenerate studio contracts with npm run api:generate",
  );
else await writeFile(target, output);
console.log(
  "Verified studio resource contracts for " +
    Object.keys(resources).length +
    " catalogs.",
);
