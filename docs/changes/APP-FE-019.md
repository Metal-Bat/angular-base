# APP-FE-019 — Plain bilingual messages and shared simulated preview

Date: 2026-10-08. Status: BLOCKED. Verification: IMPLEMENTED (available frontend slice).

## Reuse and resulting behavior

Reuse the server runtime-preview API and RuntimeForm. Add plain en/fa message editing with compatible compact ASCII SHA-256 source revisions, role-to-message links, typed synthetic values that survive document edits, and actor/generation fencing. Untouched message/reuse metadata stays intact; parameterized/plural entries are preserved with a compatibility notice. Page-field drafts are development-only behind an explicit capability flag; production does not expose invented page navigation.

Changed/reused: studio/domain/form-localization.ts and form-editing.spec.ts; presentation/form-settings and lifecycle spec; form-builder shared preview integration; development foundation-preview fixtures.

## Verification and compatibility

The focused Angular suite passed 422 tests in 75 files. Focused production build passed the unchanged 500 kB initial warning budget. Expanded Firefox foundations check typed properties, preserved keys/schema, current-reference save/save/reopen, en/fa presentation/accessibility, metric zero/table and read-only measured canvases. The production canvas scope exercises existing placement/persistence/pending fences plus selected-group keyboard movement, duplication, connection removal/undo and find-node navigation. These are isolated fixture checks.

Final local gate evidence is `artifacts/check/manifest.json`, its twelve command logs and the serialized `artifacts/firefox-*-quality.json` reports. Only a complete exit-0 `mise run check` with zero diagnostic counts and identical start/end source hashes establishes the final local result. Focused commands never substitute for that gate. Intermediate failures remain under `/tmp/steps20-*.log` and are described in docs/delivery/GATES.md.

The deterministic delivery check validates the copied inspector and metric dictionary bytes against the public producer manifest, all twenty option schemas and semantic metric copy against those artifacts, translations of touched authoring/metric templates, and both production preview route replacements. The generated API still uses the exact APP-BE-001 source (314 operations / 425 shared schemas); newly copied wave-four metadata does not attest completed producer integration. The peer was read only. No dependencies, migrations, seeds, shared data, paid calls, commits or deployment were changed. Graph refresh uses AST-only `graphify update .` after final edits.

Axe violations and captured browser diagnostics remain strict failures. Any incomplete axe items remain in the browser JSON for manual review; they do not establish manual accessibility acceptance.

## Remaining acceptance and blockers

Page/view and navigation semantics need a frozen contract and APP-BE-020 conformance. Plain-message editing does not cover plural/parameter argument authoring, reusable page/view configuration, all formatting roles or real preview conformance. Runtime preview remains server-owned; simulated inputs do not upload files, create requests, execute workflows or supply real-case authority.

The parent remains BLOCKED until its full required acceptance and real-service evidence are supplied. IMPLEMENTED refers only to the available slice above, not the complete parent deliverable.

## CURRENT five-scope continuation — 2026-10-10

Existing APP-FE-019.1: incomplete plain-message repair.

Plain catalog entries missing English or Farsi can be opened and repaired without changing their keys or untouched catalog metadata. Parameterized/plural entries still receive a compatibility notice. Inputs lock while source-revision hashing runs; late results cannot apply after edited buffers, a replaced document, actor reset, destruction or a read-only transition. Existing synthetic inputs and server-owned preview remain reused.

Changed/reused: `existing form-settings.ts/.html/.spec.ts; existing form-localization domain reused`.

Current remaining criteria: Parameterized/plural/formatting authoring, real PageSettings default_view/views/actions (the old development page experiment stays gated), full translation coverage, pinned view/policy/navigation/print conformance remain APP-FE-019 implementation/verification work. Producer availability is not the blocker.

The backend protected-operations handoff now records APP-BE-021/022/024/025 DONE / VERIFIED_WITH_EXCEPTION and APP-BE-023 implemented with actual-browser acceptance pending. The former APP-BE-022 unfrozen-metadata blocker is historical. The new frozen English producer was compared and reconciled (379 operations / 565 schemas), preserving all existing operation IDs and unchanged form/workspace contracts; see [intake](../reference/app-fe-016-020/contract-intake.json). No backend source/shared data/dependencies/mise/environment files were changed. Backend DB-002/D07 decisions remain scoped; SDK exceptions do not establish strict exception-free demo readiness.

Actual source identities, tests, failures and final gate: [five-scope acceptance](../delivery/APP-FE-016-020-ACCEPTANCE.md). Parent remains **BLOCKED / IMPLEMENTED** for its full acceptance. This continuation supersedes the historical producer-unavailability blocker above; it does not rewrite prior evidence or mark the parent DONE. APP-FE-012/014 remain unrelated to this work.
