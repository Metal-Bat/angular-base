import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile("docs/reference/platform-manifest.json", "utf8"),
);
for (const source of manifest.sources) {
  const value = await readFile(`docs/reference/${source.file}`);
  assert.equal(
    createHash("sha256").update(value).digest("hex"),
    source.sha256,
    `Changed platform evidence: ${source.file}`,
  );
}
const api = JSON.parse(
  await readFile("docs/reference/platform-openapi.json", "utf8"),
);
const baseline = JSON.parse(
  await readFile("docs/reference/openapi.json", "utf8"),
);
const methods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
]);
const operations = Object.values(api.paths).flatMap((item) =>
  Object.keys(item).filter((method) => methods.has(method)),
);
assert.equal(operations.length, manifest.operationCount);
assert.equal(Object.keys(api.components.schemas).length, manifest.schemaCount);
for (const [path, item] of Object.entries(baseline.paths)) {
  for (const [method, operation] of Object.entries(item)) {
    if (methods.has(method))
      assert.equal(
        api.paths[path]?.[method]?.operationId,
        operation.operationId,
        `Changed operation ID: ${method} ${path}`,
      );
  }
}
for (const [path, method] of [
  ["/api/v1/business-requests/{ref_id}/view", "get"],
  ["/api/v1/work-items/{ref_id}/runtime", "get"],
  ["/api/v1/request-types/eligible/search", "post"],
  ["/api/v1/workflows/{ref_id}/grants/search", "post"],
  ["/api/v1/integration-connections/{ref_id}/grants/search", "post"],
  ["/api/v1/workflow-versions/{ref_id}/workspace", "get"],
  ["/api/v1/workflow-versions/{ref_id}/workspace", "put"],
  ["/api/v1/workflow-versions/{ref_id}/workspace/promote", "post"],
  ["/api/v1/workflow-versions/{ref_id}/workspace/history", "post"],
  ["/api/v1/forms/runtime-preview", "post"],
]) {
  const operation = api.paths[path]?.[method];
  assert.ok(
    operation?.security?.length,
    `Missing authenticated operation: ${path}`,
  );
  assert.equal(
    operation.responses["200"].headers["Cache-Control"].schema.const,
    "private, no-store",
  );
}
function checkRefs(value) {
  if (Array.isArray(value)) {
    value.forEach(checkRefs);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (value.$ref?.startsWith("#/")) {
    const target = value.$ref
      .slice(2)
      .split("/")
      .reduce(
        (node, key) => node?.[key.replaceAll("~1", "/").replaceAll("~0", "~")],
        api,
      );
    assert.ok(target, `Unresolved reference: ${value.$ref}`);
  }
  Object.values(value).forEach(checkRefs);
}
checkRefs(api);
console.log(
  `Verified platform evidence: ${manifest.operationCount} operations, ${manifest.schemaCount} schemas, ten authenticated additions, stable baseline operation IDs and resolved references.`,
);
