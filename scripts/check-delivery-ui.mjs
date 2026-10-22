import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";

async function walk(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
      ),
    )
  ).flat();
}
export async function checkDeliveryUi(root = ".") {
  const read = (p) => readFile(`${root}/${p}`, "utf8");
  const keys = new Set();
  for (const path of [
    "src/app/core/localization/messages.ts",
    "src/app/core/localization/personal-messages.ts",
    "src/app/core/localization/crud-messages.ts",
    "src/app/core/localization/authoring-messages.ts",
    "src/app/core/localization/temporal-messages.ts",
  ]) {
    const ast = ts.createSourceFile(
      path,
      await read(path),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node) => {
      if (
        ts.isPropertyAssignment(node) &&
        node.name &&
        (ts.isStringLiteral(node.name) || ts.isIdentifier(node.name))
      ) {
        if (
          ts.isStringLiteral(node.initializer) &&
          !node.initializer.text.trim()
        )
          throw Error(`Empty translation: ${node.name.text}`);
        keys.add(node.name.text);
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  for (const name of [
    "agent-messages",
    "workspace-repair-messages",
    "form-authoring-messages",
    "workflow-authoring-messages",
  ]) {
    const messages = JSON.parse(
      await read(`src/app/core/localization/${name}.json`),
    );
    for (const [key, value] of Object.entries(messages)) {
      if (typeof value !== "string" || !value.trim())
        throw Error(`Empty translation: ${key}`);
      keys.add(key);
    }
  }
  const arabicMessages = JSON.parse(
    await read("src/app/core/localization/arabic-messages.json"),
  );
  const arabicKeys = new Set();
  for (const [key, value] of Object.entries(arabicMessages)) {
    if (typeof value !== "string" || !value.trim())
      throw Error(`Empty Arabic translation: ${key}`);
    arabicKeys.add(key);
  }
  const fields = JSON.parse(
    await read("src/app/shared/domain/field-labels.json"),
  );
  for (const value of Object.values(fields)) {
    if (!value.fa?.trim())
      throw Error(`Missing field translation: ${value.label}`);
    if (!value.ar?.trim())
      throw Error(`Missing Arabic field translation: ${value.label}`);
    keys.add(value.label);
    arabicKeys.add(value.label);
  }
  const templates = (
    await Promise.all([
      walk(`${root}/src/app/shared/ui`),
      walk(`${root}/src/app/core/layout/workspace-preferences`),
      walk(`${root}/src/app/core/auth/profile`),
      walk(`${root}/src/app/features/support`),
      walk(
        `${root}/src/app/features/administration/presentation/process-controls`,
      ),
      walk(`${root}/src/app/features/readiness`),
      walk(`${root}/src/app/features/records/presentation/favorites`),
      ...[
        "agent-fields",
        "agent-detail",
        "agent-decision",
        "agent-decision-summary",
        "agent-policy",
        "agent-capabilities",
      ].map((dir) =>
        walk(`${root}/src/app/features/records/presentation/${dir}`),
      ),
      walk(`${root}/src/app/features/operations/presentation/case-list`),
      ...[
        "case-detail",
        "case-page-header",
        "case-summary",
        "case-history",
        "request-actions",
        "task-controls",
        "process-entry",
      ].map((dir) =>
        walk(`${root}/src/app/features/operations/presentation/${dir}`),
      ),
      walk(`${root}/src/app/features/help`),
      walk(`${root}/src/app/features/calendar`),
      walk(`${root}/src/app/features/analytics`),
      walk(
        `${root}/src/app/features/administration/presentation/permission-choices`,
      ),
      walk(`${root}/src/app/features/operations/presentation/execution-path`),
      ...[
        "form-builder",
        "form-inspector",
        "form-behavior",
        "form-choice-rows",
        "form-live-preview",
        "form-settings",
        "workflow-board",
        "node-inspector",
        "node-details",
        "studio-choice",
        "graph-connections",
        "workflow-editor-pane",
        "subprocess-pin",
        "publication-review",
      ].map((dir) =>
        walk(`${root}/src/app/features/studio/presentation/${dir}`),
      ),
      walk(`${root}/src/app/features/studio/infrastructure/workflow-canvas`),
    ])
  )
    .flat()
    .filter((p) => p.endsWith(".html"));
  let total = 0;
  const missing = new Set();
  for (const path of templates) {
    const text = await readFile(path, "utf8");
    for (const match of text.matchAll(
      /(['"])([^'"\n]+)\1\s*\|\s*localize\b/g,
    )) {
      total++;
      if (!keys.has(match[2]))
        missing.add(`Missing Persian translation: ${match[2]} in ${path}`);
      if (!arabicKeys.has(match[2]))
        missing.add(`Missing Arabic translation: ${match[2]} in ${path}`);
    }
  }
  for (const path of [
    "src/app/core/layout/app-shell.ts",
    "src/app/features/operations/presentation/operations-home.ts",
    "src/app/features/studio/presentation/studio-home.ts",
    "src/app/features/administration/presentation/administration-home.ts",
  ]) {
    const ast = ts.createSourceFile(
      path,
      await read(path),
      ts.ScriptTarget.Latest,
      true,
    );
    const visit = (node) => {
      if (
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        ["label", "title", "description"].includes(node.name.text) &&
        ts.isStringLiteral(node.initializer)
      ) {
        const text = node.initializer.text;
        total++;
        if (!keys.has(text))
          missing.add(
            `Missing Persian navigation translation: ${text} in ${path}`,
          );
        if (!arabicKeys.has(text))
          missing.add(
            `Missing Arabic navigation translation: ${text} in ${path}`,
          );
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  if (missing.size) throw Error([...missing].join("\n"));
  const preview = await read(
    "src/app/core/development/preview-routes.production.ts",
  );
  if (!/previewRoutes:\s*Routes\s*=\s*\[\]/.test(preview))
    throw Error("Development showcase leaked into production");
  const runtimePreview = await read(
    "src/app/features/operations/presentation/runtime-preview.routes.production.ts",
  );
  if (!/runtimePreviewRoutes:\s*Routes\s*=\s*\[\]/.test(runtimePreview))
    throw Error("Development calendar fixtures leaked into production");
  console.log(
    `Verified ${total} shared UI translation uses and production preview isolation. Help/calendar templates and both preview route replacements are checked.`,
  );
}
if (process.argv[1]?.endsWith("/check-delivery-ui.mjs"))
  await checkDeliveryUi();
