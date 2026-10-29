# APP-FE-024 — Durable binding and legacy Transform continuation

Date: 2026-10-25. Existing APP-FE-024 / APP-BE-019 owners; no parent readiness
change. The owner requested dependency remediation and the two concrete producer
repairs in the current handoff.

The backend persists REQUEST/CONTEXT source schemas in executable bindings through
an additive nullable forward migration. Existing published rows retain null,
their pins and checksums. Legacy Transform v1 retains its registered generic ports
and configuration; registry-verified conversion types drive validation and the
existing bounded engine executes it. Applied baselines and published graphs stay
unchanged. Backend owner: APP-BE-019.UX02.

The reviewed producer changes no paths, operation IDs, wire fields, envelopes or
security. Its en/fa/ar diff changes only GraphBinding.source_schema documentation.
The existing 23 handler fingerprints and twenty field contracts remain unchanged.
Main transport and reviewed metadata use the refreshed producer; the client is
regenerated through the existing generator.

The existing paired workflow harness now requires UI save/reload to preserve
REQUEST and legacy target schemas, followed by actual promotion/publication and
request execution. Five disposable PostgreSQL/HTTP cases plus one dedicated
migration preservation/refusal case pass. Fixtures cannot replace current-pair
browser/worker/service evidence.

Final verification belongs to `artifacts/remaining-2026-10-25/completion.json`:
complete gates, native exits, actual scenario counts and source comparisons are
required. An absent/partial/failing receipt is incomplete. Backend D07 retains
VERIFIED_WITH_EXCEPTION; frontend warnings, required skips and source drift fail.

An existing diagnostic fixture printed its port with console.log(number), which
Nx colorizes. It now writes plain port digits and explicitly tests child color.
Its deadline, process cleanup and port-rebinding assertions remain unchanged.
Initial inventory/diagnostic failures and the intermediate nested-string mistake
remain retained. The FTP adapter regression follows the original process suite.

Unbound request completion, cross-source composition, authorized samples, Agent
contracts, Calendar membership and broader hosted/deployed/manual/user acceptance
retain their current owners and evidence boundaries.

Current paired acceptance passes all 44 scenarios with exact live OpenAPI,
zero browser/service diagnostics and unchanged runtime/harness source.
`artifacts/remaining-2026-10-25/paired-workflows-final/` owns that corrected-source
receipt. The earlier run remains historical after the backend's private comment
convention correction. Full backend/frontend gates and their source comparisons
remain separately required; their completion is not inferred from this pass.

The second backend gate retains 1,032 default passes and 54 required service passes,
then 58 transfer passes plus one failed Persian claim race. Safe PostgreSQL
diagnostics and a controlled red regression identify a notification recipient /
process-event lock cycle. APP-BE-028.UX01 replaces the exclusive recipient key lock
with FOR NO KEY UPDATE, retaining serialization and unchanged claim/replay/error
contracts. The controlled overlap and existing authenticated en/fa races then pass
(three cases). Public producer artifacts are byte-identical after this lock fix;
only its source identity and reviewed intake refresh. The preceding 44-scenario
receipt is historical for its recorded source. Current paired acceptance belongs
to artifacts/remaining-2026-10-25/paired-workflows-lock-final/, and complete gates
remain required under the completion receipt. Broader APP statuses stay unchanged.

The corrected-source paired-workflows-lock-final receipt passes all 44 actual
browser/service scenarios with exact live API agreement, zero browser/service
diagnostics and unchanged functional source identities. Backend and frontend
complete final gates remain separate requirements under completion.json.

The corrected backend passes its complete sixteen-stage gate with unchanged
maintained source: 1,032 default tests, one doctest and 142 required service cases;
zero required skips and emitted diagnostics. Its 233 default opt-in exclusions
remain separate, and exact D07 policy retains VERIFIED_WITH_EXCEPTION. The bounded
APP-BE-019.UX02 and gate-discovered APP-BE-028.UX01 repairs close in their backend
change records. A fresh full gate qualifies their documentation closure; the
actual final result and complete final frontend gate belong to completion.json.
No broader frontend parent or release readiness is inferred.

The first complete frontend gate retains 431 passing browser cases and one failed
Chromium phone case. ERR_NETWORK_CHANGED interrupts initial JavaScript imports
before the form opens; the existing diagnostic assertion correctly fails the run.
Its maintained source is unchanged, and the original trace, report and per-stage
logs are retained under frontend-check-first/ in the current evidence directory.
The unchanged four-case focus then passes through the existing configured target
with zero emitted warnings. The manual invocation's color-environment warning is
retained separately; no application/test code, timeout, retry or diagnostic filter
changes for this recovery. A new complete gate qualifies this final documented
source; completion.json owns its actual result.
