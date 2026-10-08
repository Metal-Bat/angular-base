# Backend list and CRUD design

Written before implementation, October 4, 2026. This specification uses the supplied Python search contract, the pinned `docs/reference/platform-openapi.json`, the running backend OpenAPI and the backend DTO allowlists. Python source changes that are absent from running OpenAPI are not treated as released API fields.

## Shared list contract

A list opens with its first server page already loaded. A heading and brief description sit on the left; the primary Create action sits at the logical end (upper right in English, upper left in Persian). Reports and refresh are secondary actions. Rows have named columns and an explicit Open action. Lists show loading, error/retry, empty and paging states without exposing raw response JSON as the default presentation.

The reusable query editor owns a draft, while the list owns a separate applied query. Apply validates the draft and fetches page 1; changing page preserves filters, sort priority and extras. Failed queries retain the visible applied result and its query. Refresh resends the applied page. Reports clone the applied query, never an unapplied draft, selected row, or separately reconstructed set of filters.

The canonical wire format is `{page, size, filters, sort_orders, ...supportedExtras}`. Page starts at 1, size is 1–100. Filters use `field_name`, `operation`, `value`; sort orders use exactly one of `field_name` or a nonempty `multi_field`, and `operation: asc|desc`. Sort order array order is priority; multi-field order is preserved. Backend stable tie-breaking remains authoritative.

Query fields come from the DTO-derived backend allowlist; response-only references and computed fields are not offered. Text operators: equal, notEqual, contains, notContains, startWith, endsWith, in, nin, isNull, isNotNull. Numeric/date operators also support gt, gte, lt, lte and between. Boolean fields support equal, notEqual, in, nin and null checks. Null checks serialize `value:null`; between requires exactly two values; membership requires a nonempty typed list. Dates use ISO wire values, and query parsing never uses translated display values. The editor provides explicit ordered sort rows, including comma-separated multi-field selection, with validation against the same allowlist.

Extras are endpoint-defined controls, not arbitrary JSON. `include_deleted` is supported for Select Users only. The running UserQuery does not expose the local Python source's newer `description`/`is_active` extras; these must not be sent until OpenAPI and generated contracts are updated. Report Admin Users accepts UserQuery, so no selector-only extra is forwarded. Admin Users uses UserQuery for both search and report; all supported filters/sorts/extras match exactly. Reports are queued for the authenticated requester; the UI shows the created report and links to My Reports, where status/download are managed.

## Users and Admin Users

Users is a separate feature at `/users`, using POST `/admin/users/select` with `response_format=page`. A fixed `is_superuser=false` filter partitions this directory from Admin Users. Selector rows contain `key` (opaque user reference) and `value` (username), not email or administrative data. Opening a row GETs `/admin/users/{ref_id}`. Create User opens a form at the top-end action; ordinary creation fixes `is_superuser=false`.

Admin Users lives in Administration at `/administration/admin-users`, uses POST `/admin/users/search` with a fixed `is_superuser=true` partition, and exposes Report Admin Users for its applied query. Creation fixes `is_superuser=true`. This UI partition does not replace backend permission/superuser restrictions. The old `/administration/users` link redirects to the Users directory. Each route remains guarded by `admin.users.manage`.

Details provide editable username, email, first and last names, with explicit Save/Cancel. Updates include the current versioned reference when the DTO accepts it. The URL target and payload are frozen before confirmation; stale versions retain edits and instruct the operator to reload. Accepted updates replace the stored reference with the returned reference. Soft delete requires confirmation and rereads current list state; deleted records display Restore User. Restore uses the current deleted record's reference. User History sits at the upper logical end and opens the shared list with that user's current reference.

Assign Role opens a modal containing the actual paginated Roles list; selection alone does not write. Save sends the chosen `role_name` to the current user, then closes and reloads detail. Reset Password is a separate transient-password modal; it sends `new_password` and clears the password on success, close and actor cleanup. Permissions independently gate role assignment and user management. Secrets are excluded from list/detail rendering and history payloads are redacted.

## Other resources

Roles and Permissions use the same list-first, create-at-top-end, row-detail and history pattern, with their own DTO fields and report services. Role permissions are an editable string list matching RoleCreate/UpdateDTO. Audit Events is read-only, with named event/result/date columns, a detail view and applied-query report action. Entity History requires an entity name and uses the shared query/table; history rows show operation, time, modifier and reason, with redacted before/after values in detail. My Reports uses ReportQuery and named file/status/date columns; ready reports retain the authorized download action and transient decryption password behavior from the existing report service.

Unsupported administration resource groups keep their existing console until they receive a resource definition. Existing generated operation IDs and transport/session cleanup remain the only API path; presentation never hardcodes network requests or stores actor data in browser storage.

## Confirmation and task inbox

Native modal confirmations must be centered in the viewport with an explicit fixed position, automatic margins and bounded scrollable dimensions. Cancel retains focus restoration and keyboard dismissal. Confirmation never hides a mutation behind a list-row click.

