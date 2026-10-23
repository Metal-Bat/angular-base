# APP-FE-038 — Current frontend wrap-up continuation

Date: 2026-10-22. Existing APP owners retain their IDs and acceptance status.
This continues the [ordered execution](APP-FE-038-ORDERED-EXECUTION.md), following
[the execution crosswalk](../delivery/ORDERED-REMAINING-WORK.md). Prior receipts
remain historical; they are not relabelled as current acceptance.

## Source intake and scope

Frontend starts at `9ad4fb8`; Nx and Impeccable are already installed and committed.
The read-only backend starts at `4a5ec27f9f14eba7ad7fd7bbfa5280a7ed77d272` with
existing uncommitted changes. Its functional source SHA-256 is
`4797a6226ccd6182dc0aa53dc5d753602c342d41cc46dba7273cd3dd9ca71d63`.
`artifacts/frontend-wrap-up/intake.json` records both checkouts. Real-service
acceptance runs immutable owned backend copies with disposable services. No
applied migration, shared database, published graph or active pin is rewritten.
DB-002, D07 and the existing protected-effect approval contract remain applicable.

## Changes under existing owners

- APP-FE-038/036: source identity follows actual working-file bytes, preserving
  identity across staging and committing deletions while detecting actual source
  changes. Empty files and newline-containing paths are covered. Generated
  artifacts/graph outputs remain excluded. Historical manifests are unchanged.
- APP-FE-038/036: verification commands have bounded deadlines, propagate failures
  and cancellation, terminate owned process groups and retain partial evidence.
  Browser scopes own temporary profiles and release them on cancellation or
  timeout. Regression tests verify a genuinely hung descendant releases its
  loopback port. Integrated mode explicitly requires a backend checkout.
- APP-FE-038: the CI job budget now accommodates the measured complete local gate
  (previously approximately 42 minutes versus a 20-minute job ceiling). Individual
  stages/scopes remain bounded; no tests, diagnostics or thresholds are skipped
  or relaxed. A changed workflow is not proof of a hosted CI pass.
- APP-FE-021/038 and CONS-FE producer consistency: reconcile five reviewed backend
  primitives into the existing exact inspector registry: arithmetic, numeric
  comparison, boolean logic, conditional routing and value selection. The same
  producer manifest governs en/fa/ar metadata hashes; the existing eighteen
  handler contracts and twenty field contracts are unchanged.
- APP-FE-021: existing workflow controls display readable translated operation
  choices while persisting canonical enums and immutable version pins. Choices
  live in the lazy workflow inspector and reuse the shared PrimeNG select. The
  exact schema/fingerprint checks and rejection of unknown operations remain.
- APP-FE-036: Tailwind excludes runtime inspector metadata and translation JSON
  from class discovery. Their machine keys and prose are data, not CSS utilities;
  the existing initial-bundle budget remains unchanged.

## Verification and retained failures

Results are recorded under `artifacts/frontend-wrap-up/`. The complete final
`mise run check` and task-specific actual-service profiles are required before
this continuation can claim current local/integrated verification. Absence of a
passing current receipt is incomplete work, not acceptance.

Focused inspector verification passed thirteen assertions across three files.
Verification-process/source-identity/browser cleanup regressions passed ten tests.
The first production build exposed a 218-byte initial-budget warning; translation
prose had introduced a Tailwind utility. Runtime-data source exclusions corrected
that cause without raising the budget. The subsequent build passed without that
warning. Earlier failures remain in their original logs.

Actual workflow acceptance first exposed a driver that read only the first
catalog page; production already loads the complete bounded catalog. The driver
now traverses it. The next actual run completed existing workflow scenarios and
rejected an incorrectly authored new test Transform input schema. The driver now
uses the exact existing conversion contract and a compatible consumer for an
unconstrained selection result; no backend validator was weakened. The new
actual discovery, typed-control round-trip and published primitive execution
scenarios subsequently passed, including false routing, boolean NOT and distinct
zero/null values. The complete workflow profile then passed forty scenarios with zero browser
diagnostics and exact live OpenAPI agreement. Its receipt is
`artifacts/frontend-wrap-up/workflows-final/`; source identities remain scoped.

The initial fresh reviewer profile passed twelve actual-service scenarios and
exact live OpenAPI agreement. This is intermediate-source evidence until rerun on
the final functional source. Refer to final receipts for exact hashes and counts.

Two additional existing acceptance-driver defects were reproduced in the ordered
batch. Reload correctly clears the form history, so the core driver now checks
disabled Undo/Redo rather than waiting to click Undo. The shared record recovery
driver now uses the current user reference returned by its preceding read for the
competing update, retaining the intentionally stale editor for conflict recovery.
No application lifecycle, retry semantics or authorization was changed. Initial
batch failures remain in `artifacts/frontend-wrap-up/services/`.

The corrected combined foundations profile passed all forty actual-service
scenarios with zero diagnostics. Final receipts live in
`artifacts/frontend-wrap-up/services-final/`; a passing profile qualifies only its
recorded exact source. The final full gate is archived separately under
`artifacts/frontend-wrap-up/final-check/`. Missing or failed receipts cannot be
interpreted as completion.

## Remaining acceptance boundaries

Core task status remains in `FRONTEND-BACKLOG.md`: 25 implemented tasks still have
open acceptance/dependencies; thirteen are DONE. The five assistant tasks and five
consistency tasks retain their separate ownership and prerequisites. Installing
instructions, passing fixtures or one service profile does not close a parent.

Continue available acceptance in the recorded order: reviewer/requester;
forms/workflow lifecycle; calendar/scheduler; available mapper/agent contracts;
then the unchanged-source final gate. Missing backend contracts, manual assistive
technology/device checks, hosted deployment and user approval require their actual
outcomes. No assistant endpoints, agent retrieval/provider-test contracts, calendar
membership selector or protected-operation outcome is invented by this work.
