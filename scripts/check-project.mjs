import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

// Preserve the baseline sequence; add deterministic delivery and browser gates.
import { requiredCheckStages } from "./delivery-evidence.mjs";
import { sourceIdentity } from "./source-identity.mjs";
import {
  runVerificationProcess,
  verificationCancellation,
} from "./verification-process.mjs";
if (
  process.argv.includes("--require-pair") &&
  !process.env.DELIVERY_BACKEND_ROOT
)
  throw Error(
    "Integrated check requires DELIVERY_BACKEND_ROOT; no fixture fallback",
  );
if (process.env.BROWSER_SANDBOX_SCOPE || process.env.BROWSER_SANDBOX_PROBE)
  throw Error("Full check requires all unmodified browser scopes");
const commands = [...requiredCheckStages];
if (process.env.DELIVERY_BACKEND_ROOT)
  commands.splice(commands.indexOf("release:evidence"), 0, "test:paired-smoke");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const git = (args) => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw Error("Cannot record repository identity");
  return result.stdout.trim();
};
await mkdir("artifacts/check", { recursive: true });
const identity = await sourceIdentity();
const cancellation = verificationCancellation();
const manifest = {
  startedAt: new Date().toISOString(),
  commit: git(["rev-parse", "HEAD"]),
  sourceIdentityVersion: identity.version,
  treeSha256: identity.sha256,
  sourceFiles: identity.files,
  pairedRequested: Boolean(process.env.DELIVERY_BACKEND_ROOT),
  lockSha256: digest(await readFile("pnpm-lock.yaml")),
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
  pnpm: spawnSync("pnpm", ["--version"], { encoding: "utf8" }).stdout.trim(),
  evidence: "VERIFIED_LOCAL only after all commands pass",
  peer: "APP-BE-001 handoff/live HTTP recorded separately; fixtures never establish integration",
  commands: [],
};
let failed = false;
try {
  for (const name of commands) {
    console.log(`Check: pnpm run ${name}`);
    const startedAt = new Date().toISOString();
    let output = "";
    const deadlineMs =
      {
        "test:ci": 15 * 60_000,
        "test:browser-quality": 45 * 60_000,
        "test:playwright": 60 * 60_000,
        "test:paired-smoke": 15 * 60_000,
      }[name] ?? 5 * 60_000;
    const result = await runVerificationProcess("pnpm", ["run", name], {
      env: { ...process.env, NG_BUILD_MAX_WORKERS: "2" },
      timeoutMs: deadlineMs,
      signal: cancellation.signal,
      killGraceMs: 5000,
      onOutput: (chunk, stream) => {
        output += chunk.toString();
        process[stream].write(chunk);
      },
    });
    const code = result.exitCode;
    const plain = output.replace(/\x1b\[[0-9;]*m/g, "");
    // Native lint ceiling and browser capture are primary. Also reject compiler,
    // toolchain and test-runner diagnostics that otherwise exit successfully.
    const diagnostics = plain
      .split("\n")
      .filter(
        (line) =>
          /\[warn(?:ing)?\]/i.test(line) ||
          /(?:^|\s)(?:WARNING|Warning|DeprecationWarning|ExperimentalWarning)\b|^(?:npm warn|\u2009?WARN)\b|^stderr\s*\||Unhandled (?:Errors|Rejection)\b/.test(
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
      deadlineMs,
      timedOut: result.timedOut,
      cancelled: result.cancelled,
      ...(result.errorCode ? { errorCode: result.errorCode } : {}),
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
  try {
    const finalIdentity = await sourceIdentity();
    manifest.finalTreeSha256 = finalIdentity.sha256;
  } catch (error) {
    failed = true;
    manifest.identityError = error.message;
    manifest.finalTreeSha256 = null;
  }
  manifest.cancelled = cancellation.signal.aborted;
  cancellation.dispose();
  if (manifest.cancelled) failed = true;
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
