# APP-FE-002 / 033 / 038 — Current dependency review

Date: 2026-10-24. Continuation of the explicit dependency-diagnostics requirement
in the frontend follow-up. Existing task IDs and parent statuses remain intact.

## Intake and implementation

The frontend starts at `04fdb04` with a clean tree and the same full source identity
as the completed frontend wrap-up. Current frontend and read-only backend
functional hashes both match that receipt. Exact intake is retained in
`artifacts/remaining-2026-10-24/intake.json`; previously verified application work
is reused. No producer contract has become newly available on this unchanged pair.

The old dependency review describes an earlier npm lockfile. The current
[dated pnpm review](../reference/dependency-review-2026-10-24.json) records the
actual current lockfile and separates production from development advisories.
Historical review JSON and October 3–4 evidence are preserved.

The existing `release-it>undici` override advances from 7.30.0 to 7.30.1, the
[upstream security patch](https://github.com/nodejs/undici/releases/tag/v7.30.1).
Only that override, package integrity/version and its existing dependency edge
change in the lockfile. Direct dependency pins, supply-chain policies and build
allowances remain unchanged. No application, API, migration or peer source changes.

## Actual evidence and remaining findings

The existing `dependencies:report` succeeds before and after the patch. Production
has zero advisory entries. Development has 39 entries: 13 high, 20 moderate, six
low. Both release-tool Undici exposure paths disappear; aggregate advisory counts
remain unchanged because other development consumers remain affected. The dated
review groups the remaining ten package families and links the exact advisories
and patched ranges. This is not an assertion that every listed fix is compatible.

The frozen installation passes without emitted warnings; `release-it --version`
returns v21.1.0. Temporary resolution reported existing `glob@7.2.3` and
`inflight@1.0.6` deprecations. These remain visible in the retained candidate logs.
Initial sandbox subprocess EPERM, an invalid exploratory depth argument and an
unavailable YAML parser are retained as unsuccessful investigation, not checks.
The broad exploratory resolver is not adopted. All outputs live under
`artifacts/remaining-2026-10-24/`.

The first complete gate passes its first seven stages, then retains 1,052 passing
and twelve failing unit cases across seven files: eleven five-second timeouts
and a subsequent TestBed initialization error. The host reports only 259 MiB
available memory with all 975 MiB swap used during that run. The unchanged seven
files subsequently pass all 47 cases with `NODE_OPTIONS=--max-old-space-size=768`
in 37 seconds, retaining every assertion and original timeout. The failed gate is
archived under `failed-check/`; the focused result is not a complete gate pass.
The next full gate uses this process memory limit and a fresh source snapshot.

Final local verification requires the complete `mise run check` with zero emitted
diagnostics and unchanged source. Its raw log, archived per-stage manifest,
source comparison and native exit code belong to
`artifacts/remaining-2026-10-24/completion.json`. An absent, partial or failing
receipt is incomplete. Graph refresh is recorded separately. This dependency-only
change has no new HTTP or browser service contract; the complete existing browser,
boundary and release checks remain required. Previous real-service results keep
their recorded lockfile/source qualification and are not relabelled as fresh runs.

Remaining development advisories and deprecated subdependencies need further
reviewed remediation. Hosted CI, manual assistive technology/device/performance
decisions, producer-dependent feature contracts, deployment and user signoff remain
open. No parent, consistency or assistant task becomes DONE through this patch.

## 2026-10-25 — Remaining advisory remediation

The [current audit](../reference/dependency-review-2026-10-25.json) clears all ten
previously affected development package families. Before: 39 entries (13 high,
20 moderate, six low); after: zero development and zero production entries.
Vitest advances one patch; targeted development overrides repair pinned consumers
while framework pins and supply-chain policies remain unchanged. The get-uri /
basic-ftp major compatibility test uses an owned loopback server for directory
metadata fallback and exact download bytes. It follows the original diagnostic
process-fixture suite.

The frozen install is warning-free. Candidate resolution retains existing
glob/inflight deprecations. Current producer alignment, types, existing diagnostics
and the FTP test pass after retained inventory/color-fixture failures. Complete
final gates, source comparisons and actual paired acceptance belong to
`artifacts/remaining-2026-10-25/completion.json`; no pending result is preclaimed.
Historical audits, receipts and parent/manual/deployed boundaries remain intact.
