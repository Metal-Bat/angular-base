import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeBrowserReport } from "./browser-report.mjs";
import {
  browserDiagnosticsScript,
  browserDiagnosticDeliveryScript,
  assertBrowserDiagnostics,
} from "./browser-diagnostics.mjs";

test("captures browser warnings, errors and unhandled rejections without private arguments", () => {
  const listeners = {};
  const context = {
    window: {
      addEventListener: (name, handler) => {
        listeners[name] = handler;
      },
    },
    console: { warn: () => {}, error: () => {} },
  };
  runInNewContext(browserDiagnosticsScript, context);
  context.console.warn("private payload");
  context.console.error("private error");
  listeners.error({ message: "private error" });
  listeners.unhandledrejection({ reason: "private rejection" });
  assert.equal(context.window.fixtureDiagnostics.length, 4);
  assert.ok(
    !JSON.stringify(context.window.fixtureDiagnostics).includes("private"),
  );
  assert.throws(
    () => assertBrowserDiagnostics(context.window.fixtureDiagnostics),
    /Unexpected browser/,
  );
});
test("requires diagnostic evidence and accepts only a clean capture", () => {
  assert.throws(() => assertBrowserDiagnostics(undefined), /Missing browser/);
  assertBrowserDiagnostics([]);
});

test("delivers bootstrap and later warnings before the fixture result", async () => {
  const delivered = [];
  const context = {
    window: {
      addEventListener: () => {},
      fetch: async (path, options) => {
        delivered.push({ path, body: options?.body });
        return { ok: true };
      },
    },
    console: { warn: () => {}, error: () => {} },
  };
  runInNewContext(browserDiagnosticsScript, context);
  context.console.warn("NG0956 private bootstrap payload");
  runInNewContext(browserDiagnosticDeliveryScript, context);
  context.console.error("NG0955 private later payload");
  await context.window.fetch("/test-result", { method: "POST" });
  assert.equal(delivered.at(-1).path, "/test-result");
  const warnings = delivered.filter(
    (item) => item.path === "/test-diagnostics",
  );
  assert.equal(warnings.length, 2);
  assert.equal(JSON.parse(warnings[0].body)[0].code, "NG0956");
  assert.equal(JSON.parse(warnings[1].body)[0].code, "NG0955");
  assert.ok(!JSON.stringify(delivered).includes("private"));
});

test("retains only bounded Angular/Foblex codes from diagnostic arguments", () => {
  const context = {
    window: { addEventListener: () => {} },
    console: { warn: () => {}, error: () => {} },
  };
  runInNewContext(browserDiagnosticsScript, context);
  context.console.warn("[f-flow][FF1009] private identifiers and payload");
  assert.equal(context.window.fixtureDiagnostics[0].code, "FF1009");
  assert.ok(
    !JSON.stringify(context.window.fixtureDiagnostics).includes("private"),
  );
  assert.throws(
    () => assertBrowserDiagnostics(context.window.fixtureDiagnostics),
    /FF1009/,
  );
});

test("reports a script location without URL queries or private exception text", () => {
  const listeners = {};
  const context = {
    window: {
      addEventListener: (name, handler) => {
        listeners[name] = handler;
      },
    },
    console: { warn: () => {}, error: () => {} },
  };
  runInNewContext(browserDiagnosticsScript, context);
  listeners.error({
    filename: "http://localhost/main.js?secret=private",
    lineno: 12,
    colno: 4,
    message: "private payload",
  });
  const report = JSON.parse(
    JSON.stringify(context.window.fixtureDiagnostics[0]),
  );
  assert.deepEqual(report, {
    kind: "runtime-error",
    file: "main.js",
    line: 12,
    column: 4,
  });
});

test("retains failure evidence, partial audits, diagnostic hints and screenshot sink failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "browser-report-test-"));
  try {
    const path = join(directory, "failure.json");
    await writeBrowserReport(
      path,
      {
        ok: false,
        stage: "calendar movement",
        diagnostics: [{ kind: "console-warn", code: "NG0956" }],
        failedRequests: [{ path: "/api/v1/forms/search", status: 500 }],
        accessibility: [{ context: "calendar", violations: [] }],
      },
      {
        captureScreenshot: async () => {
          throw Error("private exception");
        },
      },
    );
    const report = JSON.parse(await readFile(path, "utf8"));
    assert.equal(report.ok, false);
    assert.equal(report.accessibility.length, 1);
    assert.equal(report.failedRequests[0].status, 500);
    assert.match(report.hints[0], /tracking keys/);
    assert.equal(report.screenshot.status, "failed");
    assert.ok(!JSON.stringify(report).includes("private"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
