import { fieldLabel as label } from "../src/app/shared/domain/field-label.ts";
import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";
import assert from "node:assert/strict";
const api = JSON.parse(
  await readFile("docs/reference/platform-openapi.json", "utf8"),
);
const schema = (name) => api.components.schemas[name];
const operation = (path, method) => {
  const id = api.paths[path]?.[method]?.operationId;
  assert.ok(id, `${method} ${path}`);
  return id;
};
const resolve = (value, depth = 0) => {
  if (depth > 12 || !value || typeof value !== "object") return value;
  if (value.$ref)
    return resolve(schema(value.$ref.split("/").at(-1)), depth + 1);
  if (Array.isArray(value))
    return value.map((item) => resolve(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, resolve(item, depth + 1)]),
  );
};
const underlying = (value) => {
  value = resolve(value);
  return value.anyOf?.find((v) => v.type !== "null") ?? value;
};
const fields = (name, exclude = []) =>
  Object.entries(schema(name).properties)
    .filter(([key]) => !exclude.includes(key))
    .map(([key, shape]) => {
      const value = underlying(shape);
      return {
        key,
        label: label(key, shape.title),
        type: /password/.test(key)
          ? "password"
          : value.format === "email"
            ? "email"
            : value.type === "array" && value.items?.type === "string"
              ? "strings"
              : ["object", "array"].includes(value.type)
                ? "json"
                : value.type === "boolean"
                  ? "boolean"
                  : ["integer", "number"].includes(value.type)
                    ? "number"
                    : "text",
        schema: resolve(shape),
        ...(value.enum ? { options: value.enum.map(String) } : {}),
        ...(shape.default !== undefined ? { initial: shape.default } : {}),
        required: schema(name).required?.includes(key) ?? false,
        nullable: shape.anyOf?.some((v) => v.type === "null") ?? false,
        ...(value.minLength !== undefined ? { min: value.minLength } : {}),
        ...(value.maxLength !== undefined ? { max: value.maxLength } : {}),
      };
    });
const queryFields = (name, exclude) =>
  Object.entries(schema(name).properties)
    .filter(([key]) => !exclude.includes(key))
    .map(([key, shape]) => {
      const value = underlying(shape);
      return {
        key,
        label: label(key, shape.title),
        type:
          value.format === "uuid"
            ? "uuid"
            : value.format === "date-time"
              ? "datetime"
              : value.format === "date"
                ? "date"
                : value.type === "boolean"
                  ? "boolean"
                  : ["integer", "number"].includes(value.type)
                    ? "number"
                    : "text",
        nullable: shape.anyOf?.some((v) => v.type === "null") ?? false,
      };
    });
