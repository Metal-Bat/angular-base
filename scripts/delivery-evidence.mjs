// Evidence remains scoped; a passing profile never establishes whole-product acceptance.
export const requiredCheckStages = [
  "format:check",
  "api:check",
  "delivery:check",
  "typecheck",
  "typecheck:playwright",
  "lint:playwright",
  "lint",
  "test:ci",
  "test:boundary",
  "test:deployment",
  "test:diagnostics",
  "build",
  "test:browser-quality",
  "test:playwright",
  "release:evidence",
];
const hash = (value) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const commit = (value) =>
  typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
const clean = (value) => Array.isArray(value) && value.length === 0;

export function localCheckIssues(gate, currentSha) {
  if (!gate) return ["Local check manifest is missing"];
  const issues = [];
  if (gate.exitCode !== 0 || !gate.endedAt || gate.runnerError)
    issues.push("Local check did not finish successfully");
  if (
    !hash(currentSha) ||
    gate.treeSha256 !== currentSha ||
    gate.finalTreeSha256 !== currentSha ||
    gate.sourceChangedDuringCheck !== false
  )
    issues.push("Local check source identity is not current and unchanged");
  const commands = Array.isArray(gate.commands) ? gate.commands : [];
  const names = commands.map((command) => command.name);
  if (
    new Set(names).size !== names.length ||
    requiredCheckStages.some((name) => !names.includes(name)) ||
    names.some(
      (name) =>
        !requiredCheckStages.includes(name) && name !== "test:paired-smoke",
    )
  )
    issues.push("Required local stages are missing, duplicated or unknown");
  if (
    commands.some(
      (command) => command.exitCode !== 0 || command.diagnosticCount !== 0,
    )
  )
    issues.push("Local stages contain failures or diagnostics");
  return issues;
}

export function pairedEvidence(manifest, browser, currentFrontendSha) {
  if (!manifest)
    return { status: "NOT_RECORDED", issues: ["Paired manifest is missing"] };
  const issues = [];
  if (
    manifest.exit_code !== 0 ||
    !Number.isFinite(manifest.started_at) ||
    !Number.isFinite(manifest.ended_at) ||
    manifest.ended_at < manifest.started_at ||
    manifest.blocked_at
  )
    issues.push("Paired run did not finish successfully");
  if (
    manifest.evidence !== "real HTTP / disposable services" ||
    !manifest.browser_version ||
    !commit(manifest.frontend_commit) ||
    !commit(manifest.backend_commit)
  )
    issues.push("Exact real-service pair or browser identity is missing");
  for (const owner of ["frontend", "backend"]) {
    const start = manifest[`${owner}_source_start_sha256`];
    if (!hash(start) || start !== manifest[`${owner}_source_end_sha256`])
      issues.push(`${owner} source changed or is unrecorded`);
  }
  if (
    manifest.backend_peer_source_snapshot_sha256 !== undefined &&
    (manifest.backend_peer_source_snapshot_sha256 !==
      manifest.backend_peer_source_after_sha256 ||
      manifest.backend_peer_source_snapshot_sha256 !==
        manifest.backend_source_start_sha256)
  )
    issues.push(
      "Read-only backend peer identity changed or differs from runtime",
    );
  if (
    manifest.actual_http_contract_match !== true ||
    !hash(manifest.expected_contract_sha256) ||
    manifest.expected_contract_sha256 !== manifest.actual_contract_sha256 ||
    !clean(manifest.contract_drift?.changed_paths) ||
    !clean(manifest.contract_drift?.changed_schemas)
  )
    issues.push("Full actual HTTP producer contract is not reconciled");
  if (
    !clean(manifest.service_diagnostics) ||
    !hash(manifest.service_log_sha256)
  )
    issues.push(
      "Service diagnostic evidence is missing or contains diagnostics",
    );
  if (
    !Array.isArray(manifest.commands) ||
    !manifest.commands.length ||
    manifest.commands.some(
      (command) => command.exit_code !== 0 || !hash(command.log_sha256),
    )
  )
    issues.push("Paired commands failed or lack log identities");
  const scenarioEvidence =
    Array.isArray(browser?.scenarios) && browser.scenarios.length > 0;
  const liveInboxEvidence =
    manifest.actual_inbox_contract_match === true &&
    hash(manifest.inbox_contract_sha256) &&
    browser?.live?.connections > 0 &&
    browser.live.changed > 0 &&
    browser.live.resync > 0 &&
    browser.maxConcurrentStreams === 1;
  if (
    browser?.status !== "passed" ||
    browser.evidence !== "real-http" ||
    !clean(browser.diagnostics) ||
    (!scenarioEvidence && !liveInboxEvidence)
  )
    issues.push("Actual browser scenarios failed or are unrecorded");
  const current =
    hash(currentFrontendSha) &&
    currentFrontendSha === manifest.frontend_source_end_sha256;
  return {
    status: issues.length
      ? "NOT_VERIFIED"
      : current
        ? "VERIFIED_SCOPED_PAIR"
        : "HISTORICAL_SCOPED_PAIR",
    issues,
    currentFrontendSource: current,
    scope: manifest.task_scope ?? "unrecorded",
    scenarios: browser?.scenarios ?? [],
    liveInbox: liveInboxEvidence ? browser.live : null,
    frontendCommit: manifest.frontend_commit,
    backendCommit: manifest.backend_commit,
    frontendSourceSha256: manifest.frontend_source_end_sha256,
    backendSourceSha256: manifest.backend_source_end_sha256,
    actualContractSha256: manifest.actual_contract_sha256,
    limits: manifest.limits ?? [],
  };
}