Task inbox uses a labelled view selector instead of the current row of tabs. Refresh is a compact labelled action at the upper logical end, disabled while loading. The selected server cartable and paging are preserved; polling remains bounded and does not discard the chosen view. Results use a readable table/list with status and Open action.

## Verification and reusable skill

Verify typed operators and list values, ordered/multi-field sorts, rejected extra fields, applied-query report snapshots, stale references, ordinary/admin partitioning, modal role selection without premature writes, password cleanup, delete/restore/history, centered confirmations, reports and inbox behavior. Use disposable account fixtures for mutations; live read-only checks establish contract reachability separately. Run production build, lint, formatting and relevant tests through mise. Keep graphify current.

After this reference implementation is verified, create a project CRUD skill that points to this specification, the query editor, resource definitions and fixtures. It must explain how to inspect OpenAPI plus DTO query allowlists, define operations/capabilities, preserve current opaque references, and add meaningful regression checks. It must not invent unsupported CRUD/report/restore operations.

## Studio resource extension

Studio uses the same list-first query/table design for forms, workflows, request types, clients, reusable components/data types and their versions/releases. Preserve its JSON document editing and immutable published/retired versions. Parent-scoped version lists require their declared parent reference; links from a root detail retain that scope. Reports use the applied scope and query and track the returned queued report without replacing the list. Detail screens expose Edit, Versions/Open designer, supported lifecycle actions, grants and history. Create/Edit use an explicit modal; a catalog no longer opens with a blank creation form underneath its list. Client secrets remain transient and explicitly revealed. Library discovery also uses a named table while keeping its compatibility and upgrade tools.

## October 4 verification evidence

The completed reference implementation passes production build, generated API checks, strict type checking and the full frontend unit suite. Disposable Chromium CRUD journeys exercise Users and Studio with real rendered controls. Records audits have zero violations/incomplete results in eight contexts; Studio audits have zero violations in nine contexts and one manual-review result for PrimeNG focus-trap sentinels. Desktop light/dark and mobile Persian RTL captures have no document overflow. Hosted CI and live backend mutation acceptance remain separate checks. The reusable skill is installed at `/home/erfan/.codex/skills/backend-crud/SKILL.md`.

## Human-readable record details

Opening a row presents identity/status, curated business information and activity cards, with Edit in the page action bar. Do not enumerate the entire DTO as detail fields or expose raw definition JSON. Opaque reference IDs are transport state, never record titles or summary metadata. Hide an internal `ref_id` and prefilled parent reference from form controls while preserving their values for writes. Audit payloads and history changes may use separate structured sections with references/secrets excluded. Workflow detail retains its read-only diagram.

## Table headers and pagination

SearchRequest tables expose server filters in each supported column header. Text, numbers, booleans, dates, datetimes, membership, ranges and nullable operations use the backend DTO field types. Applying or clearing a column resets the page to one and preserves unrelated filters, ordered sorts, endpoint extras and parent/user scopes. Sorting cycles ascending, descending and cleared. Compound sorts remain available in the collapsed Advanced filters panel above the table; these drafts synchronize when the applied query changes. Reports continue to use the applied query.

Pagination appears below each list, including role/history and Studio parent-selection dialogs. First, Previous, Next, Last and a labelled page-number input use the backend page count. Navigation rejects noninteger and out-of-range values and waits while requests run. Designer Library retains its separate search contract and shares the bottom pager without introducing unsupported column filters.

Validation uses disposable backend fixtures, including multiple pages and header filter/sort interactions; it does not establish authenticated live-backend or hosted CI execution.

## Contract field labels and required states

`shared/domain/field-labels.json` defines presentation names and Persian translations for CRUD fields. The generators and Studio schema adapter use the same `fieldLabel` function, retaining schema titles as a fallback. This changes display labels only: canonical keys, enum values, references, defaults and request bodies remain unchanged. Table/filter/detail/form labels share this vocabulary, including acronym formatting such as API and ID.

Required markers are inline with the label, visually hidden from screen readers as punctuation and paired with the translated Required text. Required state comes from the current OpenAPI schema. Boolean false remains valid rather than requiring a checkbox to be checked. Length limits appear below inputs as translated help; enum option labels are translated without changing option values. Identity/reference fields keep their existing visibility rules.

## Compact row actions

Shared lists use PrimeNG small tables with compact cell padding and icon buttons. The eye opens fresh detail; selector dialogs use a check icon. The pencil is available only when the resource supports update and the current row is editable. It fetches fresh detail before opening the edit dialog, checking actor state and the refreshed record's deletion or immutable status. The three-dot PrimeNG menu appears only for configured actions; History is offered where the resource supports it. Future resource-specific actions use the typed row action input/output contract. Accessible labels and tooltips describe icon buttons without expanding row height.

## Shared field layout

