import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const sources = ["openapi.json", "frontend-readiness-review.md"];
const buffers = await Promise.all(
  sources.map((name) => readFile(`docs/reference/${name}`)),
);
const api = JSON.parse(buffers[0]);
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
const tickets = {
  designer: "STUDIO-07",
  "definition-library": "STUDIO-09",
  clients: "ADMIN-03",
  "client-releases": "ADMIN-03",
  "step-types": "STUDIO-07",
  "form-components": "STUDIO-09",
  "form-component-versions": "STUDIO-09",
  "form-data-types": "STUDIO-09",
  "form-data-type-versions": "STUDIO-09",
  forms: "STUDIO-01, STUDIO-02, STUDIO-03",
  "form-versions": "STUDIO-01, STUDIO-09",
  workflows: "STUDIO-05, STUDIO-08",
  "workflow-versions": "STUDIO-05, STUDIO-06, STUDIO-08",
  "request-types": "BE-03, STUDIO-10",
  "business-requests":
    "REQ-02, REQ-03, REQ-04, REQ-05, FORM-04, FORM-06, FORM-07, FORM-08",
  processes: "PROC-01, ADMIN-07",
  "process-events": "ADMIN-07",
  "work-items":
    "TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, FORM-04, FORM-06, FORM-07",
  "integration-connections": "ADMIN-04",
  "ai-agents": "ADMIN-05, TASK-07",
  notifications: "OPS-01",
  auth: "AUTH-01, AUTH-02, AUTH-04",
  sessions: "AUTH-04",
  permissions: "AUTH-03, ADMIN-01",
  users: "ADMIN-01",
  roles: "ADMIN-01",
  "work-groups": "ADMIN-02",
  "audit-events": "ADMIN-08",
  files: "API-04, OPS-03",
  images: "API-04, OPS-03",
  reports: "OPS-02",
  "task-definitions": "ADMIN-06",
  "task-schedules": "ADMIN-06",
  "task-executions": "ADMIN-06",
  history: "OPS-03",
  health: "ADMIN-08",
};
const operations = Object.entries(api.paths).flatMap(([path, item]) =>
  Object.entries(item)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({
      path,
      method: method.toUpperCase(),
      ...operation,
    })),
);
const tags = [...new Set(operations.flatMap((op) => op.tags ?? []))].sort();
for (const tag of tags)
  if (!tickets[tag]) throw new Error(`Unmapped API area: ${tag}`);
const backlog = await readFile("docs/BACKLOG.md", "utf8");
for (const id of new Set(
  Object.values(tickets).flatMap((value) => value.split(", ")),
)) {
  if (!backlog.includes(`### ${id} `))
    throw new Error(`Missing backlog ticket: ${id}`);
}
const manifest = {
  suppliedDate: "2026-10-02",
  backendReviewCommit: "8921841a866c190d794f41af7a41389400fea26b",
  openapiBackendCommit: null,
  openapiVersion: api.openapi,
  apiVersion: api.info.version,
  operationCount: operations.length,
  schemaCount: Object.keys(api.components.schemas).length,
  sources: sources.map((name, index) => ({
    file: name,
    sha256: createHash("sha256").update(buffers[index]).digest("hex"),
  })),
};
const lines = [
  "# API operation inventory",
  "",
  "Generated from the supplied [OpenAPI snapshot](reference/openapi.json) with `npm run api:inventory`. Do not edit by hand.",
  "",
  `Snapshot: ${operations.length} operations, ${manifest.schemaCount} schemas. Source hashes are in [manifest.json](reference/manifest.json).`,
  "",
  "Ticket mappings identify responsible delivery areas, not verified live behavior. Missing contracts BE-04–BE-09 are proposals and are not added to this inventory. Shared API/auth/error/history/report adapters apply across areas. Root health/internal routes are deployment surfaces, not ordinary user screens.",
  "",
  "| API area | Operations | Backlog coverage |",
  "| --- | ---: | --- |",
  ...tags.map(
    (tag) =>
      `| ${tag} | ${operations.filter((op) => op.tags?.includes(tag)).length} | ${tickets[tag]} |`,
  ),
];
for (const tag of tags) {
  lines.push(
    "",
    `## ${tag}`,
    "",
    `Backlog: ${tickets[tag]}.`,
    "",
    "| Method | Exact path | Operation ID |",
    "| --- | --- | --- |",
  );
  for (const op of operations.filter((op) => op.tags?.includes(tag))) {
    lines.push(
      `| ${op.method} | \`${op.path}\` | \`${op.operationId ?? "(none)"}\` |`,
    );
  }
}
const outputs = {
  "docs/reference/manifest.json": JSON.stringify(manifest, null, 2) + "\n",
  "docs/API-INVENTORY.md": lines.join("\n") + "\n",
};
for (const [path, content] of Object.entries(outputs)) {
  if (process.argv.includes("--check")) {
    if ((await readFile(path, "utf8")) !== content)
      throw new Error(`Inventory drift: ${path}`);
  } else {
    await writeFile(path, content);
  }
}
console.log(
  `Verified ${operations.length} operations across ${tags.length} API areas.`,
);
