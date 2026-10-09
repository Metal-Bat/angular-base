import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import {
  browserDiagnosticsScript,
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
