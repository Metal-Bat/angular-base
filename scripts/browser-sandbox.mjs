import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderSandboxReport } from "./sandbox-report.mjs";

const args = process.argv.slice(2);
let scope;
let probe;
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--scope") scope = args[++index];
  else if (args[index] === "--probe") probe = args[++index];
  else
    throw Error(
      "Usage: browser-sandbox [--scope temporal|auth|records|…] [--probe warning]",
    );
}
if (probe && probe !== "warning") throw Error("Unknown diagnostic probe");
const output = await mkdtemp(join(tmpdir(), "frontend-browser-sandbox-"));
const reports = join(
  "artifacts",
  "browser-sandbox",
  new Date().toISOString().replaceAll(":", "-"),
);
await mkdir(reports, { recursive: true });
async function run(file, args, env, log) {
  let text = "";
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    for (const [stream, target] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ])
      stream.on("data", (chunk) => {
        text += chunk.toString();
        target.write(chunk);
      });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
  await writeFile(join(reports, log), text);
  return code;
}
let exitCode = 1;
try {
  const env = { ...process.env, NG_BUILD_MAX_WORKERS: "2" };
  exitCode = await run(
    "node_modules/@angular/cli/bin/ng.js",
    ["build", "--configuration", "development", "--output-path", output],
    env,
    "build.log",
  );
  if (exitCode === 0)
    exitCode = await run(
      "scripts/browser-quality-check.mjs",
      [],
      {
        ...env,
        BROWSER_APP_DIR: join(output, "browser"),
        BROWSER_SANDBOX_DIAGNOSTICS: "1",
        BROWSER_SANDBOX_REPORT_DIR: reports,
        ...(scope ? { BROWSER_SANDBOX_SCOPE: scope } : {}),
        ...(probe ? { BROWSER_SANDBOX_PROBE: probe } : {}),
      },
      "journey.log",
    );
} catch (error) {
  exitCode = 1;
  throw error;
} finally {
  await writeFile(
    join(reports, "run.json"),
    JSON.stringify(
      {
        exitCode,
        scope: scope ?? "all",
        probe: probe ?? null,
        evidence: "disposable local fixtures",
        reports,
      },
      null,
      2,
    ) + "\n",
  );
  await rm(output, { recursive: true, force: true });
  await renderSandboxReport(reports, exitCode);
  console.log(`Browser sandbox reports: ${reports}`);
  process.exitCode = exitCode;
}
