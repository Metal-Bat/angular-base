import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { publicBrowserStorageCheck } from "./browser-storage-policy.mjs";
const storage = (entries) => ({
  length: Object.keys(entries).length,
  key: (i) => Object.keys(entries)[i],
  getItem: (key) => entries[key],
});
const allowed = (entries, session = {}) =>
  runInNewContext(publicBrowserStorageCheck, {
    localStorage: storage(entries),
    sessionStorage: storage(session),
  });
test("only the exact public appearance hint is permitted; private and malformed state fails", () => {
  assert.equal(allowed({}), true);
  assert.equal(
    allowed({
      "workspace.public-theme": "teal-system",
    }),
    true,
  );
  for (const value of [
    "null",
    "[]",
    "broken",
    JSON.stringify({ palette: "unknown", mode: "dark" }),
    JSON.stringify({ palette: "blue", mode: "dark", token: "private" }),
  ]) {
    assert.equal(allowed({ "workspace.public-theme": value }), false);
  }
  assert.equal(allowed({ token: "private" }), false);
  assert.equal(allowed({}, { theme: "anything" }), false);
});
