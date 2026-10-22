# APP-FE-008 / APP-FE-014 / APP-FE-015 — One saved user timezone

Date: 2026-10-19. Existing-owner continuation requested with the first remaining
capability group. Parent/master readiness is unchanged.

## Delivered behavior

The existing profile/workspace settings are the only timezone selector. Calendar,
new appointments and Dashboard inherit the persisted user setting; date/time fields
already reuse Locale and continue doing so. Read-only timezone labels and links to
profile settings explain the current context. English, Persian and Arabic labels
are supplied. No preference API, persisted default or reset contract changes.

Timed appointments open in the user's zone. A title/reminder-only edit preserves
the exact original instants (including fractions) and original schedule timezone.
A changed timed schedule uses the captured user zone, with existing DST gap/fold
validation. Explicit fold-offset changes count as edits even when the clock text
is unchanged; changing one endpoint retains the other endpoint exactly. All-day events retain their civil dates and original timezone. Drafts
and unchanged uncertain-command retries retain their captured intent when settings
change. Server authority, current refs and reminder replacement remain unchanged.

## Implementation and acceptance

Changed the existing Calendar page/editor, Dashboard, localization catalogs and
owned browser journeys. The shared profile timezone control and Preferences PATCH
adapter are reused. Native browser journeys now choose a timezone in profile
settings before exercising calendars/metrics; no hidden per-page selector or
unsupported preference field is added.

Focused timezone/Calendar/Dashboard checks initially passed 18 tests; an additional
DST-fold regression covers deliberate offset changes and exact untouched endpoints. The production build passed.
All six display-preference cases passed in Chromium, Firefox and WebKit with zero
browser diagnostics. Initial missing-browser-path/sandbox failures are retained;
one overlapping build invalidated a lazy chunk and another run exhausted its
existing deadline. These failed runs remain failures; no assertion, deadline,
retry or warning threshold was relaxed. Subsequent browser runs use the completed
build and the installed browser path, with conflicting color environment removed.

Actual Calendar/metrics/profile service scenarios and the complete final unchanged
source gate are required. Their native exits, source identities, retained failures
and final results belong to `artifacts/user-timezone/completion.json`; an absent or
partial receipt is not completion. Fixture-backed browser checks are not backend
acceptance. Manual assistive-technology, device, human visual/performance, hosted,
deployed and user acceptance remain separate evidence levels.

## Related capability work

The nested prior-output repair is recorded in
[APP-FE-023-NESTED-OUTPUT](APP-FE-023-NESTED-OUTPUT.md). The other first-group producer
contracts remain explicit in [the peer handoff](APP-FE-023-PEER-HANDOFF.md).

The supported four-profile service batch subsequently passed all 90 scenarios
(workflow 37, Calendar 7, analytics 6 and settings/foundations 40) without browser
or service diagnostics. It is intermediate evidence preceding the final fold-offset
repair. Retained failures also include an empty-range assumption that was invalid
in Apia, an outage draft outside the supported 366-day range and a relogin assertion
that expected an earlier saved timezone. The drivers now exercise actual local
dates and deliberately restore the original saved setting before that persistence
assertion. Exact stored all-day title/dates are checked in addition to rendering.
Final current-source reruns and complete gates remain governed by the receipt.

The complete frontend check subsequently found the required Arabic catalog placement,
the existing method-complexity ceiling, a route/draft unit timeout while rendering
an unrelated month grid, and older browser tests that still selected per-page zones.
All failed/partial check manifests and logs are retained. Arabic text now lives in
the authoritative JSON catalog; schedule construction is a focused method. The
route-coordination unit keeps the actual editor and guard with a minimal host;
full Calendar rendering remains covered independently. Browser setup saves the
user preference through profile controls and asserts no page-local selector exists.
All 28 affected Chromium/Firefox cases passed, with original assertions, deadlines,
zero retries and no diagnostics. No limit or required scenario was removed.

Three subsequent identical-source full checks hit long unit scheduling stalls in
different cases (route access/saved views, date-only Calendar/list query and a
shared temporal control). Native five-second deadlines remain unchanged; all
failures and the teardown diagnostic are retained. Strict frontend readiness is
BLOCKED until a complete clean gate is available. An independent complete browser
batch returned 425 passes and three failures: two obsolete Dashboard field counts
and one non-reproduced Firefox Studio reload console error. The Dashboard assertion
now checks the five remaining input fields plus the read-only zone/settings link;
all four focused Dashboard/Studio cases passed without diagnostics. That focused
pass does not erase the original failure or imply a clean whole-suite result.
Final command results and source qualification remain in the completion receipt.
