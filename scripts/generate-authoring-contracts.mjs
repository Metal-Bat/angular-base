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
