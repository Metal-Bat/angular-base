# APP-FE-016 / 029 / 024 — Preserve literal field names in scope traversal

Date: 2026-10-19. Existing-owner repair; parent/master readiness stays open.
Classification: EXTEND the existing scope/value/validation/editor owners. No new
JSON dialect, public API, workflow engine or schema restriction is introduced.
The previous ordered-execution receipt remains historical evidence for its exact
source; this repair requires a new complete unchanged-source gate.

## Reproduced problem and intended behavior

Ordinary properties named `items` or `items_total` were mistaken for collection
traversals by substring checks. A property literally named `properties` was
discarded when correction targets were built. This could omit local validation,
lose retained edits on authoritative refresh, hide prior/correction values or
remove valid correction choices. Separately, page validation stripped schema
words from the whole string and used loose pointer prefixes, allowing errors to
belong to the wrong page. Workflow completion filtered actual instance-pointer
data keys named items/properties, hiding already authorized declared values.

The existing row-values owner now parses structural tokens in order: a property
name remains literal data, and an actual item traversal is represented separately.
Escaped pointer keys, stable row identities, unsafe-property guards and bounded
indices retain their existing contracts. Page issue ownership compares complete
path components. REQUEST source paths remain instance pointers; the editor never
removes their literal data keys or invents new expression syntax.

## Evidence and remaining work

Initial focused regressions: three failures and twelve passes in three files,
retained in `artifacts/literal-scopes/`. Subsequent five-file focused checks pass
36 tests, including dirty-refresh/save preservation and page boundaries.
Final actual service/browser, trilingual browser checks, graph refresh and the
complete final gate are required for this source. Their observed results, source identities, failure
logs and scope limits belong to `artifacts/literal-scopes/completion.json`; an
absent/partial receipt is incomplete. No backend-dependent capability, manual
assistive-technology/device, deployment or human acceptance is implied.

## Page input and compatibility

Page navigation now considers raw draft errors as well as canonical validation.
An invalid numeric draft can retain the prior canonical number; that retained
number must not allow Next to bypass the visible error. Exact component matching
also prevents `amount_extra` errors from blocking a page containing only `amount`.
Previous submission fields include ordinary names starting with `items`. Existing
row mutation, server authorization, immutable submissions and private-field
retention are preserved. English, Persian and Arabic page navigation/validation
captions use the existing frontend localization owner.

## Actual acceptance and retained attempts

The guarded 029 extension authors an owned form/workflow and edits literal scalar
and repeated fields through the actual UI. It returns named scalar and row
feedback, moves the corrected row through the existing collection API, saves
before resolving, resubmits and approves. A guarded read-only canonical check
verifies the stable row, original submission, hidden data and one decision per
task. No fixture response or copied opaque identifier substitutes for this flow.

Earlier real-service attempts retained in `services-attempt-1` through `-3`
exposed driver timing, an incorrect pristine Save expectation and whitespace in
rendered option labels. The driver requires enabled input elements, awaits the
actual Saved state and selects the exact rendered label after matching readable
whitespace. All ten scenarios subsequently passed without browser/service
diagnostics. That intermediate run served the earlier production bundle; it is
retained separately and does not qualify the final raw-input repair.

Browser attempt 1 had seventeen passes and one module import interrupted by a
reload before Save had settled. Attempt 2 used the stale bundle and reproduced
raw-input navigation; it was interrupted and retained. Attempt 3 confirmed Next
stayed on Count, then failed because its direct-child alert selector omitted the
existing section wrapper; it was interrupted and retained. Neither interrupted
run counts as acceptance. Final full regressions retain all cases and diagnostics
with no skips, retries, thresholds or production behavior weakened.

The authoritative completion receipt records the final ten-scenario reviewer
profile, existing workflow profile, 36 owning browser cases across three engines,
en/fa/ar and 390/1440px, and the full unchanged-source gate. It must preserve the
actual source hashes and production bundle manifest. Historical receipts are
unchanged; backend mapper/agent/team gaps, manual assistive-technology/device,
deployment and human acceptance remain open with their existing owners.

Before the final designer audit, the production-build owning regression passed all 36 cases in 2.7 minutes with
zero skips, retries, flaky results or diagnostics. Mobile screenshots in all three
languages were inspected; controls remain contained and translated, with named
fields rather than JSON. The current-bundle real-service rerun passed reviewer
10 and workflow 36 scenarios, exact frozen live paths/components agreement and
zero browser/service diagnostics. Both profiles kept functional frontend source
`a55c9586270b7e8cb0671c29b53fef480d1f28438fcc0a4e74a6c7c4ff81d421`
unchanged and the backend peer/runtime hash unchanged. Full-gate and bundle
identity qualification still require the completion receipt; these scoped passes
do not close backend-dependent or human/deployment gates.

The final adjacent-code audit additionally reproduced disabled expressions for a
calculated child of an ordinary object named `items` (one failing/eight passing
inspector tests). Inspector eligibility and primitive calculation defaults now
reuse the structural parser; actual repeated-row calculations retain their
registered-function restriction. The regression checks both literal-object
expression editing and the repeated-row restriction. The first complete gate was
interrupted for this repair after its 1,047 unit tests passed; its partial manifest
and logs remain in `full-check-interrupted`. It is not a successful final gate.
All owning browser and actual-service profiles must be rerun after rebuilding
this final designer change; the completion receipt qualifies their new exact
source and production assets.

The additional designer check initially exceeded the existing 400-line component
limit. Its unchanged calculation-result formatter now lives with the existing
form-calculations helper; the component reuses its typed scope signal and delegates
the formatter. No line-limit, lint, contract or test threshold was changed.

The subsequent complete run passed 1,048 unit tests and all eleven quality scopes,
then collected all 416 primary browser outcomes: 415 passed and one Firefox
1440px task-filter setup timed out. Its trace shows the test clicked the panel
while the initial inbox layout was settling, before the first request/saved-view
loads had completed; the panel stayed collapsed. The failed unchanged-source gate,
report, screenshot and trace are retained in `full-check-attempt-2`. This is not a
successful gate. The existing shared-pages test now waits for a confirmed task row
and enabled Refresh, clicks once and asserts expanded state before selecting a
filter. Payload assertions, supported fields, deadlines and retry policy remain
unchanged. Stress evidence and a new complete unchanged-source gate are required.
Only this unrelated Playwright setup and this journal change after the final
real-service runs: functional source remains
`8eb5ae02fe0096759536b554951ea23217b91a22d1f9f2fe8fe5e4a8b169fdee`.
The final receipt must compare this exact functional source and every production
JS/CSS path/byte hash; no service or owning-test result is silently relabeled.
