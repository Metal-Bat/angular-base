import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
import ts from "typescript";

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? walk(`${directory}/${entry.name}`)
        : [`${directory}/${entry.name}`],
    ),
  );
  return nested.flat().sort();
}
const files = (await walk("src/app")).filter(
  (p) => /\.(ts|html|json)$/.test(p) && !p.includes("/generated/"),
);
const contents = new Map(
  await Promise.all(files.map(async (p) => [p, await readFile(p, "utf8")])),
);
const apiBytes = await readFile("docs/reference/platform-openapi.json");
const api = JSON.parse(apiBytes);
const generation = JSON.parse(
  await readFile("docs/reference/client-generation.json", "utf8"),
);
const hash = createHash("sha256").update(apiBytes).digest("hex");
if (generation.sha256 !== hash)
  throw Error("Client/OpenAPI provenance mismatch");
const contracts = JSON.parse(
  await readFile(
    "src/app/features/administration/infrastructure/admin-contracts.json",
    "utf8",
  ),
);
const adminCommands = Object.values(contracts).flatMap(
  (group) => group.commands,
);
const groups = {
  auth: [
    "Account/session",
    "APP-FE-005",
    "AUTH-01–04",
    "authenticated user",
    "src/app/core/auth/account/account.html",
  ],
  sessions: [
    "Account sessions",
    "APP-FE-036",
    "AUTH-04",
    "authenticated user",
    "src/app/core/auth/account/account.html",
  ],
  "business-requests": [
    "Requester workspace",
    "APP-FE-028",
    "REQ-01–05",
    "requester",
    "src/app/features/operations/presentation/case-detail/case-detail.html",
  ],
  "work-items": [
    "Reviewer workspace",
    "APP-FE-029",
    "TASK-01–07",
    "reviewer",
    "src/app/features/operations/presentation/case-detail/case-detail.html",
  ],
  notifications: [
    "Notifications",
    "APP-FE-012",
    "OPS-01",
    "authenticated user",
    "src/app/features/operations/presentation/personal-services/personal-services.html",
  ],
  processes: [
    "Process tracking/controls",
    "APP-FE-032",
    "PROC-01–02, ADMIN-07",
    "requester/operator",
    "src/app/features/administration/presentation/process-controls/process-controls.html",
  ],
  "process-events": [
    "Process controls",
    "APP-FE-032",
    "ADMIN-07",
    "operator",
    "src/app/features/administration/presentation/process-controls/process-controls.html",
  ],
  designer: [
    "Workflow authoring",
    "APP-FE-021",
    "STUDIO-07",
    "workflow author",
    "src/app/features/studio/presentation/workflow-board/workflow-board.html",
  ],
  "definition-library": [
    "Reusable library",
    "APP-FE-027",
    "STUDIO-09",
    "author",
    "src/app/features/studio/presentation/library-tools/library-tools.html",
  ],
  "integration-connections": [
    "Integrations",
    "APP-FE-030",
    "ADMIN-04",
    "integration manager",
    "src/app/features/records/presentation/resource-page.html",
  ],
  "ai-agents": [
    "AI agents",
    "APP-FE-030",
    "ADMIN-05",
    "AI manager",
    "src/app/features/records/presentation/resource-page.html",
  ],
  files: [
    "Private media",
    "APP-FE-036",
    "API-04, OPS-03",
    "authorized user",
    "src/app/features/operations/presentation/generic-media/generic-media.html",
  ],
  images: [
    "Private media",
    "APP-FE-036",
    "API-04, OPS-03",
    "authorized user",
    "src/app/features/operations/presentation/generic-media/generic-media.html",
  ],
  reports: [
    "Personal reports",
    "APP-FE-032",
    "OPS-02",
    "authorized user",
    "src/app/features/records/presentation/resource-page.html",
  ],
  history: [
    "History",
    "APP-FE-032",
    "OPS-03",
    "authorized user",
    "src/app/features/records/presentation/resource-page.html",
  ],
  "audit-events": [
    "Audit",
    "APP-FE-032",
    "ADMIN-08",
    "auditor",
    "src/app/features/records/presentation/resource-page.html",
  ],
};
for (const tag of [
  "forms",
  "form-versions",
  "form-components",
  "form-component-versions",
  "form-data-types",
  "form-data-type-versions",
  "workflows",
  "workflow-versions",
  "clients",
  "client-releases",
  "request-types",
  "step-types",
]) {
  groups[tag] = [
    "Studio catalog/editor",
    tag.startsWith("form")
      ? "APP-FE-016"
      : tag === "request-types" || tag.startsWith("client")
        ? "APP-FE-031"
        : "APP-FE-021",
    "STUDIO-01–10",
    "author",
    "src/app/features/studio/presentation/resource-catalog/resource-catalog.html",
  ];
}
for (const tag of ["users", "roles", "permissions", "work-groups"])
  groups[tag] = [
    "Identity administration",
    "APP-FE-031",
    "ADMIN-01–02",
    "administrator",
    "src/app/features/records/presentation/resource-page.html",
  ];