const columns = (keys) => keys.map((key) => ({ key, label: label(key) }));
const config = (
  key,
  title,
  path,
  dto,
  cols,
  exclude,
  createDto,
  updateDto,
  permission,
) => ({
  key,
  title,
  description: "Search, open and manage records.",
  permission:
    permission ??
    (key === "audit"
      ? "admin.permissions.manage"
      : key === "reports"
        ? ""
        : key === "history"
          ? "admin.history.read"
          : ["roles", "permissions"].includes(key)
            ? "admin.permissions.manage"
            : "admin.users.manage"),
  columns: columns(cols),
  queryFields: queryFields(dto, exclude),
  extras: [],
  fixed: [],
  fields: updateDto
    ? fields(updateDto, ["ref_id", "password", "is_superuser"])
    : [],
  createFields: createDto ? fields(createDto, ["is_superuser"]) : [],
  operations: {
    search: operation(path + "/search", "post"),
    ...(api.paths[path + "/{ref_id}"]?.get
      ? { get: operation(path + "/{ref_id}", "get") }
      : {}),
    ...(createDto ? { create: operation(path, "post") } : {}),
    ...(updateDto ? { update: operation(path + "/{ref_id}", "put") } : {}),
    ...(api.paths[path + "/{ref_id}"]?.delete
      ? { delete: operation(path + "/{ref_id}", "delete") }
      : {}),
    ...(api.paths[path + "/{ref_id}/history"]
      ? { history: operation(path + "/{ref_id}/history", "post") }
      : {}),
    ...(api.paths[path + "/report"]
      ? { report: operation(path + "/report", "post") }
      : {}),
  },
});
const admin = config(
  "admin-users",
  "Admin Users",
  "/api/v1/admin/users",
  "UserDTO",
  ["username", "email", "first_name", "last_name", "is_active", "created_at"],
  ["ref_id", "is_active"],
  "UserCreateDTO",
  "UserUpdateDTO",
);
admin.userPartition = true;
admin.fixed = [{ field_name: "is_superuser", operation: "equal", value: true }];
admin.operations.restore = operation(
  "/api/v1/admin/users/{ref_id}/restore",
  "post",
);
admin.description = "Manage administrator accounts and their access.";
const users = structuredClone(admin);
users.key = "users";
users.title = "Users";
users.description = "Browse users and manage their account details.";
users.userPartition = false;
users.selector = true;
users.fixed[0].value = false;
users.columns = columns(["value"]);
users.columns[0].label = "Username";
users.extras = [{ key: "include_deleted", label: "Include deleted users" }];
users.operations.search = operation("/api/v1/admin/users/select", "post");
delete users.operations.report;
const roles = config(
  "roles",
  "Roles",
  "/api/v1/admin/roles",
  "RoleDTO",
  ["name", "description", "created_at"],
  ["ref_id", "permissions"],
  "RoleCreateDTO",
  "RoleUpdateDTO",
);
const permissions = config(
  "permissions",
  "Permissions",
  "/api/v1/admin/permissions",
  "PermissionDTO",
  ["name", "description", "created_at"],
  ["ref_id"],
  "PermissionCreateDTO",
  "PermissionUpdateDTO",
);
const audit = config(
  "audit",
  "Audit Events",
  "/api/v1/admin/audit-events",
  "AuthAuditEventDTO",
  ["event_type", "success", "user_id", "ip_address", "created_at"],
  ["ref_id", "details"],
);
const history = {
  key: "history",
  title: "Entity history",
  description: "Review changes to an entity and the actor who made them.",
  permission: "admin.history.read",
  columns: columns([
    "operation",
    "changed_at",
    "modifier_type",
    "modifier_id",
    "reason",
  ]),
  queryFields: queryFields("HistoryRecordDTO", ["from_values", "to_values"]),
  extras: [],
  fixed: [],
  fields: [],
  createFields: [],
  operations: {
    search: operation("/api/v1/admin/history/{entity_name}/search", "post"),
  },
};
const reports = config(
  "reports",
  "My Reports",
  "/api/v1/reports",
  "ReportDTO",
  ["definition_key", "file_name", "status", "created_at", "expires_at"],
  ["ref_id"],
);
reports.description = "Track requested reports and download ready files.";
// Audited against the released backend query allowlists in work_groups, integrations, ai and tasks DTOs.
const groups = config(
  "groups",
  "Work groups",
  "/api/v1/admin/work-groups",
  "WorkGroupDTO",
  ["code", "name", "is_active", "created_at"],
  ["ref_id"],
  "WorkGroupCreateDTO",
  "WorkGroupUpdateDTO",
  "admin.work_groups.manage",
);
const integrations = config(
  "integrations",
  "Integration connections",
  "/api/v1/integration-connections",
  "ConnectionDTO",
  ["code", "name", "provider", "kind", "status", "verification_status"],
  ["ref_id", "non_secret_config"],
  "ConnectionCreateDTO",
  "ConnectionUpdateDTO",
  "integrations.manage",
);
const agents = config(
  "agents",
  "AI agents",
  "/api/v1/ai-agents",
  "AIAgentDTO",
  ["code", "name", "number", "status", "created_at"],
  ["ref_id", "spec", "checksum", "published_at"],
  "AIAgentCreateDTO",
  "AIAgentUpdateDTO",
  "workflows.manage",
);
const taskDefinitions = config(
  "task-definitions",
  "Task definitions",
  "/api/v1/tasks/definitions",
  "TaskDefinitionDTO",
  ["name", "queue", "description", "max_retries"],
  ["ref_id", "retry_for"],
  undefined,
  undefined,
  "admin.tasks.manage",
);
const taskSchedules = config(
  "task-schedules",
  "Task schedules",
  "/api/v1/tasks/schedules",
  "PeriodicTaskDTO",
  ["name", "task_name", "schedule_type", "enabled", "created_at"],
  ["ref_id", "args", "kwargs"],
  "PeriodicTaskCreateDTO",
  "PeriodicTaskUpdateDTO",
  "admin.tasks.manage",
);
const taskExecutions = config(
  "task-executions",
  "Task executions",
  "/api/v1/tasks/executions",
  "TaskExecutionDTO",
  ["task_name", "queue", "status", "retries", "created_at"],
  ["ref_id", "args", "kwargs", "result", "traceback"],
  undefined,
  undefined,
  "admin.tasks.manage",
);
for (const [definition, group, base] of [
  [groups, "groups", "/api/v1/admin/work-groups"],
  [integrations, "integrations", "/api/v1/integration-connections"],
  [agents, "agents", "/api/v1/ai-agents"],
  [taskDefinitions, "tasks", "/api/v1/tasks/definitions"],
  [taskSchedules, "tasks", "/api/v1/tasks/schedules"],
  [taskExecutions, "tasks", "/api/v1/tasks/executions"],
]) {
  definition.adminGroup = group;
  definition.commandBase = base;
  definition.description =
    "Search, open and manage " + definition.title.toLowerCase() + ".";
}
agents.immutableStatuses = ["PUBLISHED", "RETIRED"];
const output = await format(
  JSON.stringify({
    users,
    "admin-users": admin,
    roles,
    permissions,
    audit,
    history,
    reports,
    groups,
    integrations,
    agents,
    "task-definitions": taskDefinitions,
    "task-schedules": taskSchedules,
    "task-executions": taskExecutions,
  }),
  { parser: "json" },
);
const target = "src/app/features/records/infrastructure/record-contracts.json";
if (process.argv.includes("--check"))
  assert.equal(
    await readFile(target, "utf8"),
    output,
    "Regenerate record contracts",
  );
else await writeFile(target, output);
