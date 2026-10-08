import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
const api = JSON.parse(
  await readFile("docs/reference/platform-openapi.json", "utf8"),
);
const groups = {
  users: ["Users", "/api/v1/admin/users", "admin.users.manage"],
  roles: ["Roles", "/api/v1/admin/roles", "admin.permissions.manage"],
  permissions: [
    "Permissions",
    "/api/v1/admin/permissions",
    "admin.permissions.manage",
  ],
  groups: [
    "Work groups",
    "/api/v1/admin/work-groups",
    "admin.work_groups.manage",
  ],
  integrations: [
    "Integration connections",
    "/api/v1/integration-connections",
    "integrations.manage",
  ],
  agents: ["AI agents", "/api/v1/ai-agents", "workflows.manage"],
  tasks: ["Background tasks", "/api/v1/tasks", "admin.tasks.manage"],
  processes: ["Process controls", "/api/v1/processes", "requests.start"],
  audit: [
    "Audit events",
    "/api/v1/admin/audit-events",
    "admin.permissions.manage",
  ],
  history: ["Entity history", "/api/v1/admin/history", "admin.history.read"],
};
function expand(value, depth = 0, seen = []) {
  if (!value || typeof value !== "object" || depth > 8) return value;
  if (value.$ref) {
    const name = value.$ref.split("/").at(-1);
    if (seen.includes(name))
      return {
        type: "object",
        description: "Recursive schema; validated by server",
      };
    return expand(api.components.schemas[name], depth + 1, [...seen, name]);
  }
  if (Array.isArray(value))
    return value.map((item) => expand(item, depth + 1, seen));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      expand(item, depth + 1, seen),
    ]),
  );
}
const output = {};
for (const [group, [title, base, defaultPermission]] of Object.entries(
  groups,
)) {
  const commands = [];
  for (const [path, methods] of Object.entries(api.paths)) {
    if (path !== base && !path.startsWith(base + "/")) continue;
    if (path.includes("/tool-approval")) continue; // Owned by reviewer screens.
    for (const [method, op] of Object.entries(methods)) {
      if (!["get", "post", "put", "delete", "patch"].includes(method)) continue;
      const suffix = path.slice(base.length);
      let permission = defaultPermission;
      if (group === "users" && suffix.endsWith("/roles"))
        permission = "admin.permissions.manage";
      if (group === "integrations" && suffix === "/select")
        permission = "workflows.manage";
      if (group === "agents" && suffix.includes("/processes/"))
        permission = "requests.start";
      if (group === "processes" && suffix.endsWith("/recover"))
        permission = "processes.recover";
      const read =
        method === "get" ||
        /\/(search|select|history|suggestions|timeline)$/.test(suffix);
      const body = expand(
        op.requestBody?.content?.["application/json"]?.schema,
      );
      const parameters = op.parameters ?? [];
      const fields = (location) => ({
        required: parameters
          .filter((p) => p.in === location && p.required)
          .map((p) => p.name),
        properties: Object.fromEntries(
          parameters
            .filter((p) => p.in === location)
            .map((p) => [
              p.name,
              {
                ...expand(p.schema),
                title: p.name.replaceAll("_", " "),
                description: p.description ?? "",
              },
            ]),
        ),
      });
      commands.push({
        id: op.operationId,
        title: op.summary ?? method + " " + (suffix || "create"),
        permission,
        mutation: !read,
        method,
        path,
        bodyRequired: op.requestBody?.required ?? false,
        schemas: {
          body: {
            required: body?.required ?? [],
            properties: body?.properties ?? {},
          },
          path: fields("path"),
          query: fields("query"),
        },
      });
    }
  }
  output[group] = { title, commands };
}
const destination =
  "src/app/features/administration/infrastructure/admin-contracts.json";
const text = await format(JSON.stringify(output), { parser: "json" });
if (process.argv.includes("--check"))
  assert.equal(
    await readFile(destination, "utf8"),
    text,
    "Regenerate administration contracts",
  );
else await writeFile(destination, text);
console.log(
  `Verified ${Object.keys(output).length} administration groups and ${Object.values(output).reduce((n, g) => n + g.commands.length, 0)} commands.`,
);