for (const tag of ["task-definitions", "task-schedules", "task-executions"])
  groups[tag] = [
    "Background operations",
    "APP-FE-032",
    "ADMIN-06",
    "operator",
    "src/app/features/records/presentation/resource-page.html",
  ];
groups.health = [
  "Health/readiness",
  "APP-FE-037",
  "QA-07",
  "deployment operator",
  null,
];
const methods = new Set([
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
]);
const operations = [];
for (const [path, item] of Object.entries(api.paths))
  for (const [method, op] of Object.entries(item)) {
    if (!methods.has(method)) continue;
    const tag = op.tags?.[0] ?? "health";
    const group = groups[tag];
    if (!group) throw Error(`Unmapped API area ${tag}`);
    const [screen, owner, legacy, persona, template] = group;
    const consumers = [...contents]
      .filter(
        ([p, text]) => !p.endsWith(".spec.ts") && text.includes(op.operationId),
      )
      .map(([p]) => p);
    const tests = [...contents]
      .filter(
        ([p, text]) => p.endsWith(".spec.ts") && text.includes(op.operationId),
      )
      .map(([p]) => p);
    const admin = adminCommands.find((c) => c.id === op.operationId);
    const boundary =
      tag === "auth" && /\/(login|refresh|logout|token)$/.test(path);
    const disposition =
      tag === "health" ? "internal" : boundary ? "server-boundary" : "normal";
    const response = Object.entries(op.responses)
      .filter(([status]) => /^2\d\d$/.test(status))
      .map(([status, value]) => ({ status, content: value.content ?? {} }));
    operations.push({
      id: op.operationId,
      method: method.toUpperCase(),
      path,
      area: tag,
      persona,
      screen,
      owner,
      legacy,
      disposition,
      delta:
        consumers.length || admin
          ? "EXTEND"
          : tag === "health" || boundary
            ? "VERIFY"
            : "NEW",
      template,
      consumers,
      tests,
      permission:
        admin?.permission ??
        "Peer handoff required; see operation description and route guard",
      input: op.requestBody?.content ?? null,
      parameters: op.parameters ?? [],
      output: response,
      states: [
        "loading",
        "empty",
        "invalid",
        "forbidden/revoked",
        "stale/conflict",
        "uncertain",
        "failed",
        "success",
      ],
      evidence: "NOT_RUN_INTEGRATED",
      description: op.description ?? "",
      editor:
        disposition === "normal"
          ? "Current domain controls; nested JSON gaps tracked in json-ui-register.md"
          : disposition,
    });
  }
if (
  operations.length !== generation.operationCount ||
  new Set(operations.map((o) => o.id)).size !== operations.length
)
  throw Error("Operation coverage mismatch");