Use `app-control-field` for list controls, column filters and resource/Studio editors. Pass a unique `controlId` matching the projected input ID, the contract-derived label and required state. Project help text with `fieldHint`; preserve its ID and the input's `aria-describedby` when applicable. Labels and required markers share one line above the control; help sits below it. For PrimeNG controls using ARIA labeling, bind `ariaLabelledBy` to `controlId + '-label'` provided by the wrapper.

The shared field styles provide full-width 2.5rem controls, 2.25rem compact pagination inputs, consistent padding and visible focus. Textareas remain multiline and resizable. Studio editors use a responsive two-column grid, with document fields spanning both columns. Pagination stays centered below the list, with labeled icon navigation and a compact page jump. Advanced options use aligned filter/sort rows, separate query actions; the PrimeNG rows-per-page selector sits beside the page jump in the table footer. Empty filter/sort counters are hidden.

## Response error codes

Failed backend responses keep the existing inline explanation and also open one dismissible PrimeNG error notification. The shared transport reports HTTP failures and unsuccessful envelopes; binary errors are decoded safely. The public application code appears verbatim as a keyboard-accessible copy button. Only the code is copied, with localized success/failure feedback and a browser clipboard fallback. A new error replaces the previous notification; actor changes clear it. The notification is loaded on demand.

The session boundary forwards only the application code for failed sign-in/password-reset responses, excluding upstream messages and sensitive data. Boundary-owned failures use their public machine identifier when no application code exists. HTML errors and responses without a code do not invent one. UI labels support English, Persian and Arabic; codes retain their original spelling and LTR direction.

## Consistent typography

The shared typography stylesheet owns the language-aware font family used by headings, table content, form labels, native/PrimeNG controls and overlays. Material brand/plain typography and Tailwind sans utilities use the same variable. Ordinary multiline fields use the UI family; document/code editors explicitly use `font-mono`. Arabic and Persian headings use normal letter spacing so joined characters retain their intended appearance. Font sizes and weights preserve the heading hierarchy.

## Compact page headers

Resource context, title and description share a compact inline header beside page actions, rather than a stacked introduction above the list. The same header rules apply across Studio and record screens. On narrow screens the heading group wraps above actions. Studio home puts its catalog context in that header and omits the duplicate catalog heading.

## Advanced filter panel

The shared list editor uses a PrimeNG Panel with a named native PrimeNG button to show/hide the editor, with expanded/controls semantics. It groups filter conditions, ordered sorts and list settings into labeled sections, each with clear add actions and guidance for empty drafts. PrimeNG tags show only nonzero applied filter/sort counts. Collapsing preserves drafts while removing hidden controls from keyboard navigation. Reports still use the applied query, independent of pending edits.

## Shared dropdown and workflow palette updates

All native dropdown usages render through `app-select-control`, which shares PrimeNG Select/MultiSelect behavior while retaining translated projected options, form values, disabled state and labels. Membership filters use individual typed values with Add/Remove buttons. Advanced filters appear above every associated table, including selection and history dialogs. Refresh/reload controls show icons with accessible names. Copy controls show only outcome feedback; the notification panel omits its redundant visible title.

The workflow designer has a searchable registered-step palette beside the canvas. Click or drag a step into the canvas; new steps receive unique stable keys and retain catalog metadata. Drops account for pan and zoom. Pending JSON edits and immutable versions fence additions. Undo/redo and workspace saving include palette additions. Diagnostics highlight affected canvas nodes; invalid form and filter fields have inline indicators.

## Remaining administration catalogs and scoped actions

Work groups, integration connections, AI agents, task definitions, schedules and executions use the same generated record definitions, shared list query, table and fresh-detail layout. Tasks have separate navigation for definitions, schedules and executions. Query fields come from the backend query allowlists; editable fields and defaults come from the pinned request DTOs. Inactive work groups remain editable; published and retired AI agents do not expose draft edits or deletion.

Structured contract forms render objects as named fields, enums as shared dropdowns, arrays with Add/Remove and arbitrary maps with typed values. Nested objects span the form width. Validation reports the full field path, preserves booleans and numeric zero, and checks required fields, bounds, patterns, datetimes, unique values and allowed map keys. Schedule creation also enforces the backend's interval and clocked schedule invariants. Reference pickers use permitted paginated user/group, provider, connection, model, registered task and queue selectors. Model selection carries the selected connection.

Resource actions open focused dialogs and implicitly carry the current reference or execution task ID. Membership, connection verification/rotation/revocation/grants, AI publication and metadata, task execution and process control operations use their generated contracts. Mutations freeze inputs before review, retain uncertain-write input, clear accepted transient values and fence actor changes. Successful commands trigger a fresh state read; queued work is described as accepted rather than completed. Connection grants require exactly one user/group target and at least one capability. Read result paging retains the last successful query.

Processes use reference lookup because the backend provides detail and scoped control endpoints without a general process search endpoint. The page accepts a reference from its query string or input, exposes only permitted commands, and includes timeline/report and scheduled-action operations. A recovery-only actor can select an explicit target without making an unauthorized detail request. Route guards protect unfinished action inputs and actor cleanup clears private state.
