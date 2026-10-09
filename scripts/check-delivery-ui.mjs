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
    "src/app/core/localization/crud-messages.ts",
    "src/app/core/localization/authoring-messages.ts",
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
  const fields = JSON.parse(
    await read("src/app/shared/domain/field-labels.json"),
  );
  for (const value of Object.values(fields)) {
    if (!value.fa?.trim())
      throw Error(`Missing field translation: ${value.label}`);
    keys.add(value.label);
  }
  const templates = (
    await Promise.all([
      walk(`${root}/src/app/shared/ui`),
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
  for (const path of templates) {
    const text = await readFile(path, "utf8");
    for (const match of text.matchAll(
      /(['"])([^'"\n]+)\1\s*\|\s*localize\b/g,
    )) {
      total++;
      if (!keys.has(match[2]))
        throw Error(`Missing translation: ${match[2]} in ${path}`);
    }
  }
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