const ownerFor = (p) => {
  if (p.includes("/form-builder/")) return "APP-FE-016";
  if (p.includes("/workflow-diagnostics")) return "APP-FE-026";
  if (p.includes("/workflow-board/")) return "APP-FE-021";
  if (p.includes("/library-tools/")) return "APP-FE-027";
  if (p.includes("/resource-catalog/")) return "APP-FE-027";
  if (p.includes("/studio/")) return "APP-FE-020";
  if (p.includes("/reference-picker/")) return "APP-FE-006";
  if (p.includes("/schema-input/") || p.includes("/records/"))
    return "APP-FE-007";
  if (p.includes("/admin-console/")) return "APP-FE-030";
  if (p.includes("/administration/")) return "APP-FE-032";
  if (p.includes("/forms/")) return "APP-FE-017";
  if (p.includes("/personal-services/")) return "APP-FE-012";
  if (p.includes("/task-inbox/") || p.includes("/case-detail/"))
    return "APP-FE-029";
  if (p.includes("/operations/")) return "APP-FE-028";
  if (p.includes("/auth/profile/")) return "APP-FE-008";
  if (p.includes("/auth/")) return "APP-FE-005";
  return "APP-FE-004";
};
const jsonPanels = [];
const screens = [];
for (const [path, text] of contents) {
  let template = text;
  if (!path.endsWith(".html")) {
    if (!path.endsWith(".ts") || path.endsWith(".spec.ts")) continue;
    const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
    const ranges = [];
    const visit = (node) => {
      if (
        ts.isPropertyAssignment(node) &&
        node.name.getText(ast) === "template" &&
        (ts.isNoSubstitutionTemplateLiteral(node.initializer) ||
          ts.isStringLiteral(node.initializer))
      ) {
        ranges.push({
          start: node.initializer.getStart(ast),
          end: node.initializer.end,
        });
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
    if (!ranges.length) continue;
    template = text
      .split("")
      .map((char, index) =>
        ranges.some((range) => index >= range.start && index < range.end)
          ? char
          : char === "\n"
            ? "\n"
            : " ",
      )
      .join("");
  }
  const lines = template.split("\n");
  const controls = [
    ...new Set(
      (
        template.match(
          /<(?:p-[\w-]+|mat-[\w-]+|app-[\w-]+|input|textarea|select|dialog|button)\b/g,
        ) ?? []
      ).map((s) => s.slice(1)),
    ),
  ].sort();
  screens.push({
    path,
    owner: ownerFor(path),
    delta: /json|<textarea|<pre\b/i.test(template) ? "EXTEND" : "REUSE",
    controls,
    disposition:
      "PrimeNG-first for touched business UI; retain canonical native controls, native confirmation, Material showcase and Foblex adapter",
  });
  lines.forEach((line, i) => {
    if (/json|<textarea|<pre\b|diagnostics\(/i.test(line))
      jsonPanels.push({
        path,
        line: i + 1,
        owner: ownerFor(path),
        source: line.trim(),
        disposition: "REPLACE_NORMAL",
        replacement: path.includes("workflow")
          ? "Typed node/mapping inspectors"
          : path.includes("form-builder")
            ? "Typed form/validation/behavior inspectors"
            : "Typed domain fields and record summaries",
      });
  });
}
const routes = [...contents]
  .filter(([p]) => p.endsWith(".routes.ts") || p.endsWith("/preview-routes.ts"))
  .map(([path, text]) => ({
    path,
    sha256: createHash("sha256").update(text).digest("hex"),
  }));
const inventory = {
  schemaVersion: 1,
  source: "docs/reference/platform-openapi.json",
  sha256: hash,
  peerHandoff:
    "APP-BE-001 consumed; producer hashes and exact paths/schemas verified by check-peer-contract.mjs; live HTTP separate",
  operations,
  screens,
  jsonPanels,
  routes,
};
const outputs = {
  "docs/delivery/api-ui-coverage.json":
    JSON.stringify(inventory, null, 2) + "\n",
  "docs/delivery/api-ui-coverage.md":
    [
      "# API/UI coverage",
      "",
      `Source: ${operations.length} operations; SHA256 \`${hash}\`. Regenerate with \`npm run delivery:inventory\`.`,
      "",
      "This is a source inventory, not proof of integration. The APP-BE-001 producer handoff is consumed and hash checked. Live HTTP evidence is recorded separately. Every operation has an owner; no ordinary business operation is excluded. The companion JSON contains exact input/output schemas, parameters, discovered consumers, direct operation test references, and state requirements. An empty tests array means no direct operation-ID test was found, not that no feature tests exist. Screen assignments identify the owning area; they do not assert that every action already has purposeful UI.",
      "",
      "| Operation | Method/path | Persona/screen | Owner | Disposition/delta |",
      "|---|---|---|---|---|",
      ...operations.map(
        (o) =>
          `| ${o.id} | ${o.method} ${o.path} | ${o.persona}: ${o.screen} | ${o.owner} (${o.legacy}) | ${o.disposition} / ${o.delta} |`,
      ),
    ].join("\n") + "\n",
  "docs/delivery/json-ui-register.md":
    [
      "# JSON UI removal register",
      "",
      "Generated source matches, including labels and advanced preview controls; review context before removal. All matches retain a domain owner. No expert exception is assumed approved. Typed replacements belong to later tasks; intake does not remove functioning authoring capabilities.",
      "",
      "| Template | Line | Owner | Replacement | Source |",
      "|---|---:|---|---|---|",
      ...jsonPanels.map(
        (o) =>
          `| ${o.path} | ${o.line} | ${o.owner} | ${o.replacement} | ${o.source.replaceAll("|", " / ").replaceAll("`", "")} |`,
      ),
    ].join("\n") + "\n",
  "docs/delivery/screen-patterns.md":
    [
      "# Screen and control register",
      "",
      "Generated from all current Angular external and static inline templates. PrimeNG-first applies to new or redesigned ordinary business UI. Retained exceptions: native exact-decimal/file/date controls preserve canonical values; native dialog provides confirmation; Material remains in the compatibility showcase; Foblex stays in its canvas adapter. Domain tickets own conversions of existing controls and JSON inspectors.",
      "",
      "| Template | Owner | Current controls | Disposition |",
      "|---|---|---|---|",
      ...screens.map(
        (o) =>
          `| ${o.path} | ${o.owner} | ${o.controls.join(", ")} | ${o.delta}: ${o.disposition} |`,
      ),
    ].join("\n") + "\n",
};
for (const [path, raw] of Object.entries(outputs)) {
  const output = await format(raw, { filepath: path });
  if (process.argv.includes("--check")) {
    if ((await readFile(path, "utf8")) !== output)
      throw Error(`Delivery inventory drift: ${path}`);
  } else await writeFile(path, output);
}
console.log(
  `Verified delivery inventory: ${operations.length} operations, ${screens.length} templates, ${jsonPanels.length} JSON matches, ${routes.length} route manifests.`,
);
