import test from "node:test";
import assert from "node:assert/strict";
import {
  localCheckIssues,
  pairedEvidence,
  requiredCheckStages,
} from "./delivery-evidence.mjs";
const sha = "a".repeat(64);
const manifest = () => ({
  exit_code: 0,
  started_at: 1,
  ended_at: 2,
  evidence: "real HTTP / disposable services",
  browser_version: "Firefox",
  frontend_commit: "b".repeat(40),
  backend_commit: "c".repeat(40),
  frontend_source_start_sha256: sha,
  frontend_source_end_sha256: sha,
  backend_source_start_sha256: sha,
  backend_source_end_sha256: sha,
  backend_peer_source_snapshot_sha256: sha,
  backend_peer_source_after_sha256: sha,
  actual_http_contract_match: true,
  expected_contract_sha256: sha,
  actual_contract_sha256: sha,
  contract_drift: { changed_paths: [], changed_schemas: [] },
  service_diagnostics: [],
  service_log_sha256: sha,
  commands: [{ name: "real browser", exit_code: 0, log_sha256: sha }],
  task_scope: "021",
  limits: ["No live vendor acceptance"],
});
const browser = {
  status: "passed",
  evidence: "real-http",
  diagnostics: [],
  scenarios: ["actual save and reopen"],
};
test("accepts exact scoped pairs, and keeps historical evidence distinct from current source", () => {
  assert.equal(
    pairedEvidence(manifest(), browser, sha).status,
    "VERIFIED_SCOPED_PAIR",
  );
  const result = pairedEvidence(manifest(), browser, "d".repeat(64));
  assert.equal(result.status, "HISTORICAL_SCOPED_PAIR");
  assert.equal(result.currentFrontendSource, false);
  assert.deepEqual(result.limits, ["No live vendor acceptance"]);
});
test("retains the existing notification observation format without inventing scenarios", () => {
  const producer = {
    ...manifest(),
    actual_inbox_contract_match: true,
    inbox_contract_sha256: sha,
  };
  const notification = {
    status: "passed",
    evidence: "real-http",
    diagnostics: [],
    live: { connections: 4, changed: 3, resync: 3 },
    maxConcurrentStreams: 1,
  };
  const result = pairedEvidence(producer, notification, sha);
  assert.equal(result.status, "VERIFIED_SCOPED_PAIR");
  assert.deepEqual(result.scenarios, []);
  assert.deepEqual(result.liveInbox, notification.live);
  assert.equal(
    pairedEvidence(producer, { ...notification, maxConcurrentStreams: 2 }, sha)
      .status,
    "NOT_VERIFIED",
  );
});
test("rejects partial, drifting, diagnostic and fixture evidence even with exit zero", () => {
  const cases = [
    { ended_at: undefined },
    { actual_http_contract_match: false, actual_inbox_contract_match: true },
    { frontend_source_end_sha256: "d".repeat(64) },
    { service_diagnostics: ["warning"] },
    { backend_peer_source_after_sha256: "d".repeat(64) },
    { commands: [] },
    { actual_contract_sha256: "d".repeat(64) },
    { backend_commit: undefined },
    { contract_drift: { changed_paths: [], changed_schemas: ["GraphStep"] } },
  ];
  for (const patch of cases)
    assert.equal(
      pairedEvidence({ ...manifest(), ...patch }, browser, sha).status,
      "NOT_VERIFIED",
    );
  for (const patch of [
    { evidence: "fixture" },
    { status: "failed" },
    { diagnostics: ["warning"] },
    { scenarios: [] },
  ])
    assert.equal(
      pairedEvidence(manifest(), { ...browser, ...patch }, sha).status,
      "NOT_VERIFIED",
    );
});
test("requires each real local gate stage rather than accepting twelve duplicate passes", () => {
  const command = (name) => ({ name, exitCode: 0, diagnosticCount: 0 });
  const gate = {
    exitCode: 0,
    endedAt: "now",
    treeSha256: sha,
    finalTreeSha256: sha,
    sourceChangedDuringCheck: false,
    commands: requiredCheckStages.map(command),
  };
  assert.deepEqual(localCheckIssues(gate, sha), []);
  assert.ok(
    localCheckIssues(
      { ...gate, commands: Array(12).fill(command("format:check")) },
      sha,
    ).length,
  );
  assert.ok(
    localCheckIssues(
      {
        ...gate,
        commands: gate.commands.map((entry) =>
          entry.name === "lint" ? { ...entry, diagnosticCount: 1 } : entry,
        ),
      },
      sha,
    ).length,
  );
  assert.ok(localCheckIssues(gate, "d".repeat(64)).length);
});
