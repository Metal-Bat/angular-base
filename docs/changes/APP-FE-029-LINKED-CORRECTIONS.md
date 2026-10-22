# APP-FE-029.UX03 — Link corrections to current fields and rows

Date: 2026-10-19. Classification: EXTEND existing reviewer feedback, stable-row,
page-rendering and field-ID owners. This is not a new form engine or transport
contract. Existing parent/master readiness and historical source-qualified
receipts remain unchanged.

## Problem and behavior

Feedback already showed instructions and prior/current values, but collection
entries did not identify their current row and could not take the user to the
field. The new action identifies the field and localized current row, changes
presentation pages when needed, and focuses the existing control. Navigation does
not resolve feedback, save data, submit a task or alter the workflow. Read-only
feedback can navigate to its authorized read-only output.

The existing correction target owner now exposes the corresponding current
instance pointer. Nested row indices come from the authorized stable identities;
opaque row keys and schema pointers remain internal. Page visibility includes
ancestor visibility and the declared actor-filtered pages. A removed/denied/hidden
or ambiguous target has no navigation action. The form resolves stable row keys
again after rendering and rejects a changed resource before focusing, rather
than using a stale index or moving focus into another record.

Page changes preserve unsaved canonical values. A page containing invalid raw
input remains mounted with an explanation; navigation never destroys that input
to reach a different page. Existing confirmation on a manual authoritative
refresh remains mandatory. Core field IDs and first-visible placement ownership
are reused; collection/media targets focus their own fieldset. Angular's render
phases separate DOM measurement from focus/scroll writes. PrimeNG buttons and
semantic tokens retain keyboard, RTL, responsive spacing and accessible field/row
names. Normal presentation contains no JSON or copied reference input.

## Verification and provenance

The initial focused regression failed one test with three passes, proving current
instance pointers were absent. Initial focused checks then passed nineteen cases
in four files; final focused checks pass twenty-two cases in five files.
Initial lint reports four import/attribute ordering errors; standard ordering fixes
preserve all rules and thresholds. The production build passes without warnings.

The first browser run reaches linked navigation and authoritative reorder, then
waits at the existing keep-unsaved-edits confirmation. Its driver must explicitly
answer that dialog; no application safeguard is removed. A second run exposed the collapsed mobile language selector in the test setup;
language selection now occurs before resizing, without weakening mobile layout
assertions. Failed/partial reports
remain separate from the final qualified three-language/three-engine results.

Actual acceptance extends the existing guarded disposable 029 journey: scalar
and stable-row navigation across pages retains an unsaved count, an actual
collection reorder updates the displayed ordinal and focused field, and the same
real correction/resubmission completes with immutable originals, hidden retention
and one decision per task. The producer's exact paths/components and source hashes
must match. The owning read-only proof never prints private snapshots or keys.

Final observed counts, exits, source identities, production bundle hashes,
retained failures, screenshots and the complete unchanged-source zero-diagnostic
`mise run check` belong to `artifacts/linked-corrections/completion.json`. An absent
or partial receipt is incomplete. Fixture presentation is not real-service
acceptance. Existing mapper/agent/team/attachment producer handoffs, human/manual
accessibility/device, deployment and user acceptance remain with their owners.

The intermediate owning suite passes all 54 cases across Chromium, Firefox and
WebKit, English/Persian/Arabic, and 390/1440 widths. The intermediate disposable
backend journey passes 12 scenarios with no browser/service diagnostics. These
results precede the final source qualification and are retained separately.

Visual review led to flattened feedback cards, responsive prior/current values,
context-specific translated correction statuses and visible read-only focus rings.
Blocked navigation focuses the invalid current input while preserving its raw
buffer. Scope-limited lookup avoids expanding unrelated large collections. DOM
ownership checks keep group/collection navigation from focusing a nested field;
the final focused regression covers this boundary. No endpoint, DTO, permission,
workflow transition or replay payload changed.

Final production build and Angular lint pass without diagnostics. Final owning
browser and disposable-service runs use that build; their results, together with
the complete final gate, must satisfy the completion receipt before this scope
is considered verified. Existing parent/master blockers are unchanged.

The final owned-service run passes all 12 scenarios, with zero browser/service
diagnostics and matching frozen producer paths/components. Frontend functional
source is unchanged across the run; the backend peer and immutable snapshot
remain unchanged. The final English, Persian and Arabic mobile feedback
screenshots show contained actions, a current row label, readable correction
status and vertically stacked prior/current values. This scoped inspection does
not replace human product or assistive-technology acceptance.
