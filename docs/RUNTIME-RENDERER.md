# Runtime renderer — Steps 19–21 and 26

The requester editor, reviewer editor and development preview use the same `RuntimeForm` and recursive node renderer. They consume the actor-filtered `bpms.runtime/1` document, never a privileged authoring definition. The preview lives at `/operations/runtime-preview`; production file replacement removes its route, provider and fixture chunks.

## Support matrix

| Kind                         | Support                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| vertical, horizontal, grid   | Responsive layouts with localized labels                                                                                        |
| text, textarea               | Native labeled controls; strings remain strings                                                                                 |
| integer, number              | JSON numeric input; finite numbers and safe integers; invalid raw input blocks save without replacing the prior canonical value |
| date                         | Gregorian `YYYY-MM-DD` input                                                                                                    |
| datetime                     | Offset-bearing ISO string input; timezone is retained                                                                           |
| boolean                      | Missing, false, true and nullable null remain distinct                                                                          |
| choice, user, group          | Authorized paged options with typed JSON scalar keys; group means work-group selection                                          |
| calculated                   | Server-evaluated read-only value; permitted manual override/reset uses its dedicated command                                    |
| display                      | Escaped display label                                                                                                           |
| action                       | Rendered by the host from authorized declared actions; no invented outcome or local script                                      |
| repeater, table              | Stable nested rows with authorized add/remove/duplicate/reorder (Step 26)                                                       |
| media, attachment_collection | Governed private transfers, link/replace/remove/reorder (Step 26)                                                               |

The public configuration advertises all 20 implemented `primitive.<kind>/1` capabilities. Unknown advertisements are rejected. Unknown primitives block editing with a compatibility message. Declared multipage navigation is supported; remote `CLIENT_FETCH` option sources and authored navigation scripts remain unsupported. Native scalar controls share the existing typography, field wrapper, tokens and Tailwind layout. PrimeNG and Material remain available for other feature controls.

## Canonical values and validation

Property scope helpers distinguish missing, null, empty string, false and zero, merge nested edits immutably and escape RFC 6901 pointers. Decimal values represented as strings never pass through floating point conversion. Locale changes affect chrome and option labels, never canonical data or encoded keys. Null and removal are explicit actions. `/items` schema paths bind row controls through stable keys and current concrete indices; structural edits use collection commands.

Visible compiled field metadata supplies bounded immediate type, range, length, enum, required and date hints. Backend validation remains authoritative; complex authored patterns and arbitrary JavaScript are not evaluated. Server issues map to linked field controls after their `/data` prefix is removed. Unknown pointers remain in the safe feedback summary. Read-only and disabled fields do not accept edits; task saves contain only writable scopes and explicit deletion paths.

## Options and resolved behavior

Option queries use only the ordinary authorized request/task endpoints. Task queries pass the current named-view key; the backend validates that view and filters both its render tree and unsaved dependency data. Candidate pagination and selected-value lookup use separate queries so a selected value does not suppress new candidates. Selected results must share the candidate revision, dependency fingerprint, locale and generation. Canonical selections survive loading, errors and invalidated membership; missing candidates are visibly marked for review and the server rechecks membership.

Search waits 200 ms. Every dependency/locale/search/page change cancels the previous generation; late responses cannot publish. A revision or fingerprint change while paginating unchanged inputs fails explicitly. Loading, empty, blocked, unavailable and unsupported remote-source states differ.

The incremental [backend runtime patch](reference/backend-runtime-behavior.patch) resolves safe `runtime_state` visibility, enabled, required and override flags from pinned scalar rules on the server. Work-item reads evaluate the original pinned rules before projecting the named view, so stripping author metadata does not lose behavior. Rules, calculations and hidden dependencies stay private. Successful saves reread the authorized pinned runtime and replace evaluated canonical values. Override controls require explicit server authorization, a clean draft and a reason; uncertain non-idempotent outcomes require reconciliation.

## Conformance evidence

Versioned synthetic fixtures live in `src/app/features/forms/testing/runtime-fixtures.ts`. They define requester/reviewer/author/administrator/outsider roles, pinned versions, exact decimals, typed choices, named edit/correction/read-only contexts, row identity/attachment examples and all request, work-item and process states. Row, attachment and page behavior is now implemented; see [operations services](OPERATIONS-SERVICES.md).

Tests cover all 20 registry entries, supported primitive rendering, deferred compatibility states, label/error linkage, policy restrictions, actor reset, immutable canonical edits, option races and selected lookup, stale pins, malformed documents and negative authorization. Workspace command tests cover all six inboxes and complete/reject/return wire contracts. Firefox checks include both the disposable synthetic upstream and a real PostgreSQL-backed ordinary requester/reviewer journey through the session boundary.
