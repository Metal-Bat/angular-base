import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// One engine and one browser process at a time; real-backend/Studio checks have
// separate fixture requirements and remain outside this local quality batch.
const engine = process.env.BROWSER_ENGINE ?? "firefox";
if (!["firefox", "chromium"].includes(engine))
  throw Error("Unknown browser engine");
const scopes = [
  ["boundary", "server/browser-boundary.spec.mjs", {}],
  ["auth", "server/browser-auth.spec.mjs", {}],
  ["ui", "server/browser-ui.spec.mjs", { ACCESSIBILITY_CHECKS: "1" }],
  [
    "foundations",
    "server/browser-foundations.spec.mjs",
    { ACCESSIBILITY_CHECKS: "1" },
  ],
  [
    "workspace",
    "server/browser-auth.spec.mjs",
    { WORKSPACE_BROWSER_CHECKS: "1" },
  ],
  [
    "canvas",
    "server/browser-auth.spec.mjs",
    { CANVAS_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  [
    "studio-catalogs",
    "server/browser-auth.spec.mjs",
    { STUDIO_CATALOG_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  [
    "records",
    "server/browser-auth.spec.mjs",
    { RECORD_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  [
    "temporal",
    "server/browser-auth.spec.mjs",
    {
      RECORD_BROWSER_CHECKS: "1",
      TEMPORAL_BROWSER_CHECKS: "1",
      ACCESSIBILITY_CHECKS: "1",
    },
  ],
  [
    "admin",
    "server/browser-auth.spec.mjs",
    { ADMIN_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  [
    "runtime",
    "server/browser-auth.spec.mjs",
    { PERFORMANCE_BROWSER_CHECKS: "1", ACCESSIBILITY_CHECKS: "1" },
  ],
  ...(engine === "chromium"
    ? [
        [
          "https",
          "server/browser-boundary.spec.mjs",
          { TLS_BROWSER_CHECKS: "1" },
        ],
      ]
    : []),
];
const sandbox = process.env.BROWSER_SANDBOX_DIAGNOSTICS === "1";
const selected = process.env.BROWSER_SANDBOX_SCOPE;
if (selected && (!sandbox || !scopes.some(([scope]) => scope === selected)))
  throw Error("Unknown or unauthorized sandbox scope");
const directory = process.env.BROWSER_SANDBOX_REPORT_DIR ?? "artifacts";
const results = [];
await mkdir(directory, { recursive: true });
try {
  for (const [scope, file, flags] of scopes.filter(
    ([scope]) => !selected || scope === selected,
  )) {
    const env = { ...process.env };
    for (const key of [
      "ACCESSIBILITY_CHECKS",
      "CANVAS_BROWSER_CHECKS",
      "RECORD_BROWSER_CHECKS",
      "TEMPORAL_BROWSER_CHECKS",
      "STUDIO_CATALOG_BROWSER_CHECKS",
      "UI_BROWSER_CHECKS",
      "FOUNDATION_BROWSER_CHECKS",
      "WORKSPACE_BROWSER_CHECKS",
      "ADMIN_BROWSER_CHECKS",
      "PERFORMANCE_BROWSER_CHECKS",
      "TLS_BROWSER_CHECKS",
      "BROWSER_REPORT_PATH",
    ])
      delete env[key];
    Object.assign(env, flags, {
      BROWSER_ENGINE: engine,
      NG_BUILD_MAX_WORKERS: "2",
      BROWSER_REPORT_PATH: join(directory, `${engine}-${scope}-quality.json`),
    });
    const startedAt = Date.now();
    let output = "";
    let code;
    try {
      code = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [file], {
          env,
          stdio: sandbox ? ["ignore", "pipe", "pipe"] : "inherit",
        });
        if (sandbox)
          for (const [stream, target] of [
            [child.stdout, process.stdout],
            [child.stderr, process.stderr],
          ]) {
            stream.on("data", (chunk) => {
              output += chunk.toString();
              target.write(chunk);
            });
          }
        child.on("error", reject);
        child.on("exit", (exitCode, signal) =>
          resolve(exitCode ?? (signal ? 1 : 0)),
        );
      });
    } finally {
      const log = join(directory, `${engine}-${scope}.log`);
      if (sandbox) await writeFile(log, output);
      if (sandbox && code === 0) {
        const report = JSON.parse(
          await readFile(env.BROWSER_REPORT_PATH, "utf8"),
        );
        if (report.screenshot?.status !== "captured") {
          console.error("Screenshot evidence missing for " + scope);
          code = 1;
        }
      }
      results.push({
        scope,
        exitCode: code ?? 1,
        durationMs: Date.now() - startedAt,
        report: env.BROWSER_REPORT_PATH,
        ...(sandbox ? { log } : {}),
      });
    }
    if (code !== 0) throw Error(`${engine} ${scope} failed (${code})`);
    console.log(`Quality check passed: ${engine} ${scope}`);
  }
} finally {
  await writeFile(
    join(directory, "browser-summary.json"),
    JSON.stringify(
      {
        engine,
        evidence: "fixture-only",
        selectedScope: selected ?? "all",
        results,
      },
      null,
      2,
    ) + "\n",
  );
}
