import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Preserve the baseline sequence; add deterministic delivery and browser gates.
const commands = [
  "format:check",
  "api:check",
  "delivery:check",
  "typecheck",
  "lint",
  "test:ci",
  "test:boundary",
  "test:deployment",
  "test:diagnostics",
  "build",
  "test:browser-quality",
  ...(process.env.DELIVERY_BACKEND_ROOT ? ["test:paired-smoke"] : []),
  "release:evidence",
];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (args) => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw Error("Cannot record repository identity");
  return result.stdout.trim();
};
await mkdir("artifacts/check", { recursive: true });
const files = git(["ls-files", "--cached", "--others", "--exclude-standard"])
  .split("\n")
  .filter(Boolean)
  .sort();
const tree = [];
for (const path of files) {
  // Verification artifacts are outputs, not part of the source identity.
  if (path.startsWith("artifacts/") || path.startsWith("graphify-out/"))
    continue;
  const bytes = await readFile(path).catch(() => null);
  tree.push([path, bytes ? digest(bytes) : "deleted"]);
}
const manifest = {
  startedAt: new Date().toISOString(),
  commit: git(["rev-parse", "HEAD"]),
  treeSha256: digest(JSON.stringify(tree)),
  sourceFiles: tree,
  lockSha256: digest(await readFile("package-lock.json")),
  openapiSha256: digest(await readFile("docs/reference/platform-openapi.json")),
  node: process.version,
  browser: {
    engine: process.env.BROWSER_ENGINE ?? "firefox",
    binary:
      process.env.BROWSER_BINARY ??
      process.env.FIREFOX_BINARY ??
      (process.env.BROWSER_ENGINE === "chromium" ? "chromium" : "firefox"),
    version: spawnSync(
      process.env.BROWSER_BINARY ??
        process.env.FIREFOX_BINARY ??
        (process.env.BROWSER_ENGINE === "chromium" ? "chromium" : "firefox"),
      ["--version"],
      { encoding: "utf8" },
    ).stdout?.trim(),
  },
  npm: spawnSync("npm", ["--version"], { encoding: "utf8" }).stdout.trim(),
  evidence: "VERIFIED_LOCAL only after all commands pass",
  peer: "APP-BE-001 handoff/live HTTP recorded separately; fixtures never establish integration",
  commands: [],
};
let failed = false;
try {
  for (const name of commands) {
    console.log(`Check: npm run ${name}`);
    const startedAt = new Date().toISOString();
    let output = "";
    const code = await new Promise((resolve, reject) => {
      const child = spawn("npm", ["run", name], {
        env: { ...process.env, NG_BUILD_MAX_WORKERS: "2" },
        stdio: ["ignore", "pipe", "pipe"],
      });
      child.on("error", reject);
      for (const [stream, target] of [
        [child.stdout, process.stdout],
        [child.stderr, process.stderr],
      ])
        stream.on("data", (chunk) => {
          output += chunk.toString();
          target.write(chunk);
        });
      child.on("exit", (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    });
    const plain = output.replace(/\x1b\[[0-9;]*m/g, "");
    // Native lint ceiling and browser capture are primary. Also reject compiler,
    // toolchain and test-runner diagnostics that otherwise exit successfully.
    const diagnostics = plain
      .split("\n")
      .filter(
        (line) =>
          /\[warn(?:ing)?\]/i.test(line) ||
          /(?:^|\s)(?:WARNING|Warning|DeprecationWarning|ExperimentalWarning)\b|^npm warn\b|^stderr\s*\||Unhandled (?:Errors|Rejection)\b/.test(
            line,
          ),
      );
    const log = `artifacts/check/${name.replaceAll(":", "-")}.log`;
    await writeFile(log, output);
    manifest.commands.push({
      name,
      startedAt,
      endedAt: new Date().toISOString(),
      exitCode: code,
      diagnosticCount: diagnostics.length,
      log,
      sha256: digest(output),
      testSummary: plain
        .split("\n")
        .filter((line) =>
          /Test Files|Tests\s+\d|# (tests|pass|fail|skipped)/.test(line),
        )
        .map((line) => line.trim()),
    });
    if (code !== 0 || diagnostics.length || !output.trim()) {
      failed = true;
      break;
    }
  }
} catch (error) {
  failed = true;
  manifest.runnerError = error.message;
} finally {
  const finalFiles = git([
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
  ])
    .split("\n")
    .filter(Boolean)
    .sort();
  const finalTree = [];
  for (const path of finalFiles) {
    if (path.startsWith("artifacts/") || path.startsWith("graphify-out/"))
      continue;
    const bytes = await readFile(path).catch(() => null);
    finalTree.push([path, bytes ? digest(bytes) : "deleted"]);
  }
  manifest.finalTreeSha256 = digest(JSON.stringify(finalTree));
  manifest.sourceChangedDuringCheck =
    manifest.finalTreeSha256 !== manifest.treeSha256;
  if (manifest.sourceChangedDuringCheck) failed = true;
  manifest.endedAt = new Date().toISOString();
  manifest.exitCode = failed ? 1 : 0;
  await writeFile(
    "artifacts/check/manifest.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
process.exitCode = manifest.exitCode;
