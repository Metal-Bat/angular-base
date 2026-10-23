import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import {
  runVerificationProcess,
  verificationCancellation,
} from "./verification-process.mjs";

// One engine and one browser process at a time; real-backend/Studio checks have
// separate fixture requirements and remain outside this local quality batch.
function defaultScopes(engine) {
  return [
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
}

export async function runBrowserQualityChecks({
  engine = process.env.BROWSER_ENGINE ?? "firefox",
  scopes = defaultScopes(engine),
  directory = process.env.BROWSER_SANDBOX_REPORT_DIR ?? "artifacts",
  sandbox = process.env.BROWSER_SANDBOX_DIAGNOSTICS === "1",
  selected = process.env.BROWSER_SANDBOX_SCOPE,
  deadlineMs = 180_000,
} = {}) {
  if (!["firefox", "chromium"].includes(engine))
    throw Error("Unknown browser engine");
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0 || deadlineMs > 180_000)
    throw Error("Browser scope deadline must be between 1 and 180000ms");
  if (selected && (!sandbox || !scopes.some(([scope]) => scope === selected)))
    throw Error("Unknown or unauthorized sandbox scope");
  const results = [];
  const cancellation = verificationCancellation();
  const selectedScopes = scopes.filter(
    ([scope]) => !selected || scope === selected,
  );
  const startedAt = new Date().toISOString();
  await mkdir(directory, { recursive: true });
  try {
    for (const [scope, file, flags] of selectedScopes) {
      if (cancellation.signal.aborted) throw Error("Browser quality cancelled");
      const temporaryDirectory = await mkdtemp(
        join(tmpdir(), "frontend-quality-"),
      );
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
        TMPDIR: temporaryDirectory,
        BROWSER_ENGINE: engine,
        NG_BUILD_MAX_WORKERS: "2",
        NX_DAEMON: "false",
        BROWSER_REPORT_PATH: join(directory, `${engine}-${scope}-quality.json`),
      });
      const startedAt = Date.now();
      let output = "";
      let code;
      let processResult;
      let temporaryFilesReleased = false;
      console.log(
        `Quality check started: ${engine} ${scope} (deadline ${deadlineMs}ms)`,
      );
      try {
        processResult = await runVerificationProcess(process.execPath, [file], {
          env,
          timeoutMs: deadlineMs,
          signal: cancellation.signal,
          onOutput: (chunk, stream) => {
            output += chunk.toString();
            process[stream].write(chunk);
          },
        });
        code = processResult.exitCode;
      } finally {
        const log = join(directory, `${engine}-${scope}.log`);
        let cleanupError;
        try {
          await rm(temporaryDirectory, { recursive: true, force: true });
          temporaryFilesReleased = true;
        } catch (error) {
          cleanupError = error.code;
          code = 1;
        }
        await writeFile(log, output);
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
          deadlineMs,
          timedOut: processResult?.timedOut ?? false,
          cancelled: processResult?.cancelled ?? cancellation.signal.aborted,
          temporaryFilesReleased,
          ...(cleanupError ? { cleanupError } : {}),
          report: env.BROWSER_REPORT_PATH,
          log,
        });
      }
      if (code !== 0) throw Error(`${engine} ${scope} failed (${code})`);
      console.log(
        `Quality check passed: ${engine} ${scope} (${Date.now() - startedAt}ms)`,
      );
    }
  } finally {
    cancellation.dispose();
    await writeFile(
      join(directory, "browser-summary.json"),
      JSON.stringify(
        {
          engine,
          startedAt,
          endedAt: new Date().toISOString(),
          status:
            !cancellation.signal.aborted &&
            results.length === selectedScopes.length &&
            results.every((result) => result.exitCode === 0)
              ? "passed"
              : "failed",
          cancelled: cancellation.signal.aborted,
          plannedScopes: selectedScopes.length,
          evidence: "fixture-only",
          selectedScope: selected ?? "all",
          results,
        },
        null,
        2,
      ) + "\n",
    );
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await runBrowserQualityChecks();
}
