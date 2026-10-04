import assert from "node:assert/strict";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createHash } from "node:crypto";
const directory = process.env.BROWSER_APP_DIR ?? "dist/ng-architect/browser";
const sha = (value) => createHash("sha256").update(value).digest("hex");
const html = await readFile(join(directory, "index.html"), "utf8");
const initial = new Set(
  [...html.matchAll(/(?:src|href)="([^"/]+\.(?:js|css))"/g)].map(
    (match) => match[1],
  ),
);
const queue = [...initial].filter((file) => file.endsWith(".js"));
for (let index = 0; index < queue.length; index++) {
  const text = await readFile(join(directory, queue[index]), "utf8");
  assert.ok(
    !text.includes('"f-flow"'),
    "Workflow canvas was included in initial JavaScript",
  );
  for (const match of text.matchAll(
    /\b(?:import|export)\s*(?:[^;"']*?\bfrom\s*)?["'](\.\/[^"']+\.js)["']/g,
  )) {
    const file = basename(match[1]);
    if (!initial.has(file)) {
      initial.add(file);
      queue.push(file);
    }
  }
}
let initialBytes = 0;
for (const file of initial)
  initialBytes += (await readFile(join(directory, file))).length;
assert.ok(initialBytes < 1_000_000, "Initial production error budget exceeded");
const files = [];
async function scan(path, prefix = "") {
  for (const item of await readdir(path, { withFileTypes: true })) {
    if (item.isDirectory()) {
      await scan(join(path, item.name), prefix + item.name + "/");
      continue;
    }
    assert.ok(!item.name.endsWith(".map"), "Public source map found");
    const bytes = await readFile(join(path, item.name));
    files.push({
      file: prefix + item.name,
      bytes: bytes.length,
      sha256: sha(bytes),
    });
  }
}
await scan(directory);
files.sort((a, b) => a.file.localeCompare(b.file));
const manifest = {
  generatedAt: new Date().toISOString(),
  initialBytes,
  initialWarningBudgetBytes: 500_000,
  initialErrorBudgetBytes: 1_000_000,
  sourceMaps: 0,
  canvasInInitialJavaScript: false,
  contractSha256: sha(await readFile("docs/reference/platform-openapi.json")),
  lockfileSha256: sha(await readFile("package-lock.json")),
  files,
};
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/release-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  `Release evidence: ${initialBytes} initial bytes, ${files.length} files, no public source maps, canvas remains lazy.`,
);
