# Frontend usability rebuild — executable design contract and Sol 6.1 implementation prompt

**Revision 5.0 · 14 October 2026**  
**Deliverable:** one implementation handoff, not an applied patch.  
**Frontend main checked online:** `Metal-Bat/angular-base` → `6aba0a5a6fad8ed7f6d51918a390ee13c12d9ae2`.  
**Backend main checked online:** `Metal-Bat/async-fast-api-base` → `4a5ec27f9f14eba7ad7fd7bbfa5280a7ed77d272`.  
**Evidence:** the eight new 14 October screenshots, the prior nineteen screenshots, the supplied OpenAPI, the previous repair master, selected pinned source, and the primary design references below.

**Navigate:** [Agent instructions](#start) · [Global design](#d01) · [Tables](#d05) · [Workflow](#d06) · [Forms](#d07) · [Calendar](#d08) · [Dashboard](#d09) · [Agents and queries](#d10) · [Every-route migration](#d11) · [Verification](#d12) · [41 execution cards](#execution) · [58 retained IDs](#ownership)

<a id="start"></a>

## START HERE — instruction to the implementation agent

You are implementing this specification in the existing Angular application. Do not answer it by writing another plan, changing only documentation, adding a demo route, or reporting that controls already exist. Deliver changes on the real application routes, using the current backend and existing domain services. A functional helper plus an unattractive collection of buttons is not completion.

**Goal:** a non-programmer administrator can understand a record, choose an action, design a form, connect a workflow, configure an agent and find its permitted data without knowing JSON, schema class names, opaque references or library internals. The application must use a coherent visual language everywhere, not a polished screen surrounded by old layouts.

1. Read the current local `AGENTS.md`, `docs/BACKLOG.md`, `docs/delivery/FRONTEND-BACKLOG.md`, applicable installed skills, current decisions and this entire design contract. Inspect `git status`, local HEAD, the relevant working-tree diff and the generated producer identity. Preserve uncommitted work. Do not reset to the online SHA: the screenshots visibly include local changes not established by that SHA.
2. Use the local graph when `graphify-out/graph.json` exists. Follow the repository's pinned Node/pnpm/mise/Angular conventions. Verify the actual lockfile before using a library API. Public documentation may describe a newer major version.
3. Reproduce the screenshots on real routes at a recorded viewport and browser zoom. Inspect computed styles, component host sizing, pointer targets, font loading and the actual page/element scroll containers. Classify observed defects, reported interactions and unverified suspicions separately.
4. Refactor presentation composition where necessary. Establish the shared page header, field composition, list toolbar, detail sections, editor frame and overlay conventions in this specification. Preserve business feature ownership and existing transport, validation, identity, authorization and mutation semantics. Do not introduce a new frontend framework, universal CRUD engine, workflow engine or parallel form runtime.
5. Implement V02/V03/V11 and one real Users detail/edit/list slice first. Then build the workflow and form editors in the same editor frame. Use that working pattern to finish the agent/query workspace, calendar, dashboard and remaining routes. Do not wait for unrelated notification/calendar backend gaps before improving editor layouts.
6. Move and replace the old controls in the real templates. Do not merely hide old markup with CSS, add a second header above it, or leave a second live editor below the new workspace. Remove dead presentation paths only after proving feature parity. Unknown supported data must survive edits; unsupported features must be explicitly identified, not silently erased.
7. Keep the main workflow canvas visible during normal work. Keep a real form preview adjacent when the available width permits. Do not solve overcrowding by reducing fonts, shrinking every control, hiding functionality, or requiring browser zoom-out.
8. Extend the existing Playwright runner. Exercise actual pointer drags, port connections, endpoint reconnection, waypoint movement, context menus, keyboard alternatives, saves, conflicts and reloads. Do not substitute internal method calls, synthetic graph injection or forced clicks for interaction acceptance.
9. Inspect the actual before/after rendered screens and their states. A screenshot test protects a reviewed design; it does not decide whether the design is good. Record unresolved visual defects instead of accepting the current output as a new baseline. Do not claim human approval from an agent's self-review.
10. Run focused checks while working and the complete final `mise run check` on unchanged source, with the required paired services and browser scenarios. Preserve failed evidence. Report unavailable checks as NOT_RUN/BLOCKED, not passed. Backend D07 exceptions remain explicitly scoped; they do not waive frontend checks.
11. Update the existing owning APP task/change records and route-migration matrix. This file retains V01–V40, adds V41 for the already-existing dashboard scope, and retains all 58 original master IDs. These are different indexing levels, not 99 tasks.
12. Finish each implementation slice with changed filenames, actual source identity, before/after screenshots, test commands/results, remaining exact defects, and the next dependency-ready slice. Do not claim the entire product is complete because a shared component was merged.

**Never conclude “fixed” while any of these remain on an in-scope normal route:** a generic full-record edit modal; global object actions below the detail; a main “Private uploads” utility in the ordinary navigation; mandatory copied reference input; raw query JSON; duplicate synthetic answer forms below the builder; a giant selection checkbox panel above the workflow canvas; a dashboard whose main output is a vertical list of dates; or breadcrumb ancestors rendered only as non-navigable text.

A prompt cannot itself prove a usable implementation. Completion requires the visible, interactive and source-qualified evidence specified here.

---

## 1. Evidence, scope and what changed

### 1.1 This is a structural repair, not another spacing pass

The new screenshots show partial progress: the form tools are now tabbed and saved-view controls have become smaller. They also show that the former page composition remains: tool panels above/below an editor, placeholder-like field cards, persistent technical controls, weak data hierarchy, inconsistent action placement and calendar/dashboard screens that look like API test forms. Keep the progress and remove the structural causes.

**Source-qualified findings from this review:**

- `features/analytics/presentation/dashboard/dashboard.html` places labels and inputs as separate children of a two-column grid. The final Apply button occupies a grid cell. This is a concrete source explanation for the large label/control separation in the screenshot—not a measured CSS report.
- `features/analytics/presentation/metric-card/metric-card.html` renders a vertical sequence of date labels and width-percentage bars before a table. It is not a complete dashboard visualization. The backend contract already provides typed metric results; do not use an unavailable-backend explanation for this presentation work.
- `shared/styles/_typography.scss` already selects Inter for English, Yekan Bakh for Farsi and Noto Sans Arabic for Arabic. Verify loaded fonts, weights and computed sizes before adding another font. The screenshots do not prove that the font family itself failed to load.
- Backend `src/utils/pagination.py` has typed filter operations, field validation, typed values and ordered sorting. Its reviewed in-memory evaluation combines filters with `all(...)`; no nested boolean-group wire model is established by the supplied `SearchRequest`. Build the supported filter UI instead of a JSON input; do not invent OR groups, joins or SQL execution.
- Backend `src/apps/ai/domain/dto.py` allows agent-list filtering on `code`, `name`, `number`, `status` and `created_at`. Agent decisions, permitted tools/data and runtime tool approval are separate contracts. An agent-list query is not the agent's retrieval plan.

Pinned source paths in this document are actual source targets where noted. Proposed component names and proposed test names are explicitly marked as such. Directories are ownership boundaries to locate, not evidence that every proposed filename exists.

### 1.2 New screenshot register

| Evidence | Supplied image                   | What the pixels establish                                                                                                                                                                                            | What they do not establish                                                                 |
| -------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| S20      | `Screenshot_20261014_204659.png` | Translation editors, another synthetic-answer form and editable JSON remain below the builder.                                                                                                                       | Whether saving, validation or preview execution succeeds.                                  |
| S21      | `Screenshot_20261014_204731.png` | Three-column form workspace exists, but palette content is cramped; cards show generic “text” while preview shows Title/Amount/Reason; permanent before/after insertion strips consume height; version is PUBLISHED. | A published version should become editable, or the precise runtime label-resolution cause. |
| S22      | `Screenshot_20261014_204801.png` | Large checkbox-selection/action panel precedes the canvas; the right palette exposes a broken-looking translation key; nodes/ports are visually small.                                                               | A complete pointer-drag diagnosis.                                                         |
| S23      | `Screenshot_20261014_204832.png` | Large blank central area and detached keyboard-connection/graph/history tools below the main canvas.                                                                                                                 | Why the parent grid expanded; inspect computed layout locally.                             |
| S24      | `Screenshot_20261014_204902.png` | Saved-view controls improved; long technical codes dominate table width; repeated headings and small controls remain.                                                                                                | Whether server filtering, saved-view persistence or authorization is correct.              |
| S25      | `Screenshot_20261014_205009.png` | User detail values have weak hierarchy and tiny-looking text; Assign role/Reset password/Delete remain below the detail.                                                                                             | Whether “Administrator: No” is wrong; account names are not permission evidence.           |
| S26      | `Screenshot_20261014_205019.png` | Calendar shows date rows and raw settings rather than a calendar workspace; browser tab still says Users.                                                                                                            | Current event volume or the correctness of timezone calculations.                          |
| S27      | `Screenshot_20261014_205027.png` | Dashboard is a large query form followed by dates; primary controls are misaligned and browser tab still says Users.                                                                                                 | Whether the backend metric aggregation is wrong.                                           |

Drag failures, breadcrumb non-navigation, poor agent usability and private-upload misuse are also **user-reported journey defects**. Reproduce them locally. A static screenshot cannot prove an event handler did not run.

The online frontend main is still the 13 October SHA stated above. Do not describe the 14 October localhost screenshots as a verified build of that SHA. Record the actual local working-tree identity before making claims.

### 1.3 Boundaries of this handoff

This review created Markdown, examined supplied pixels and selected source, parsed the supplied OpenAPI and researched public primary sources. It did not run the application, Playwright, the backend, migrations, deployments or user acceptance. The available container has Node 22, not the repository's declared Node 24 toolchain; no mise/graphify run is claimed. File semantic search returned no results; the mounted master/OpenAPI were read directly. Do not copy historical environment failures or previous test passes into a new verification claim.

---

## 2. Design references: borrow the interaction pattern, not an entire product

Read the following examples before implementing their corresponding workspace. The detailed dimensions and wireframes in this specification are **proposed project design targets**, not copied product specifications or claims about current code.

| Ref | Primary source and working example                                                                                                                                                                                                                                                             | Apply here                                                                                                                                                                            | Do not import                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | [Carbon data-table guidance](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) and [specifications](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/specifications)                                                      | Coherent table toolbar, clear primary column, aligned row density, contextual row actions, bounded pagination.                                                                        | Carbon/React as another component framework.                                                                                                               |
| R02 | [PrimeNG Table](https://primeng.org/table)                                                                                                                                                                                                                                                     | Implement the selected pattern using the existing table library and shared adapter.                                                                                                   | Public examples' local/session storage behavior or a newer-major API without review.                                                                       |
| R03 | [Survey Creator end-user interface](https://surveyjs.io/survey-creator/documentation/end-user-guide/user-interface) and [toolbox](https://surveyjs.io/survey-creator/documentation/toolbox-customization)                                                                                      | Field palette, recognizable design controls, contextual adorners and properties.                                                                                                      | SurveyJS schema/runtime. [Survey Creator licensing](https://surveyjs.io/licensing) is commercial; it is a reference, not an installation instruction.      |
| R04 | [n8n's official connection documentation](https://github.com/n8n-io/n8n-docs/blob/main/docs/build/understand-workflows/workflow-components/connect-nodes-together.md)                                                                                                                          | Add/connect/configure around the diagram; visible directional ports and contextual commands.                                                                                          | n8n's lifecycle, credential handling, grouping restrictions or execution semantics.                                                                        |
| R05 | [Foblex connection-type examples](https://flow.foblex.com/examples/connection-types), [connection API](https://flow.foblex.com/docs/f-connection-component) and [waypoints](https://flow.foblex.com/docs/f-connection-waypoints-component)                                                     | Explicit smooth paths, endpoint reassignment, wider edge hit areas and editable routing points.                                                                                       | A second canvas engine. Verify the locally locked API; the reference documents include newer details.                                                      |
| R06 | [Foblex 19.3 release](https://flow.foblex.com/blog/foblex-flow-v19-3-0-strict-csp-support-waypoint-routing-and-new-diagnostics)                                                                                                                                                                | Investigate the installed integration before blaming library capability: this release discusses waypoint routing and precise drops.                                                   | A claim that those behaviors have passed in this application.                                                                                              |
| R07 | [Eclipse Layout Kernel](https://eclipse.dev/elk/) and [elkjs](https://github.com/kieler/elkjs)                                                                                                                                                                                                 | Reference for an explicit automatic-layout command that calculates positions independently of graph meaning.                                                                          | An engine rewrite, a service dependency or automatic relayout on every render.                                                                             |
| R08 | [Google's Calendar redesign announcement in its official weekly recap](https://workspaceupdates.googleblog.com/2024/10/release-notes-10-25-2024.html)                                                                                                                                          | The user's Google Calendar benchmark: legible hierarchy, coherent controls and real calendar space. This announcement is overview evidence, not a complete interaction specification. | Google branding, a Google account dependency or Google Calendar synchronization.                                                                           |
| R09 | [FullCalendar time-grid](https://fullcalendar.io/docs/timegrid-view), [day-grid](https://fullcalendar.io/docs/daygrid-view), [Angular integration](https://fullcalendar.io/docs/angular) and [event drop](https://fullcalendar.io/docs/eventDrop)                                              | A production calendar-rendering candidate for day/week/month views and deliberate event interactions.                                                                                 | Premium scheduler features or unsupported recurrence/invitations. [Standard plugins are MIT; Premium has separate terms](https://fullcalendar.io/license). |
| R10 | [Metabase graphical query editor](https://www.metabase.com/docs/latest/questions/query-builder/editor), [filters](https://www.metabase.com/docs/latest/questions/query-builder/filters) and [summaries](https://www.metabase.com/docs/latest/questions/query-builder/summarizing-and-grouping) | Guided source → typed conditions → ordering/limits → readable result. Use it as a visual reference for non-programmers.                                                               | Its SQL engine, joins, arbitrary calculations or aggregations not supported by this backend.                                                               |
| R11 | [WAI-ARIA breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) and [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)                                                                                                                                           | Navigable ancestor links, current-page semantics, keyboard-operated Actions menus and focus restoration.                                                                              | A text-only breadcrumb or select element that immediately runs a destructive command.                                                                      |
| R12 | [PrimeNG Popover](https://primeng.org/popover)                                                                                                                                                                                                                                                 | Anchored date/filter/column controls, through the installed supported API or existing CDK overlay seam.                                                                               | A screen-centered modal for an ordinary desktop date picker. Current public docs resolve to PrimeNG 22; verify PrimeNG 21 locally.                         |
| R13 | [Playwright actions](https://playwright.dev/docs/input) and [visual comparisons](https://playwright.dev/docs/test-snapshots)                                                                                                                                                                   | Actual gestures and reviewed, reproducible screenshots.                                                                                                                               | Forced clicks, automatic golden approval, masking broken controls or fixture-to-live promotion.                                                            |
| R14 | [WCAG dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)                                                                                                                                                                                                 | A click/tap alternative and keyboard access for drag-based commands.                                                                                                                  | Moving the alternative controls into a permanent giant panel that displaces the editor.                                                                    |

Public docs fetched in this research are not guaranteed to match every installed major. Some Google Help pages were inaccessible; Google-specific interaction details below are proposed from the user's requested calendar model, with FullCalendar's official view documentation as the concrete renderer reference. Do not pretend an inaccessible page was reviewed.

---

## 3. Shared design contract — mandatory across all routes

<a id="d01"></a>

### D01. Design tokens, typography and cascade repair

**Owners:** V02, V05, V06, V38. **Actual targets:** `src/styles.scss`; `src/app/shared/styles/_typography.scss`; existing `_console.scss`/field styles resolved from their imports; component styles for `record-summary`, `record-table`, forms and overlays. Audit the current font preparation script and served assets before editing font declarations.

Adopt these dimensions at a normal 100% browser scale as the starting design contract. Use rem for typography and logical dimensions; test actual computed CSS pixels. Respect user text scaling. These are minimum/target dimensions, not clipping heights for long translated content.

| Token / component                    | Default target                                                                                                                                | Compact or responsive treatment                                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Root size                            | Browser-respecting 100% base. Do not use `62.5%` or CSS zoom to shrink the application. Audit the existing Material font shorthand on `html`. | Density changes spacing, not a global text-size reduction.                 |
| Page title                           | 24–28 px, weight 600, line height 1.25–1.35.                                                                                                  | At least 22 px in narrow layouts.                                          |
| Section title                        | 18–20 px, weight 600.                                                                                                                         | No extra uppercase eyebrow unless it adds meaning.                         |
| Body, form values, instructions      | 16 px / approximately 24 px.                                                                                                                  | Dense table values may use 14 px / 20 px.                                  |
| Labels, buttons, tabs, table headers | 14 px / 20 px; labels weight 500.                                                                                                             | Do not reduce main controls to 10–12 px.                                   |
| Secondary metadata                   | 13 px / 18–20 px, sufficient contrast.                                                                                                        | Never style all object values as metadata.                                 |
| Inputs/buttons                       | 40 px minimum block size; content may grow.                                                                                                   | 36 px compact; 44 px touch targets.                                        |
| Icon controls                        | 36–40 px hit box around a 16–20 px glyph.                                                                                                     | 44 px touch. Icon meaning must have a visible tooltip and accessible name. |
| Textareas                            | 112 px useful initial height; resizable within the pane.                                                                                      | Long instructions can use 180–240 px. Not a 40 px one-line box.            |
| Table rows                           | 48 px target; header 48 px; related toolbar/paginator coherent.                                                                               | 40 px compact; 64 px for deliberate two-line primary cells.                |
| Content gutters                      | 24 px ordinary desktop; 16 px narrow.                                                                                                         | A single page owner supplies the gutter.                                   |
| Spacing                              | 4 / 8 / 12 / 16 / 24 / 32 px scale.                                                                                                           | Field label-to-control 6–8 px; field-to-field 16–20 px.                    |
| Surfaces                             | Page background, surface, raised overlay, selected state.                                                                                     | Stop wrapping each section in three nested bordered cards.                 |
| Corners                              | 8 px controls; 10–12 px cards; consistent dialogs.                                                                                            | Do not use different radii for every native/library control.               |

Keep existing font-family policy unless a measured defect justifies a change. Check `document.fonts`, Network errors, available weights, `font-synthesis`, inherited font size and loaded fallback in English/Farsi/Arabic. Use actual available/licensed files. Do not download a paid Persian font or distribute font files with the handoff. Avoid letter-spacing on connected Persian/Arabic text. Make native inputs, PrimeNG overlays and Material exceptions inherit the same family.

Use neutral surfaces and the user's selected accent for focus/selection/actions; do not make every panel an accent-colored box. Preserve light/dark/system and palette preferences. Verify contrast in both themes instead of declaring a screenshot WCAG-compliant by eye.

Fix the cascade at its owner: import order, Tailwind layers/preflight, Material root typography, PrimeNG tokens, existing console/field styles and component overrides. Avoid a growing final stylesheet of `!important` patches or selectors reaching arbitrary feature internals. A documented library adapter stylesheet may style that library's generated elements, scoped beneath the editor root.

**Reference CSS structure; adapt to existing component names, not a paste-only new stylesheet:**

```scss
:root {
  --ui-font-body: var(--workspace-font-family);
  --ui-text-body: 1rem;
  --ui-text-control: 0.875rem;
  --ui-text-meta: 0.8125rem;
  --ui-space-1: 0.25rem;
  --ui-space-2: 0.5rem;
  --ui-space-3: 0.75rem;
  --ui-space-4: 1rem;
  --ui-space-6: 1.5rem;
  --ui-control-height: 2.5rem;
  --ui-page-gutter: 1.5rem;
}
.ui-field {
  display: grid;
  gap: 0.375rem;
  min-inline-size: 0;
  align-content: start;
}
.ui-field__control {
  inline-size: 100%;
  min-inline-size: 0;
}
.ui-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem 1.5rem;
}
.ui-form-grid__wide {
  grid-column: 1 / -1;
}
.ui-field__label {
  font-size: var(--ui-text-control);
  font-weight: 500;
}
.ui-field__hint {
  font-size: var(--ui-text-meta);
}
@media (max-width: 48rem) {
  .ui-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Every form-grid child must be a complete label/control/help/error unit. **Never again make labels the entire left column and controls the entire right column**, as `dashboard.html` currently does. A two-column form means two complete fields per row.

**Acceptance:** computed styles match the selected density; no clipped text at 200% zoom; no horizontal clipping in fields; 14/16 px core text does not unexpectedly compute to a smaller value through root rem scaling; fonts are actually loaded or documented accessible fallbacks are used.

<a id="d02"></a>

### D02. Page archetypes and scroll ownership

Create or refactor the following **presentation responsibilities** through existing shared components. The names below are proposed architectural labels, not claims that these files already exist:

- `PageHeader`: breadcrumb, object identity, status/context, page-level actions.
- `RecordPageLayout`: list, detail and explicit page edit mode.
- `ListToolbar`: search, named view, filters, columns, density and permitted list actions.
- `EditorFrame`: persistent document bar, flexible primary surface, contextual dock and optional issue tray.
- `FieldShell`: associated label, input, description and errors.
- `DomainDetailSections`: feature-owned readable sections using shared field/value primitives.

Share layout and interaction primitives. Keep the agent's decision logic, workflow semantics, record mutations and calendar commands in their own features. Do not build an all-knowing `UniversalPageComponent` that inspects every DTO at runtime.

**Normal record page:** natural document scrolling with a sticky object action bar when the page becomes long. **Workflow editor:** available viewport with no outer document scroll needed to reach normal controls. **Form editor:** available viewport; form surface and preview may each scroll, with one scroll owner per pane. **Calendar:** period toolbar fixed within its workspace; time-grid body scrolls. **Dashboard:** natural document scrolling, not a fixed-height chart squeezed beneath five input rows.

Measure the actual application header/content area. Prefer CSS grid/flex available-height propagation and `min-block-size: 0`; use a measured CSS custom property only where a true viewport offset is necessary. Do not guess `100vh - 200px`, use large blank spacers, or put a fixed control behind the application header. Restore editor focus-mode navigation state when leaving the editor.

```scss
/* Structural sketch: apply to the actual app content slot. */
.editor-frame {
  block-size: 100%;
  min-block-size: 0;
  min-inline-size: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  container-type: inline-size;
}
.editor-frame__body {
  min-block-size: 0;
  min-inline-size: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 22rem;
}
.editor-frame__surface {
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
}
.editor-frame__dock {
  min-block-size: 0;
  min-inline-size: 0;
  overflow: auto;
}
```

This sketch does not establish an ancestor height by itself. Trace the full host chain through `router-outlet` to the app shell. Angular component hosts often need `display: block`/grid/flex plus minimum-size rules. A visual fix that works only in an isolated component preview is not accepted.

<a id="d03"></a>

### D03. Object header, actions, breadcrumbs and editing

**Existing targets:** `records/presentation/resource-page.html`, the existing `record-page-header` and `record-detail` owners, `studio/presentation/resource-catalog/{catalog-header,catalog-actions,catalog-content,catalog-editor}*`, `administration/presentation/resource-actions/*`, domain task/process/agent pages, and the actual shell breadcrumb owner located from routing.

Use this composition on every relevant detail page:

```text
Administration / Users / Jordan Lee                     (ancestors are links)
Jordan Lee                            [History] [Edit] [Actions ▾]
jordan.lee · Active                    optional: [☆] [Manage access]
───────────────────────────────────────────────────────────────────
Overview     Access & roles     Activity

Identity                              Account
Full name       Jordan Lee            Status            Active
Username        jordan.lee            Administrator     No
Email           jordan@example.test   Created           14 Oct 2026, 10:30
```

Synthetic example only; do not alter production records to match it. Show only fields and actions authorized for that object. Do not infer administrative power from its name.

**Object-level commands belong in the top-right action cluster on LTR screens, at the corresponding inline end in RTL.** Users must not be an exception: Assign role, Reset password and Delete move from below the record into `Actions ▾`. The same rule applies to tasks, schedules, processes, integrations, forms, workflows, request types, agents, reusable definitions and support records. History and Versions are first-class navigation affordances where relevant. Keep Edit or the main business action visible; less-frequent commands go in the menu, with destructive commands separated.

**Scope exceptions are intentional, not loopholes:** table-row actions stay in the row's trailing cell; field clear/remove stays beside that field; node/edge actions remain near the selected item; pan/zoom belongs to the canvas toolbar; pagination stays below the table. Do not move every button in the product into the page header.

An Actions control is a **menu button**. A menu choice identifies a command; commands with consequences/required inputs open their focused dialog or confirmation. Choosing an item never silently fires a destructive request. Navigation is a link, not a fake command. Use the existing command coordinator: no generic new `execute-anything` endpoint or presentation-owned HTTP switch.

**Ordinary create/edit is page mode, not a record-sized modal.** Keep the same identity and section structure; substitute controls for values; display Save changes and Cancel in the persistent action bar. Preserve drafts while navigating local tabs. Business actions may use a bounded dialog; field menus and date popovers are overlays, not full-record edit windows. Password reset remains a focused action dialog. Calendar full editing follows the same page/in-page edit rule.

**Breadcrumbs:** render a `nav` with a translated accessible name, an ordered trail, real router links for permitted ancestors and `aria-current="page"` on the current item. Separators are decorative. Do not make the chevron itself the only target. “Back to users/workflows” preserves the valid previous list context; direct entry has an explicit safe fallback. Never call blind history-back if it could leave the app or discard a draft without a guard. Do not generate ancestor links by splitting opaque URL strings.

Resolve readable object names/current references through existing authorized data. Missing or forbidden parents must not leak titles. Browser document titles update on every actual route and locale transition; Calendar/Dashboard must not retain Users. Verify browser Back/Forward, new-tab deep links, route reuse and source ref refresh.

**Edit errors:** validation remains beside the owning input; summary links focus that input. A stale write shows an in-page reconciliation panel with the local draft preserved. Provide inspect current state and deliberate reapply only through supported semantics. Do not automatically merge grants, workflow edges, external action parameters or AI policy. A toast with “reload” is not a recovery journey.

<a id="d04"></a>

### D04. Details, input types, readable data and inline media

A readable detail page is not a recursive flattening of JSON keys. Introduce feature-specific display sections over existing typed adapters. Retain the generic summary only for genuinely generic metadata, diagnostics or a temporary explicitly identified fallback.

Use label-above-value for normal summaries or a local two-column definition list **inside one bounded section**. Do not place a label at the left page edge and its short value 800 pixels away. Use meaningful groups such as Identity, Schedule, Result, Access and Activity. Show one primary title, not Workspace records → Resource → Record detail → Overview as four competing headings. Technical IDs and codes are secondary copyable details, never the main name when a readable name exists.

Use localized timestamps and explicit units; retain the full exact timestamp on demand. Duration can display `90 ms` rather than a long decimal of seconds, while retaining the authoritative unit/value. Counts, current states, worker acceptance and final business outcomes are different. Zero, false, empty text, explicit null and omitted data remain distinguishable where semantically important. Do not fabricate a dash for zero, a green success for queued work or a business approval from a worker success.

**Field control matrix:**

| Meaning                         | Required control                                                      | Anti-pattern to remove                                                                                      |
| ------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Short name/title                | Properly labeled text input.                                          | Raw schema-key label and unnecessary full-width clear row.                                                  |
| Explanation/reason/instructions | Normal-font multiline textarea.                                       | One-line field for paragraphs; JSON editor as multiline text substitute.                                    |
| Integer/decimal                 | Contract-aware numeric control with correct unit/precision.           | Coercing empty to zero, rounding monetary values or confusing string and numeric keys.                      |
| Boolean / finite choice         | Switch/checkbox/select/radio appropriate to meaning.                  | Typing `true`, enum wire keys or unsupported values by hand.                                                |
| User/group/form/model/reference | Authorized searchable picker with readable selected value.            | Opaque reference text box or copied code.                                                                   |
| Date/time                       | Shared anchored temporal picker and validated typed entry.            | Page-centered calendar for ordinary desktop selection.                                                      |
| File/image                      | In-place attachment/image control using the existing private service. | Visit Private uploads → copy reference → paste into this record.                                            |
| Dynamic condition               | Field/operator/typed-value row.                                       | User-authored query JSON or comma-separated field names.                                                    |
| Localized label                 | Locale tabs/paired fields with language names.                        | Repeated nested `Value 1`, arbitrary map-key inputs, or concatenating all translations as the main display. |

**In-place upload flow:** choose/drop file at its destination → validate client hints → call the existing private upload service → retain returned metadata/reference in component state → associate through the owning object's current-ref command → show attached only after that association is confirmed. The upload step and association step are technically separate; the user experiences one local flow with honest stage labels.

Show filename, size, type, authorized thumbnail, progress when real progress is available, cancel and per-file recovery. If the transport cannot report byte progress, use a labeled indeterminate state, not a fabricated percentage. Preserve the rest of the form when one file fails. Replacement must not discard the current image before success. A successful byte upload followed by a failed link is **Uploaded, not attached**; do not re-upload blindly on link retry. Cancellation is not proof that stored bytes were deleted. Do not create an unreviewed garbage-collection endpoint or delete shared uploads.

Use owning runtime media/attachment policies and `BinaryTransfer`/`CaseResources`; do not send confidential bytes directly to arbitrary URLs from the browser. Revoke temporary object URLs, cancel/ignore old actor callbacks and keep private payloads out of storage/logs/screenshots. Preserve server authorization on download. Apply this to avatar/logo/image/media/collection fields and any current integration that legitimately accepts uploaded media—not merely to request attachments.

Remove “Private uploads” from ordinary sidebar navigation once its normal consumers are integrated. Do not delete the media backend, break legitimate existing deep links, or remove a separately justified operator capability without migration. A standalone transfer utility is not an end-user document-management product. Its existence must not become a mandatory first step for another feature.

<a id="d05"></a>

### D05. Tables, saved views, filtering and favorites — one collection pattern

**Owners:** V07–V13, V36. **Actual targets:** `shared/ui/record-table/`, `shared/ui/list-query/`, `shared/ui/saved-views/`, `shared/ui/favorite-action/`, `features/records/presentation/favorites/`, `features/records/presentation/resource-page.html`, Studio `resource-catalog` and `catalog-extras`. Trace each consumer before changing shared inputs or events. **References:** R01/R02, R10/R11.

Use one page title and one compact table toolbar. The collection's purpose and primary Create action occupy the page header. Put applied query state, view selection and display settings immediately above the rows—not in a permanent form beneath a detail page. Remove the duplicate “Advanced filters” heading and enclosing decorative card that contribute no additional state.

**Target composition — illustrative names, not invented backend data:**

```text
Studio / Workflows
Workflows                                      [History where relevant] [+ Create]
Design and manage business processes.

[All workflows ▾]  [Search name…           ]  [Filters 2] [Sort 1] [Columns] [⋯]
  Active: Yes ×    Name contains: purchase ×                 Clear filters
───────────────────────────────────────────────────────────────────────────────
Name                              Access       Active       Created       ⋯
Purchase approval                 Open         Yes          11 Oct 2026   ⋯
  purchase_approval               (secondary code only when useful)
IT service request                Restricted   Yes          11 Oct 2026   ⋯
───────────────────────────────────────────────────────────────────────────────
Showing 1–20 of 146                           [20 / page ▾] [Previous] [1] [Next]
```

A name is the leading column and the normal navigation link. A long code goes in a secondary line, a hideable Code column, or the detail's technical section. Preserve the full value and copy affordance on demand; never shorten the canonical value sent to the API. A status chip has text and semantic contrast, not color alone. Dates are human-readable with the exact instant/timezone available on demand. Align numeric values to the inline end and use tabular numerals where available. Do not concatenate English/Farsi/Arabic into the main cell when the contract supplies a localized label; where the backend provides only one mixed free-text name, display that actual value and record the localization limitation rather than parsing it by slash.

**Sizing rules:** primary name 30–45% of useful table width; bounded metadata columns; action column approximately 48–64 px. These are responsive starting allocations, not hard widths that clip translation. No single technical code may force the entire page wider than its scroll container. Use the shared table's supported horizontal scrolling when legitimate columns need it; keep primary identity and row action discoverable. Do not shrink all cells to 10 px to avoid scrolling. Default table rows are 48 px; two-line names may use 64 px. Selectable rows, when needed, have an explicit checkbox column; a normal row link does not double as a bulk-action selection toggle.

**Row and page actions:** a trailing overflow menu provides less-common permitted row actions. The primary name opens detail. Keep an edit shortcut only when it is useful and has a label/tooltip; do not provide three indistinguishable unlabeled icons for every row. Bulk action appears in a contextual toolbar only after selection and only for operations with actual batch support. Never simulate a transactional bulk action with an unbounded client loop.

**Query behavior:** bind simple search to an actual supported field/operation. For a resource without cross-field search, label it “Search name” or the actual field. Do not implement page-local filtering over the currently loaded twenty rows or silently promise name-or-code semantics when the server only supports conjunction. Debounce safe reads and cancel/ignore old results; keep Apply for a multi-condition editor. Distinguish draft filters from applied filters. A failed query must retain input and show the previous result as stale, not change the result summary to the unsaved query. Preserve page size, allowed column order and filters when returning from detail. Reset page to one deliberately when a new filter is applied; use the API's page bounds and counts.

**Saved views:** display the current name and a dirty indicator beside the toolbar. A view menu offers Save as new, Update current, Rename, Make default and Manage views, each only when the contract permits. Selecting a view may apply its read query; confirm before discarding an unfinished filter configuration. Save/rename is a small focused action dialog with one name field, not a permanent editor. Column visibility/order belongs in an anchored Columns control with search, checkboxes and accessible reordering. Preserve the existing incompatible-view repair, current-ref, account isolation and uncertain-command semantics. The compact controls already visible in S24 are progress; integrate them into the shared toolbar rather than reverting to the previous large block.

**View invariants:** an immutable built-in “All …” view is not a user's persisted view. Resetting filters does not delete a saved view. A visual column change is not silently persisted as a new user default. Do not automatically migrate an incompatible saved query by deleting fields; show what needs repair.

**Favorite behavior:** star outline = authoritatively not saved; filled = authoritatively saved. Loading/unknown state is separate. Use a named button with `aria-pressed`, not an asterisk in a text input. Resolve existing favorite identity through current authorized collections/links, including off-page results; do not infer absence from one page. Preserve a stable resource target across revision refreshes without assuming `ref_id` strings are durable identities. An uncertain toggle stays pending/unknown until reconciled; rapid clicks do not queue contradictory writes.

The Favorites page uses the same list/card language: readable title link, kind, version where applicable, optional description and trailing star/menu. Add only supported search/filtering; an unavailable target gets safe guidance without revealing revoked details. It must not be a row of giant Open and Remove buttons. No new favorite categories or backend fields are required merely for appearance.

<a id="d06"></a>

### D06. Workflow designer — one direct-manipulation workspace

**Owners:** V15–V22. **Actual targets:** `features/studio/presentation/workflow-board/`; `features/studio/infrastructure/workflow-canvas/`, especially `workflow-canvas.html`, `.ts`, `.scss`, `canvas-navigation.ts`; existing palette/inspector/connection subcomponents; `features/studio/domain/canvas-editing.ts` and workflow workspace models. Locate the current routing/layout owner rather than inventing a parallel graph store. **References:** R03, R05–R07, R14.

#### D06.1 Geometry and placement

The editor is the page's principal work area. It must not be a card halfway down a scrolling settings document. Put the header, mode and save state above one flexible editor frame; keep the frame visible while its right dock changes content.

```text
Studio / Workflows / Purchase approval / Version 2
Purchase approval  [Draft]        [Versions] [History] [Validate] [Save] [Actions ▾]

[Select] [Pan] | [Undo] [Redo] | [Arrange ▾] | [Find step…]       [View options ▾]
┌───────────────────────────────────────────────────────────────┬───────────────────┐
│                                                               │ Steps  Properties │
│   [Start] ───╮    [Review purchase] ─── Approved ──╮            │ [Search steps…  ] │
│             ╰──▶                  ╰── Needs fixes ╰─▶ [End]   │ Human work        │
│                               ╰────▶ [Correction]             │  Review task   +  │
│                                        ╰─────────▶ Review     │ Automation        │
│                                                               │  Notification  +  │
│                                                               │  Transform     +  │
│                                                               │ …                 │
│ [−] [100%] [+] [Fit]                             [Minimap ▢]    │ Selected details  │
└───────────────────────────────────────────────────────────────┴───────────────────┘
Issues: 2 · Workspace saved · Executable version not yet promoted          [Open issues]
```

The right dock shows one active tab at a time: Steps, Properties or Issues. A selected-property form must not be appended below the whole Steps palette and stretch the workspace. The drawing above is an interaction/layout example, not the actual required business transitions. Render the configured graph exactly. Do not add branches or connect nodes because the sketch shows them.

On a normal desktop, collapse the global navigation to its existing accessible rail or provide Focus mode to gain working width. Use a right dock about 320–360 px wide with minimum useful width 288 px. At 1366×768 with Focus mode, the central canvas should remain roughly 850 px or wider and at least 480–520 px high after real chrome. Use actual available container size; these are validation targets for the reference layout, not a reason to break 200% text zoom. At constrained widths, use a toggleable dock rather than a squeezed canvas and a 170 px inspector. Keep dock tabs and footer controls within the frame. The dock body scrolls; it must not make the entire editor row as tall as all its property fields.

Remove the large Selection and connections checkbox panel above the canvas. Keep its accessibility outcome through real canvas selection and a compact Outline/Selection tab in the dock. Move keyboard connection controls to the selected edge/Connect section, reachable from a named toolbar action. Move history, validation issues, designer assistance and routing tools into named header actions, dock tabs or a bounded issues tray. **No permanent configuration tail below the canvas.** Do not remove capabilities when relocating them.

#### D06.2 Node cards and labels

At 100% canvas zoom, use a compact node roughly 220–260 px wide, 80–104 px high before extra ports; label 15–16 px semibold; metadata/port text at least 13 px. A port adds a deliberate row rather than overlapping the title. Use 12–16 px internal spacing, a distinct icon/type accent, clear selected/focused/invalid states, and a visible overflow affordance. End/start nodes can be smaller only if meaningful labels and hit targets remain usable.

Lead with the configured display name (“Review purchase”), then the localized type (“Human task”), not `HUMAN_TASK` as the only title. Technical node key is optional secondary information. Missing translation keys such as `step.ai_decision.name` must resolve to a safe readable fallback and an actionable localization defect; never wrap that key over three lines as the palette label. Exact-version entries with the same title need a version/category subtitle so three Notification entries are distinguishable. Do not deduplicate different executable versions by display name.

Ports are visibly directional and distinguish control from data by shape/label/line style as well as color. Provide 24 px or larger interaction regions around the visible sockets without accidentally enlarging all lines into overlapping targets. Display output names/outcomes near the relevant connector; never make the user memorize a remote dropdown value. Missing/incompatible ports have explicit explanation, not a silent failed drag.

#### D06.3 Pointer interaction contract

| Gesture                         | Required behavior                                                                                                                               | Cancel/failure behavior                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Drag a palette item             | A ghost with readable type follows the pointer; compatible canvas drop area is indicated; drop creates one node at the intended world position. | Escape/drop outside creates nothing. Dragging the palette's own scrollbar never creates a node. |
| Click Add / click-to-place      | Equivalent non-drag insertion at a deliberate canvas point or visible center; choose one documented behavior.                                   | Can cancel placement; no mysterious node at world origin.                                       |
| Drag a node header/body handle  | Move the intended node, or selected group, smoothly; connected paths follow during the gesture.                                                 | Escape restores original positions; no partial document mutation.                               |
| Ordinary node click             | Replace previous node/group selection and select this node.                                                                                     | Clicking an input/menu inside the node must not start a drag.                                   |
| Shift-click / marquee           | Toggle or collect the intended group; group movement uses one delta.                                                                            | Blank click clears; Escape cancels marquee; behavior stays consistent with dock outline.        |
| Drag output to compatible input | Show candidate target and validation; create a connection with explicit outcome/mapping semantics.                                              | Dropping nowhere creates nothing; invalid target leaves graph unchanged and explains why.       |
| Drag endpoint of selected edge  | Reconnect the chosen source/target while preserving supported label, outcome, condition, priority and mapping.                                  | Invalid or cancelled reassignment restores original edge, not an orphan.                        |
| Drag routing point              | Change only visual routing, not endpoints or execution conditions.                                                                              | Undo restores previous route; published inspection never persists a mutation.                   |
| Right-click item / blank        | Open menu for the actual pointer target, safely inside the viewport.                                                                            | Escape/outside dismiss restores focus; previous selection cannot receive the wrong command.     |

Reproduce user-reported drag failures in a **DRAFT with actual authority**, then separately verify PUBLISHED read-only behavior. Do not set `readOnly=false`, remove pending guards or spoof DRAFT as a shortcut. The draft gateway must be obvious enough that a person understands why the published version cannot move.

Trace the full event path: palette `dragstart`/payload → `dragover` allowance → `drop` coordinates → adapter callback → domain validation → workspace state → render → save/reopen. Inspect overlays, `pointer-events`, drag handles, event propagation and view transforms. Use the installed library's conversion utility where available; otherwise convert client coordinates relative to the canvas and invert its actual transform **once**. Do not divide by zoom twice. Test after pan, zoom, page/container scrolling and device scale changes.

Use the existing library event contract to distinguish continuous visual movement from gesture commit. Render immediate movement without serializing the whole graph to JSON or adding history on every mousemove. Commit one position/group delta at gesture end; cancel on lost capture/actor replacement. Do not infer finished drag from a fixed delay. Pan/zoom is navigation state and must not consume semantic undo steps. View persistence, if present, stays separate from graph editing.

#### D06.4 Smooth, editable connections

The user explicitly wants smooth arrows, not the current tightly overlapping straight segments. Set an explicit supported Foblex connection type rather than relying on its default. Prefer its built-in Bézier/adaptive curve for normal control edges and a clearly distinguishable compatible style for data mappings. Confirm exact `fType`/type constants in the installed `@foblex/flow` 19.3.0 before coding. The public reference shows multiple types; it does not authorize pasting an API from another release.

A rendering-only curve has rounded stroke joins/caps, a visible target arrowhead, sufficient contrast, and an invisible wider hit path aligned with the visible curve. Keep line width readable across practical zoom levels. Use library-supported selection hit tolerance, or an adapter-scoped hit target; do not add a huge transparent rectangle covering unrelated nodes. Edge click selects the **actual edge ID** and opens its properties. Parallel edges and return loops require distinct paths and labels—five connections must not look like two.

Prefer the built-in routing implementation over a custom SVG graph renderer. Where manual waypoints and the chosen curve type do not interoperate in this version, retain a documented supported smooth segmented/adaptive route for manually routed edges; do not display draggable handles that have no effect. Validate routing-point persistence and coordinate conversion. Ensure source-end reassignment is explicitly enabled where supported; a target-only default does not satisfy both-end reconnection.

Labels display localized outcome meaning where available and preserve canonical outcome keys. A selected edge exposes its source/target and applicable condition/priority/default in the dock. Make difficult overlapping edges selectable through the dock's readable connection list without requiring raw IDs.

**Explicit acceptance:** create two distinct outcomes from one task, inspect each line, reconnect one endpoint, move a routing point, undo, redo, save and reload. Verify persisted endpoints/conditions/pins did not change during routing-only operations. A click-to-connect test alone does not verify pointer wiring.

#### D06.5 Arrange automatically — a real command, not reset

Add `Arrange ▾` with an explicit default automatic arrangement and supported direction choice, initially Left to right and optionally Top to bottom. This computes positions using current node dimensions, port sides and graph structure; it does not rebuild the workflow. Fit view happens after layout without repeated zoom oscillation. Preserve intentional cycles as return paths, separate disconnected subgraphs, and avoid overlapping node bounding boxes. Use deterministic ordering for equal-ranked nodes.

First inventory the existing layout/group helpers. If they cannot deliver a bounded cycle/port-aware arrangement, isolate a candidate such as ELK behind the existing canvas adapter after dependency/license/bundle review. Run expensive layout off the UI thread where justified. A library that calculates positions is not a replacement workflow engine.

Offer an explicit scope where supported: entire graph or selected nodes. Arrange changes form one undoable workspace transaction. Manual routing may need resetting; disclose and scope that effect before applying. Never change node keys, steps, pins, data mappings, priority, default branches, published checksums or active processes. Compare graph content before/after, not merely node counts. The supplied `layout-reset` API clears saved visual layout; it is **not** an auto-layout calculation and must not be relabeled as one. Never confuse either operation with demo-environment reset.

Do not auto-arrange on selection, locale change, every node render, reopening an already saved layout, or each backend refresh. Read-only versions can offer a local temporary viewing arrangement only if clearly labeled as not saved; mutation controls remain unavailable.

#### D06.6 Configuration, menus and publication

The right dock switches between Steps, Properties and Issues; the selected item determines the contextual property controls. Give node metadata/configuration, inputs/outputs, data mappings and branch rules separate purposeful groups, not one giant recursive schema form. Keep valid unsaved property buffers while navigating the canvas. Selecting another item must apply a documented local commit policy or preserve the buffer; it must not silently discard it or freeze navigation.

A node menu includes Configure, Add next, Duplicate and Delete where permitted; an edge menu includes Inspect, Reconnect, compatible Insert step and Delete; blank canvas offers Add step, safe Paste if implemented, Select all and Fit; group menu offers supported duplicate/align/distribute/delete. Essential commands are also visible/keyboard reachable. Cut/copy/paste must use bounded safe workspace fragments, never credentials or private runtime data. Do not invent clipboard support as already delivered.

Keep published version viewing separate from draft editing. Show the exact version and a clearly labeled authorized draft-creation/open action using the existing lifecycle. Save workspace, validate, promote executable graph and publish are separate outcomes. Labels may explain technical wording (“Apply validated graph”) but must not skip the actual promotion command or imply saved WIP can execute. Stale saves preserve the draft and require supported reconciliation. Deleting a human-approval node must never automatically bypass it by reconnecting neighbors.

<a id="d07"></a>

### D07. Form designer — a usable form first, editor controls second

**Owners:** V23–V27, V06/V31/V39. **Actual targets:** `features/studio/presentation/form-builder/`, `form-canvas/`, `form-inspector/`, existing placement/geometry/behavior/localization controls and commands; `features/studio/domain/form-*`; shared `features/forms/presentation/runtime-form/`, `runtime-node/`, field wrappers and resource adapters. **Reference:** R04 for authoring affordances, not a request to install SurveyJS Creator.

#### D07.1 The exact workspace to build

The new three-panel arrangement in S21 is directionally correct. It still fails because its contents and widths behave like independent configuration forms. Do not count “three columns” as completed design.

```text
Studio / Forms / Purchase request / Version 2
Purchase request [Draft]      [Versions] [History] [Validate] [Save] [Actions ▾]
[Design] [Rules] [Languages] [Settings]                   [Preview: on] [Focus]
┌──────────────────────┬────────────────────────────────────┬─────────────────────┐
│ Add | Outline | Edit │ Page: Request details ▾    [+ Page] │ Client preview      │
│ [Search fields…    ] │                                    │ Entry ▾  English ▾  │
│                      │ Purchase request                   │ [Desktop] [Phone]   │
│ Common fields        │ Tell us what you need.             │                     │
│ Text        Number   │                                    │ Purchase request    │
│ Long text   Choice   │ ⋮⋮ Title *              [⋯]       │ Title *             │
│ Date        File     │    [Laptop replacement         ]  │ [Test request     ] │
│ Section     Table    │                                    │ Amount              │
│                      │    Amount                          │ [250.00           ] │
│ When selected:       │    [0.00                       ]  │ Reason              │
│ Label [Title      ]  │                                    │ [                  ]│
│ Required [on]        │    Reason                          │ [                  ]│
│ Help  [           ]  │    [                           ]  │                     │
│ Validation ▸         │    [                           ]  │ Preview only        │
│ Data binding ▸       │                 + Add field        │ No request created  │
└──────────────────────┴────────────────────────────────────┴─────────────────────┘
Draft changes not saved · 3 fields · 1 validation issue                  [Show issue]
```

The left-dock sketch illustrates alternative Add and Edit states; do not render both long panels simultaneously. Add, Outline and Edit share one tabbed area, and only the active pane is displayed. This is synthetic UI content, not a new canonical schema or assumed currency. The visual design surface and preview both use the **actual authored field meaning**. Do not substitute decorative answer lines and identical “text” labels for every component.

**Container-based sizing contract:** in Focus mode, show all three areas only when the editor's content container is at least approximately 1240 px wide: tools 272 px, visual surface at least 560 px, preview 360 px, two 16 px gaps (1224 px before outer padding). Increase useful design width on larger monitors rather than inflating empty padding. At roughly 960–1239 px, collapse the tools into a toggleable dock and retain design plus preview when both remain usable. Below that, Design/Preview becomes a real mode switch with preserved state, and properties use a drawer or tab; do not squeeze three columns into a tablet width. The global application sidebar must not steal another 240 px from the focused editor without a way to collapse it.

Use CSS container queries or a measured container state, not contradictory viewport breakpoints nested inside fractional grids. Give each pane `min-inline-size: 0`; content controls fill their pane without overflowing horizontally. A pane can scroll vertically; do not stack an inner palette scrollbar inside a second tiny accordion scrollbar. At 100% zoom, labels/controls follow D01. Test 1366×768, 1440×900, 1920×1080, 1024×768, 390×844 and 200% browser zoom with actual locale content.

#### D07.2 Make the design surface semantically accurate

Each field card displays the same resolved label, requiredness, help and control shape as its corresponding runtime field. In S21 the cards show “text” while the preview shows Title, Amount and Reason. Add a focused label-resolution regression across authoring label/localized message/canonical-binding fallback. Reuse or extract the existing pure resolver through the approved public seam; do not create a competing localization rule. Preserve a readable fallback for incomplete fields and expose their repair issue. Do not silently rename canonical keys to match display labels.

Use real-looking controls in the design surface, but keep **design mode** distinct from **answer-entry mode**. Clicking a design field selects it for editing; it does not submit data or launch an upload. Render the shared control presentation safely or provide a presentation-only field shell derived from the same resolved model. Do not nest interactive inputs in a large button. A transparent selection layer must not intercept the drag handle, overflow menu or assistive-technology semantics. Preview is the place where users enter test answers.

Display number fields as number controls, long text as a useful textarea, choices with their real options, dates with a recognizable input, attachments with a local attachment affordance, and collections with meaningful child columns/rows. An invisible renderer component plus a decorative pencil line does not meet this requirement. Preserve the runtime renderer as the canonical client implementation.

**Adorners:** show a compact drag handle and overflow menu when selected/hovered/focused. Keep Remove/Duplicate/Move commands scoped to the selected field. A selected card has a clear border, not a solid accent rectangle overwhelming the whole form. Use a small component-type chip when useful; do not make the type the main label. Empty forms/groups have a useful “Add a field” target. Normal resting fields have 16–24 px separation, not permanent `Insert before` and `Insert after` boxes around every node.

Insertion markers appear during drag, keyboard placement, or an explicit Add-between action. Reserve one thin line/slot at the intended target; hovering the marker can enlarge its hit area without adding a permanent band to document layout. Never derive correct drop order from the pointer crossing a text label alone. Test first/last positions, empty sections, nested grids, collections and scroll-while-dragging. Provide an explicit Move-to-section control for non-drag use.

#### D07.3 Field creation and properties for non-programmers

Clicking Text adds a valid field in the selected placement context and focuses its Label field. Generate a valid unused canonical key once. Offer advanced key/binding controls, but a first-time designer must not have to type `field`, `/properties/...`, a node key, JSON Schema or a reference to add a question. Validate unsupported bindings with meaningful guidance, and do not silently drop a field when it cannot be placed.

The left dock has Add, Outline and Edit tabs. Add shows compact searchable cards and categories; Outline is a hierarchy with readable labels and state icons; Edit is the selected field's inspector. Selecting a field opens Edit or an explicitly pinned inspector behavior, with its name in the tab heading. Preserve search and outline expansion across selection.

**Inspector groups:** General (label, help, required), Choices or Rows where applicable, Validation, Appearance, Behavior and Data binding. Show only applicable groups; choose a useful default expansion. Use purpose-built controls:

- Choice options: ordered rows with Label and stable Value, Add choice, move controls, localized labels; no recursive `Value 1` fieldsets. Distinguish static choices from approved dynamic source configuration.
- Numeric constraints: units/precision, min/max and applicable step; validate contradictions. Do not coerce empty input to zero or round canonical decimals silently.
- Tables/repeaters: child field selector/editor, row limits, permitted add/remove/reorder actions and stable row identity rules. Removing a visual placement is not automatically deleting canonical data.
- Attachments/media: accepted type/category, size/count and supported operations from the contract. No free-form raw policy JSON for standard rules. Preview remains simulated; actual upload works in the runtime field under the owning case policy.
- Layouts: supported column count, child span/position and nesting shown visually, with exact backend bounds. Do not invent breakpoints or serialize visual-only inspector state into canonical schema.
- Localization: label/help/error translations with English/Farsi/Arabic names and explicit missing/stale markers. Preserve supported parameter/plural entries; unsupported editor cases remain intact with a clear limitation rather than being overwritten as plain strings.

Placement duplication keeps existing placement-only semantics with fresh node identities and shared canonical binding. A separate “Create independent field” command, if implemented, must create new canonical identity deliberately and show impact. Do not quietly change the meaning of the existing Duplicate action.

#### D07.4 Preview must help, not consume the workspace

The preview header is compact: view/purpose, locale, device width and freshness. Use readable display labels (“Entry”, “Summary”, “Print”, “Correction” where supported), not raw `edit` and `en` as the only wording. Show a short “Preview only” note; move longer simulation/privacy explanations into an information popover. Remove the large always-present freshness banner; use a small Updating / Up to date / Preview error indicator. A failed refresh preserves a labeled previous preview and leaves the editor usable.

There is **one synthetic answer state owner**. Delete the duplicate full “Synthetic sample values” editor below the workspace once preview inputs cover those values. Keep an explicitly scoped advanced scenario editor for non-visible test context only where needed, behind a separate developer/test surface—not a second normal answer form. Expert JSON may remain in a dedicated gated diagnostic view where justified; it must not be required for authoring, previewing options or navigation.

Debounce/cancel bounded preview reads and use a monotonically increasing request generation plus the current document/version/actor identity to reject obsolete results. Preserve compatible test input when a field label changes; reconcile removed/changed types explicitly. A late response cannot overwrite a newer preview. Preview requests use the current valid authored document, not only the last saved version. Failed parsing of an unfinished property remains in its local buffer instead of repeatedly calling the server with invalid JSON.

Refresh preview separately from saving. A Preview button can remain as an explicit retry/refresh, not the only way to see ordinary valid edits. Network refresh must not disable the whole authoring frame. No preview operation may publish, create a request, approve work, upload real files or execute a provider. Test this by asserting no relevant side-effect requests, not by trusting a disclaimer.

The client-width switch changes actual preview layout constraints; it is not CSS scaling of a desktop screenshot. At a narrow width show the real runtime reflow. Keep sample data when changing view/locale where compatible. A 360 px dock is not proof of every mobile device; test actual widths and rendering direction.

#### D07.5 Rules, pages, translations and diagnostics stay in the frame

Use top-level Design / Rules / Languages / Settings tabs that share document state and Save/Cancel. They are not extra forms appended after the editor. Pages/sections live in the outline and page selector. Show declared view/action/navigation settings through typed controls. Do not invent a new form lifecycle or autosave behavior.

An ordinary rule reads: **When [Amount] [is greater than] [1000], [show] [Justification]**—only when the exact field/operator/effect is supported. The stable wire keys stay unchanged. Calculations use the supported registered functions/expressions, inputs and override policy; the browser must not become an unrestricted script evaluator. Dynamic choices use authorized source/field/context pickers with paging, typed keys and dependency cancellation. Option/navigation preview automatically derives the selected node pointer; users do not type it.

Validation opens a bounded issues tray with counts, severity, readable message and “Go to field/setting.” Clicking selects and scrolls to the target without losing unrelated edits. Raw server JSON is secondary technical detail, not the main repair experience. Missing/null/empty/zero/false must remain correct through label edits, reorder, save/reopen and corrections.

**Local editing transaction:** distinguish inspector buffer → valid authored-document change → saved draft → published version. Commit scalar text sensibly on blur/explicit Apply or a documented coalesced local policy; keep complex rule edits explicitly applicable. Group one logical edit into one undo step. Do not add one history entry per keystroke or auto-discard invalid input when selecting another field. The existing pinned read-only version still permits viewing and simulated answers, never definition mutation.

<a id="d08"></a>

### D08. Calendar — a calendar workspace, not a date-query form

**Owners:** V34/V35. **Actual targets:** `features/calendar/presentation/calendar-page/`, its existing CalendarViews and calendar editor; `shared/ui/temporal-control/`; `features/calendar/domain/` and infrastructure adapters; Operations route title/navigation. **References:** R08/R09/R12. This adopts the familiar Google Calendar interaction model without adding Google synchronization or changing backend scheduling.

#### D08.1 Layout and first impression

```text
Operations / Calendar
Calendar                               [Today] [‹] [›]  October 2026  [Week ▾] [+ Event]
┌────────────────────┬───────────────────────────────────────────────────────────────────┐
│ Mini month         │  Mon 12    Tue 13    Wed 14    Thu 15    Fri 16    Sat 17    Sun 18 │
│                    │────────────────────── All day / deadlines ────────────────────────│
│ Visible sources    │         [Contract review due]                                     │
│ ☑ My events        │ 08:00 ────────────────────────────────────────────────────────────│
│ ☑ Work deadlines   │ 09:00        [Planning]       [Supplier call]                     │
│ Eligible teams     │ 10:00 ────────────────────────────────────────────────────────────│
│ [Only supported]   │ 11:00                     ── current time                         │
│                    │ …                                                                 │
│ Timezone ▾         │ Click an event for details; only permitted events can be moved.  │
└────────────────────┴───────────────────────────────────────────────────────────────────┘
```

Events/names above are illustrative, not records to fabricate in the production UI. Initial view follows the existing supported preference; otherwise choose and document a safe local default. It must render a complete empty calendar grid when there are no events, not just seven boxes containing long date strings. Show weekday headings and short day numbers, highlight today and selected day separately, and visibly identify the current period.

The main toolbar contains Today, Previous period, Next period, period title and Day/Week/Month/Agenda selector. Settings such as timezone/calendar system are compact preferences or a settings popover, not the largest thing on the page. Use a searchable approved timezone control rather than a required raw IANA text field for routine use. Preserve the user's actual timezone, numbering and supported calendar preference; do not reset to UTC on every visit.

Month view is a coherent seven-column grid with 5–6 week rows as needed. Give each cell room for event chips (approximately 96–120 px at ordinary desktop height), compact overflow (“+3 more”), and in-context details. Adjacent-month days can be muted; do not render a different date format in every cell. Week/day views need a time axis, all-day lane, overlap layout and scroll-to-useful-time behavior. Agenda is a properly grouped event list with time, title, source and action—not only date headings when events exist.

On smaller screens collapse the mini-month/source rail first, preserve the toolbar and choose an appropriate supported view. At narrow phone widths, Agenda or Day can be more usable than compressing seven columns; expose the chosen view clearly and preserve state. RTL and the configured first day of week must have a tested meaning; do not merely reverse the entire DOM, including time numerals and identifiers.

#### D08.2 Event interaction and backend boundaries

Clicking an event opens a small anchored detail popover with readable title, time/range, source and relevant link. Only actual authorized manual events offer Edit/Delete. Selecting Edit opens the bounded in-page/full-page event editor with Save/Cancel, not a large generic record modal. Clicking an empty slot can start an event draft with the chosen date/time. A clear Create event button remains as the keyboard/non-drag alternative.

Dragging/resizing an editable manual event can be offered once the existing update contract and reminder preservation are verified. Use current references and a frozen command key/payload for that move. Distinguish saving, confirmed success, known failure and uncertain outcome. On a known rejected move restore the previous visual slot; on a timeout do not pretend the server definitely rejected it or repeatedly dispatch new commands. Reconcile through supported current reads/replay. A source-derived work deadline is not editable as a calendar event; dragging it must not change workflow state or silently produce a duplicate manual event.

Respect the supplied contract: timed values are aware instants with IANA timezone; all-day dates remain civil dates with an exclusive end; search uses a bounded half-open range, and DST gaps/folds are explicit. Changing display timezone must not alter event instants. Display an all-day October 14 event as October 14 even if the wire end date is October 15. Do not strip timezone information to fit a widget's local Date assumptions.

The current search contract is paginated (size up to 100) and range-bounded (up to 93 days). Implement bounded paging/deduplication for the visible range with cancellation and an explicit partial-data state if not all pages are loaded. Do not render “No events” or hide the loading state after fetching only page one. Increasing the view range must not trigger unbounded background loading.

Preserve current reminders deliberately. Historical reminder delivery rows are not necessarily the event's active configuration. Do not resave an event with an empty reminder list simply because a compact event DTO omits it. If safe read-modify-write needs an absent configuration projection, keep time-editing constrained and record the precise backend gap; the visual grid, period navigation and read-only calendar do not depend on that gap.

Use only active-membership-eligible team choices when the backend supports them. An administrator's group catalog is not proof that the actor may create team events. Missing membership-aware selection blocks that specific command, not the whole calendar redesign.

#### D08.3 Rendering technology and date popup

Inventory the current calendar renderer first. A candidate for a real time-grid/day-grid view is the Angular adapter for **FullCalendar Standard**; verify exact Angular compatibility, license, dependency pinning, styling and bundle cost before installation. Its public docs currently describe a different release context than this project's lock. Do not install Premium/resource scheduling, add an external calendar account or replace backend timers. An approved standard renderer lives behind the current calendar feature port and maps authorized DTOs; it does not own business permissions or reminders.

Where existing Persian/Arabic calendar display is already supported, preserve it. Do not assume a third-party date-grid supports every calendar system just because its text labels are localized. Prove round-trips between displayed calendar dates and the backend Gregorian civil contract; otherwise report the specific unsupported display feature instead of quietly changing semantics.

The shared ordinary desktop date control opens an **anchored non-modal popup** beside the actual input. Use the installed PrimeNG overlay/date component or existing CDK positioning seam. Configure collision handling/flip, scrolling and focus return. The popup must not be clipped by the card or placed under the app header. Render calendar navigation and keyboard day selection correctly; Escape closes and returns focus. Provide typed entry and validation, with a clear button only when clearing is permitted. Calendar-system controls belong in a compact field/settings pattern, not a second dropdown occupying half of every date field.

A touch-specific dialog may be a documented responsive variant, but the desktop default is not the centered Choose date modal shown in earlier evidence. Test a date input near every viewport edge, inside a scrolling pane, in RTL and during page scroll; an overlay appearing at `(0,0)` is a failure.

<a id="d09"></a>

### D09. Dashboard — actual metrics, useful charts and clear next actions

**Owners:** V41, V02/V06/V12/V38. **Actual targets inspected:** `features/analytics/presentation/dashboard/dashboard.html`, `features/analytics/presentation/metric-card/metric-card.html`; corresponding `.ts`/styles and existing analytics domain/adapters. **Backend boundary:** supplied `/api/v1/analytics/catalog` and `/api/v1/analytics/query` contracts. **Design reference:** the information hierarchy and shared toolbar principles in R01/R02; proposed dashboard composition below.

The existing two-column label/input form must become a compact filter toolbar. The existing date-per-row percentage-bar output must become an actual bounded chart area with axes, units, meaningful scale and an accessible data alternative. Do not remove the existing null/stale/unavailable distinctions in the process.

```text
Operations / Dashboard
Work overview                              [Last 30 days ▾] [Timezone ▾] [Refresh]
Visible to your current account · Updated 2 minutes ago

┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌────────────────────┐
│ Submitted      │ │ Active         │ │ Overdue work   │ │ Terminal duration  │
│ [actual count] │ │ [actual count] │ │ [actual count] │ │ [actual duration]  │
│ In date range  │ │ Current state  │ │ Current state  │ │ Valid samples only │
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────────┘

┌────────────────────────────────────────┐ ┌──────────────────────────────────┐
│ Submitted requests                     │ │ Work by status                  │
│ Daily count                            │ │ Actual supported breakdown      │
│    axis + real series plot             │ │ bars + labels + values          │
│    no series fabricated               │ │ or truthful unavailable state   │
│ [View data] [Open matching requests]    │ │ [Open matching work]             │
└────────────────────────────────────────┘ └──────────────────────────────────┘
```

The card names above correspond to registered keys in the supplied snapshot, but the UI must read current catalog availability and authority. Do not request an unauthorized metric, make up sample totals in the live screen or interpret a unavailable/null result as zero. “Active” is a current snapshot according to the contract, not a historical occupancy curve. Do not infer final business approval from terminal execution or a service receipt.

**Layout:** page header; one toolbar of coherent labeled controls; 2–4 KPI cards per row according to width; chart cards approximately 280–360 px high; an optional drill-down/list card. Default at least one readable summary and a real visualization in the first desktop viewport when data is available. At tablet widths use two columns; on mobile stack. Do not place chart labels in one page-wide grid column and their data in another. A count of one is still valid data: choose an honest scale and accessible data table, not inflated decorative percentages.

Provide date presets such as Today, Last 7 days, Last 30 days and Custom only by computing the actual supported civil range/timezone. Expose an understandable inclusive display period while serializing the required exclusive end correctly. Current contract supports daily granularity and none/status dimensions; do not add Hourly, Department, arbitrary Group by or revenue totals without a backend contract. Keep metric discovery for additional supported metrics in a secondary Customize/Metric control rather than making a user select one before seeing anything useful.

KPI values should be 28–36 px with unit/period metadata at 13–14 px. Counts use locale formatting. Durations choose understandable units without losing the authoritative value. An unavailable card states the reason safely and is not green; an empty count is `0`; an empty/unknown mean is a named unknown/no-samples state. Preserve `unknown_count` in a details tooltip or subtitle where relevant. Show stale data with last-confirmed timestamp, independent of a refresh failure.

**Chart implementation:** first assess an existing chart dependency/renderer and the precise reason the current bars are not visible/useful (for example actual zero buckets, flex shrink, token/cascade or width allocation). Replace the date list with a bounded axis-based SVG/canvas/chart adapter. Do not add a large chart package merely to draw four bars; if a library is justified, isolate/lazy-load it and review its license, accessibility and bundle budget. Use straight/step/time-appropriate data interpolation; decorative smoothing must not invent negative counts or fictitious intermediate values. A zero baseline matters for count bars. Treat missing values as gaps/unknown, not zeros.

Every chart has a title, period, unit, legend when necessary and a keyboard-readable data alternative. Tooltip values are useful but not the only access to the data. Chart/table modes share the same decoded result. Drill-down uses the returned authorized descriptor and existing list route/filters; never rebuild a broader query by guessing.

Load widgets through bounded concurrency (for example at most 2–3 reads after measurement), with cancellation and actor cleanup. Each widget has loading, empty, denied, unavailable, stale and failed states. One failed metric must not erase all successful widgets. No arbitrary extra polling loop, hidden provider calls or unbounded date fetches. Compare chart totals against the backend result and the supported drill-down population, not the first table page.

<a id="d10"></a>

### D10. Agent editor and visual query/context builder

**Owners:** V13, V28–V30 and V22. **Actual frontend entry points:** Administration `administration.routes.ts` routes agents through `recordRoute`; Records `resource-page`, record fields/schema controls; relevant Studio AI-node inspector and mapping controls. **Backend inspected:** `src/apps/ai/domain/dto.py`, `src/utils/pagination.py`; source discovery also located `src/apps/ai/domain/contracts.py` and `application/agent_service.py`. Read the latter fully for the selected implementation slice. **Reference:** R10 for a guided non-programmer query experience, not a license to create a new SQL engine.

#### D10.1 Separate four different meanings of “query”

| User task                                                       | Actual evidence available                                                                                                                               | Required UI                                                                                                     | Not authorized by this evidence                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Find an agent in the agents list                                | `AIAgentQuery` is a typed `SearchRequest` over code/name/number/status/created_at.                                                                      | The shared readable filter/sort builder with typed values.                                                      | Arbitrary SQL, joins or an agent runtime retrieval plan.                                                     |
| Ask the agent a question and define decisions                   | Supplied draft spec and `AIDecisionContract` / `AIInputDecision`.                                                                                       | Question editor; defined choice cards or a typed input binding for choices.                                     | Treating a decision answer as required human business approval.                                              |
| Configure which data, tools and retrieval sources are permitted | Supplied `AIPermittedData` plus backend trusted-tool policy.                                                                                            | Authorized pickers, bounded selections, classifications/redaction and a readable policy summary.                | Assuming that a source key grants access, or that free-form source text is a valid retrieval query.          |
| Design a saved/run-time retrieval query for an agent            | A generic typed search engine exists; a complete general-purpose saved-query/agent-retrieval authoring contract was **not established** in this review. | Inspect the exact owning backend service and DTOs, then implement a dedicated adapter for the supported subset. | Invented `/queries` routes, extra agent spec properties, nested OR syntax or executing SQL from the browser. |

Do not dodge the fourth task by implementing only a list filter and calling it “agent query builder.” Conversely, do not label all typed search functionality missing when the backend already provides it. Record capability-to-contract mappings before connecting the designer to execution. If current local backend work adds a richer query model, consume that verified version and update the contract table; do not infer it from this older snapshot.

#### D10.2 A dedicated agent page, not a recursive object inspector

```text
Administration / AI agents / Purchase triage
Purchase triage [Draft]                  [Versions] [History] [Save] [Actions ▾]

[Overview] [Instructions & decisions] [Data & tools] [Limits] [Test / evidence]

┌─────────────────────────────────────────────┬───────────────────────────────┐
│ What should this agent do?                   │ Configuration summary         │
│ [Review the purchase request and explain…]  │ Model: authorized selection   │
│                                             │ Data: 4 permitted fields      │
│ Decision question                           │ Tools: 1 approved tool        │
│ [Is this request ready for human review?]   │ Human approval: still required│
│                                             │ Version: exact draft/pin       │
│ Choices: [Defined here] [From input]         │                               │
│ Proceed       [Localized labels] [⋯]       │ Issues / missing requirements │
│ Needs detail  [Localized labels] [⋯]       │ Click to repair               │
│ [+ Add choice]                               │                               │
└─────────────────────────────────────────────┴───────────────────────────────┘
```

Use normal 16 px body text and generous multiline instruction fields, bounded readable content width, 280–320 px optional summary rail, and local validation. On narrow screens stack the summary after the main form. The detail page uses the same sections in read-only mode: purpose, exact model/provider, decision question/options, permitted fields/tools, effective limits and version. Do not show `spec · decision · options · #1 · labels · fa` as the main label hierarchy.

**Instructions & decisions:** show a human-readable explanation of each contract setting; keep machine codes hidden in Advanced identity when needed. For defined choices, use rows/cards with readable labels and descriptions. Locale tabs edit English/Farsi/Arabic separately with a missing-translation indicator. Stable choice keys are generated once and remain stable when labels change; a deliberate key change requires impact validation. Preserve configured choice order and bounds. A generic “Add field” map editor is not the correct localization interface.

For “Choices from input,” present a field/input picker that accepts the compatible array shape expected by `AIInputDecision.options_input_key`. Show the selected origin and required choice shape with synthetic examples; do not offer a text box named “options_input_key” as the normal task. Distinguish no binding, invalid binding, empty sample choices and valid choices. Static and input-defined decision variants must not coexist accidentally in one union payload.

**Model & connection:** use existing authorized provider/connection/model metadata and selectors. Show available/unavailable, capability and exact pin meaning; suggested model text is not executable credentials. A provider that cannot meet configured structured output/tools/spend policy is explained and disallowed where required. No copied connection reference and no live provider call on page load. Publish/test are deliberate commands with actual permission and lifecycle rules.

**Data & tools:** show permitted fields by business label and source, classified/redacted state and effective access. Use governed source/tool catalogs when actually available. A missing safe catalog is a precise backend dependency for that picker, not justification for accepting arbitrary keys or inventing a public list of private resources. Retain saved selections readably even if no longer eligible; identify the repair without leaking inaccessible details. Selected fields do not automatically become a new permission grant.

**Limits:** distinguish request count, token limits, elapsed time and supported spend policy. Use units and numeric constraints from the actual spec. “Unknown cost” is not zero. Do not claim an enforced provider billing cap when the metadata says it is not supported. The authority of the business reviewer stays separate from agent tool-approval decisions.

**Testing:** only offer the existing approved test/evaluation path. Pure configuration validation, synthetic form preview, AI execution and live tool/provider use are distinct modes with different side effects. Do not send synthetic samples to a paid provider automatically when an instruction changes. Show exact approved inputs, expected result structure, source/model versions, safe evidence and errors without exposing secrets or private prompt content unnecessarily.

#### D10.3 Concrete shared query-builder UI and adapter

Use the metaphor “Show records matching **all** these conditions” for the current flat conjunction. Each row is Field → Operator → typed Value. The field picker displays a localized business name, not a comma-separated key input. Changing the field resets incompatible operator/value deliberately; preserve the previous value in the local undo history where supported. Null checks hide the value control because the wire contract does not accept one.

```text
Filter agents
Show records matching ALL conditions

[Status       ▾] [is             ▾] [Published          ▾] [×]
[Name         ▾] [contains       ▾] [purchase              ] [×]
[Version      ▾] [at least       ▾] [2                     ] [×]
[+ Add condition]

Sort by   [Created date ▾] [Newest first ▾] [×]
          [Name         ▾] [A to Z       ▾] [×]    [+ Add sort]

Summary: Published agents with “purchase” in their name, version 2 or later.
         Newest first, then name.
[Cancel]                                                        [Apply filters]
```

**Corresponding backend payload example** for the inspected agent-list search contract, not JSON the end user must type and not a claim that matching records exist:

```json
{
  "page": 1,
  "size": 20,
  "filters": [
    { "field_name": "status", "operation": "equal", "value": "PUBLISHED" },
    { "field_name": "name", "operation": "contains", "value": "purchase" },
    { "field_name": "number", "operation": "gte", "value": 2 }
  ],
  "sort_orders": [
    { "field_name": "created_at", "operation": "desc" },
    { "field_name": "name", "operation": "asc" }
  ]
}
```

The exact existing route is `/api/v1/ai-agents/search` in the supplied API; compare the current generated operation before wiring it. Output property names remain snake_case. Existing operation **values** such as `notEqual`, `isNull` and `startWith` are not renamed merely to match a naming preference. Translate display labels, never canonical machine codes. Validation-only camel-case compatibility aliases in the backend do not authorize new frontend output aliases.

Use a local typed query editor model and an explicit adapter to the current wire model. A display row can have a stable local ID for focus/reorder; do not serialize that ID as an unsupported DTO field. Unit-test UI→wire→UI round-trips for every supported operator. Numeric `2` must not become string `"2"`; null checks must not send `"null"`; `false` is a valid value. IN/NOT IN use token/chip or multi-select input preserving scalar type; BETWEEN uses two correctly typed endpoints; ordered sorts use row move buttons rather than comma-separated field names. The existing `multi_field` syntax can be decoded as ordered same-direction rows and reserialized compatibly; do not silently mix `field_name` and `multi_field` in one object.

Current reviewed filters are AND-combined. Disable/omit nested OR groups, expression text, arbitrary schema traversal and joins unless the actual backend contract supports them. A visually sophisticated group editor that serializes incorrect flat filters is worse than a simpler correct one. Saved queries/views retain their actual schema version/context and repair semantics.

#### D10.4 Agent retrieval builder — make the supported plan understandable

Once the exact backend retrieval contract is verified, expose a staged editor with the following **conditional** structure:

```text
Data & tools / Retrieval
Source       [Authorized saved report / approved source ▾]
Purpose      [Why the agent needs this information…      ]   (only if supported)
Parameters   [Typed controls from the exact tool/query schema]
Filters      [Contract-supported condition builder]
Returned data[Allowed fields + redaction/classification summary]
Limit        [Bounded result count]

Readable plan: Read up to 5 permitted results from the selected saved report.
Safety: Only the selected source; required tool approval is unchanged.
[Validate configuration]       [Preview permitted sample — only when supported]
```

Every displayed setting must map to a real persisted field or clearly local non-persisted UI state. The “Purpose” or filter section is not an instruction to invent extra spec keys. Omit unsupported controls with an explanation in design review; do not store them secretly in instructions. The complete normal workflow must not require users to copy a report/source ID.

For the **known** `lookup_saved_report` tool described by the backend DTO, arguments are the owned `report_ref` and an integer `limit` from 1 to 10. Build a report picker and a bounded limit control for that schema; keep its exact required approval, expiry and version pin. That evidence does not establish that arbitrary data sources share this schema. A preview endpoint must be independently authorized/read-only and bounded; absent preview support is a conditional backend proposal, not a reason to execute the actual agent/tool as a substitute.

Record, per source/tool: actual discovery route, argument schema/version, permissions and actor context, returned data shape, allowed filters, bounds/timeouts, preview availability, approval policy and audit evidence. Validate untrusted retrieved text as data, not instructions to expand tools/permissions. Never let an attractive query builder imply that an agent may bypass server access checks, read unpublished/private fields, run unrestricted SQL or approve its own required business action.

<a id="d11"></a>

### D11. Refactor once and migrate every consumer — not one showcase page

**Owners:** V02–V14, V36/V38/V40. This section authorizes a cohesive presentation refactor within the existing architecture. It does not authorize replacing application services or every business screen with one configurable mega-component.

Establish a small set of shared composition seams, using existing components where they fit. Proposed role names below are **not claims that these files already exist**:

| Proposed shared responsibility        | Data it owns                                                                           | What it must not own                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| PageHeader / page action slots        | Title, breadcrumb, status, navigation links, primary action slot and overflow trigger. | Fetching arbitrary entities, inventing permissions, executing business commands.       |
| RecordPageLayout                      | Read/edit mode frame, section placement, sticky actions, validation-summary slot.      | A universal schema engine or global mutable record store.                              |
| ListToolbar + RecordTable composition | Current view, search/filter/sort/column affordances, displayed rows/paging.            | Inferring query grammar or filtering only the first page.                              |
| FieldShell                            | Label, help, control slot, validation and required/read-only semantics.                | Converting arbitrary data types or owning field business rules.                        |
| EditorFrame                           | Height/width/scroll contract, main surface, dock, toolbar and issue tray.              | Workflow/form document mutation or persistence.                                        |
| Feature-specific detail presenter     | Readable authorized groups and formatting for that feature.                            | Leaking private entity fields for visual symmetry or flattening every nested property. |
| Existing command presentation adapter | Display labels, availability reason and typed command-input view.                      | A new execute-any-command backend or weakened idempotency.                             |

Keep the existing source boundaries: `core` for infrastructure, `shared` for reusable presentation, `features/<owner>` for domain/application/infrastructure/presentation behavior. Reuse public feature seams instead of importing another feature's private component to steal its service. Shared form runtime primitives and editor presentation should have an intentional dependency direction. Remove duplicate styles/controllers only after every owning consumer is migrated and tested.

**Required route adoption inventory** — expand from the actual route tables and generated resource definitions so none are forgotten:

| Surface / actual entry family                          | Current owner to trace                                                         | Mandatory adopted behavior                                                                            | Evidence before marking migrated                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `/users` and administration user redirects             | Records `resource-page`, record headers/details/fields; Administration routes. | Real breadcrumb, name-first detail, full-page edit, Assign role/Reset password/Delete in top Actions. | Open real row, edit/cancel/save, role/password/delete dialogs, history, Back.                |
| Roles, permissions, groups and members                 | Administration record routes, pickers and existing role/group components.      | Same header/detail/action frame with domain-specific grants/members.                                  | Authorized and forbidden cases, bounded member selection, stale recovery.                    |
| AI agents                                              | Administration agent record entry and current AI adapters.                     | Dedicated D10 page, no recursive edit modal/dump.                                                     | Defined/input choices, model selection, policy preservation, exact saved variant.            |
| Integration connections and step types                 | Administration + Studio typed inspectors.                                      | Purposeful config/detail sections, secret handling, exact versions, top actions.                      | No secret leakage; unavailable/published behavior; typed validation.                         |
| Task definitions/schedules/executions                  | Existing `tasks/definitions`, `tasks/schedules`, `tasks/executions` records.   | Human-readable run result and schedule; object actions in header, focused command dialog.             | Retry/revoke uncertainty and actual lifecycle restrictions.                                  |
| `/administration/processes`                            | Existing `process-controls`, operations tracking/destination adapters.         | Contextual authorized discovery, readable process/result view, top actions.                           | No raw-reference requirement in normal journey; filtered reviewer still denied broader data. |
| Studio forms/workflows and their versions              | `resource-catalog`, headers/content/actions/editor/extras.                     | Name-first list/details, compact views, top History/Versions/Access, full-page metadata edit.         | Draft/published pins, create/edit/list state restored, no orphan extras below detail.        |
| Workflow editor                                        | `workflow-board`, `workflow-canvas`, node and mapping owners.                  | D06 one-frame direct manipulation.                                                                    | Real gestures, routing, Arrange/Undo, exact save/reopen.                                     |
| Form editor + saved form Display                       | `form-builder`, `form-canvas`, runtime preview/display owners.                 | D07 authoring; saved Display remains a separate read-only purpose.                                    | Label parity, one answer state, canonical preservation, no duplicate tail.                   |
| Components/data types/reusable library                 | Current library/catalog owners.                                                | Preview/meaning-first discovery, clear exact version and use action.                                  | Select a real compatible published item; no copied reference.                                |
| Clients/releases/request types                         | Existing Studio/Administration catalogs and variants.                          | Same frames with allowed client/version/eligibility controls.                                         | Current refs, client restrictions, secret/publish lifecycle retained.                        |
| My requests/task inbox/request form/review             | Operations list/detail/runtime/work-item owners.                               | Meaningful lists and result states; correct primary business action; in-place attachments.            | Claim races, correction, visibility, submission and uncertain reply recovery.                |
| Reports/history/audit/support                          | Records, support and existing report presenters.                               | Useful tables/details, top actions where applicable, private downloads.                               | Real paging/filters and safe failure evidence; no false completed reports.                   |
| Calendar                                               | Calendar feature + shared temporal input.                                      | D08 period workspace and anchored picker.                                                             | Empty/populated/overlap/DST/read-only source + event edit.                                   |
| Dashboard                                              | Analytics feature.                                                             | D09 KPI/chart layout and supported drill-down.                                                        | Values/units/nulls and current authorized counts verified.                                   |
| Favorites and saved views                              | Shared personal collections and Favorites route.                               | Star + readable collection; compact collection-only view tools.                                       | Existing/off-page favorite status, account cleanup, incompatible view repair.                |
| Profile/preferences/avatar and private-media consumers | Existing account owners, runtime resources, `BinaryTransfer`.                  | Same field/section language, in-place private upload, correct saved defaults.                         | Upload/link/error/actor change without copied references.                                    |
| App shell/breadcrumb/route titles                      | Resolve actual shell/router composition from app bootstrap and route files.    | Real ancestor links, current titles, accessible Focus mode, no ordinary Private uploads shortcut.     | Every migrated route and locale, direct entry and Back/Forward.                              |

Do not assume every resource supports History, Versions, Delete or Publish. The header exposes only actual operations with their current authorization/lifecycle. Consistency is consistent placement and meaning, not identical buttons everywhere.

**Migration ledger required in the existing change-record/delivery owner:** route; current component; selected page archetype; old presentation removed; new shared pattern; typed detail presenter; action locations; fields/media/query coverage; before/after capture; tests and evidence level; outstanding issues. A shared component merged while most routes still use old markup is not a completed migration.

A route family's metadata-driven generation must be tested with several materially different members, not only one happy-path user record. Validate both explicit Users-specific actions and generic `ResourceActions` consumers. Before closing V03, search actual templates for lower-page Assign role/Reset password/Delete/Versions/History and inspect every legitimate match. Do not delete by text search blindly; local row/field commands are different scopes.

<a id="d12"></a>

### D12. Visual and interaction verification — completion requires what the person sees

**Owners:** V01/V37–V40. The existing runner is already declared in `package.json` and `playwright.config.ts`. The inspected Studio file contains fixture-backed production-page tests; retain their value and expand coverage. They are not real-backend acceptance and currently do not establish all the reported pointer interactions.

#### D12.1 Four independent evidence layers

1. **Domain/contract:** pure transformations and serializers preserve values, identity, versions, bounds and operation semantics.
2. **Actual rendered interaction:** real DOM input, pointer, keyboard, focus, overlay geometry and route behavior in Playwright; clearly identify fixture-backed or real services.
3. **Paired journey:** actual HTTP/server authorization, current references, database concurrency, private storage, workers and outcomes relevant to that slice. No seeded finished graph is promoted to authoring acceptance.
4. **Human visual/usability acceptance:** inspect whether the actual output is understandable and workable. An agent's self-review may identify defects but cannot supply the user's approval or manual assistive-technology acceptance.

For a slice, report each layer independently. A missing peer dependency may block integrated closure but not ordinary frontend implementation. A source declaration that a callback exists is not a successful drag. A screenshot comparison is not proof that a novice can build a workflow.

#### D12.2 Required visual matrix and fixtures

Capture full viewport and relevant pane states at 1366×768, 1440×900, 1920×1080, 1024×768 and 390×844. Test 200% browser/text zoom and keyboard access separately; do not assume a lower-resolution screenshot simulates zoom. Use English/LTR and Farsi/RTL for all changed shared patterns; include Arabic on preserved Arabic-enabled routes. Test light and dark for shared tokens, overlays and the pilot pages. Record browser engine/version, OS, device scale, zoom, theme, density, locale and font readiness.

Synthetic fixtures must include short and very long labels, 0/false/null/empty/omitted values, empty and multiple pages, forbidden/stale/deleted candidates, selected and unselected states, error messages, long instructions, 20+ workflow nodes, branching/return loops, collections, attachments, and loaded/unavailable metric populations. Use at least one realistic end-to-end reference journey; do not rely only on three fields and two nodes.

For each new screenshot, inspect the pixels before approving a baseline. Render at normal size, not only a tiny montage. Approve a comparison only after known defects have been repaired. Fix fonts/timezones/test clocks/data to reduce noise; never mask labels, validation, toolbars, graph edges or the failing region to achieve a match. Keep any narrowly masked volatile timestamp/identity documented. Do not increase diff tolerances or regenerate every golden file to conceal a regression.

**Geometry checks complement screenshots:** no page-wide horizontal overflow; no clipped required labels or controls; primary actions and breadcrumbs visible; field label/control proximity; editor main surface/dock within the available frame; overlay not behind header; no large blank container created by a growing inspector; main typography not shrunk; no duplicate visible editor/state owner. A DOM element merely existing below ten screens of scroll does not satisfy visible placement.

#### D12.3 Required acceptance scenarios

| Test                         | Execute through real controls                                                      | Observable acceptance                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| T01 Header propagation       | Visit Users, a task execution, agent, workflow detail and request detail.          | Same object-action placement; no lower-page duplicate commands; only allowed actions.                     |
| T02 User edit                | Open existing user → Edit → change valid field → Cancel; repeat and Save.          | Page/in-page edit, not record modal; input retained on error; returned current ref adopted.               |
| T03 Navigation               | Ancestor breadcrumb, Back to list, browser Back/Forward and direct entry.          | Correct destination/state; no Users title on Calendar/Dashboard; unsaved guard works.                     |
| T04 Fonts/density            | Toggle supported theme/locale/density.                                             | Correct loaded family/weights, readable values, controls do not shrink below baseline; no clipped glyphs. |
| T05 Query inputs             | Add boolean/number/text/date/IN/null conditions and ordered sorts.                 | Correct typed wire values, explicit ALL semantics, no comma-key or JSON requirement.                      |
| T06 Saved views              | Save, apply, update, default, column change, incompatible repair.                  | Compact toolbar, truthful dirty state, exact replay/current-ref behavior.                                 |
| T07 Favorites                | Star an object, reopen it, find it off-page, unstar, switch actor.                 | Authoritative state; no local false negative or data leak.                                                |
| T08 Access                   | Open Access action → choose authorized person/group → grant/revoke.                | Readable picker, current permission meaning and safe stale recovery.                                      |
| T09 Editable gateway         | Open published form/workflow then authorized draft path.                           | Published remains immutable; editing is discoverable; correct draft/pin.                                  |
| T10 Canvas frame             | Open graph, select long-config node and expand issue controls.                     | Main surface stays in viewport; no top checkbox wall/bottom configuration tail.                           |
| T11 Palette pointer drop     | Drag a real palette card after pan/zoom and dock scroll.                           | Exactly one intended node at expected position; Escape/outside produces none.                             |
| T12 Node drag                | Pointer-drag node by clear distance; Undo/Redo.                                    | Visual and persisted position move; edges follow; one semantic history step.                              |
| T13 Group/marquee            | Select two via Shift and via marquee; move group; ordinary-click third.            | One coherent selected set, same movement delta, subsequent command targets third only.                    |
| T14 Create control edge      | Drag actual source socket to target; choose explicit supported outcome.            | Correct edge/outcome; incompatible/drop-outside leaves original graph.                                    |
| T15 Create data edge         | Pair actual compatible data ports.                                                 | Correct direction/type/mapping; control/data not conflated.                                               |
| T16 Reconnect ends           | Select edge; move target then source endpoint.                                     | Both supported ends work; condition/priority/pins retained; cancel invalid leaves old edge.               |
| T17 Route line               | Select edge → add/move/remove waypoint → save/reopen.                              | Smooth supported routing changes only; graph endpoints unchanged.                                         |
| T18 Arrange                  | Explicit automatic layout → Undo → Redo → Save/reopen.                             | Nodes non-overlapping in test graph; cycles readable; deterministic; graph meaning unchanged.             |
| T19 Menus                    | Right-click node/edge/group/blank; use keyboard menu alternative.                  | Correct menu target, position, Escape and focus; no previous-selection command.                           |
| T20 Pending inspector        | Enter incomplete config then pan/find another relevant area.                       | No data loss or navigation freeze; unfinished buffer repairable.                                          |
| T21 Form labels              | Open localized existing form; compare card and preview labels.                     | Title/Amount/Reason do not become generic “text”; required/help/type parity.                              |
| T22 Field insertion          | Click/add and pointer-drop before/after/inside empty/nested layout.                | Correct order and identity; insertion bands not permanently occupying resting form.                       |
| T23 Reparent/duplicate       | Move/copy nested placement; Undo/Redo; save/reopen.                                | Fresh placement identities, intentional shared data binding, no cycles or value loss.                     |
| T24 Properties               | Configure choices, numbers, validation, media and collection rows.                 | Purposeful controls; no ordinary raw JSON; correct current schema serialization.                          |
| T25 Preview race             | Enter sample → change label → send two out-of-order preview reads.                 | Sample retained, newer design wins, no main editor lock or duplicate sample form.                         |
| T26 Rules/languages          | Configure supported rule, translated label and page/view.                          | All inside frame; pointer diagnostics navigate to repair; canonical keys preserved.                       |
| T27 Form conformance         | Exercise every declared primitive through applicable save/reopen/runtime cases.    | Full versioned matrix; unsupported cases reported, not silently substituted.                              |
| T28 Agent page               | Open agent detail/edit; configure static and input-defined choices.                | No giant recursive modal/dump; correct exclusive variant and readable summary.                            |
| T29 Agent access             | Choose model/tool/data sources; revoke eligibility/refresh.                        | Safe unavailable state; no arbitrary keys or false execution permission.                                  |
| T30 Retrieval parameters     | Configure a supported source/tool with typed parameters.                           | Real contract mapping; no hidden SQL; unsupported richer query marked as gap.                             |
| T31 In-place media           | Upload and associate a file/image in its owning field.                             | No Private uploads navigation/copy reference; label stage/progress accurately.                            |
| T32 Media failure            | Upload succeeds, association fails/times out; cancel; switch actor.                | No duplicate byte upload or old-actor link; existing file and unrelated data preserved.                   |
| T33 Processes                | Enter from authorized request/task and open result/recovery.                       | No normal raw process-reference input; filtered reviewer cannot gain broader process view.                |
| T34 Task commands            | Pick permitted task/recovery command, complete focused dialog.                     | Exact current action, reason/confirmation, pending/uncertain/outcome displayed honestly.                  |
| T35 Date overlay             | Trigger near viewport edges and in scrolling/RTL pane.                             | Anchored popup remains visible; keyboard/Escape/return focus; typed validation preserved.                 |
| T36 Calendar views           | Show empty and populated day/week/month/agenda with overlaps.                      | Real date/time grid, short headings, today/period, source distinctions and useful empty state.            |
| T37 Calendar edits           | Create/edit/move supported event, stale reply, DST/all-day boundary.               | Actual instants/date ranges and reminders preserved; derived deadline read-only.                          |
| T38 Calendar paging          | Populate more than one API page in visible period.                                 | Bounded complete loading or explicit partial result; no false empty/final count.                          |
| T39 Dashboard composition    | Open with catalog/results and change period.                                       | KPI + actual bounded visualization, compact toolbar, no raw date-list main output.                        |
| T40 Dashboard semantics      | Supply count0, unknown mean, unavailable metric and stale failure.                 | Correct unit/null/unknown, per-widget recovery, no invented business approval/revenue.                    |
| T41 Dashboard drill-down     | Select supported descriptor from KPI/chart.                                        | Current authorized matching list and preserved filter meaning.                                            |
| T42 Cross-browser/RTL        | Run critical gestures in Chromium/Firefox; configured WebKit compatibility.        | Supported engines actually executed; environment failure reported, not skipped pass.                      |
| T43 Real reference journey   | Design/publish → requester draft/upload/submit → human review/correction → result. | Real services, claims/current refs/pins, required approvals and inspectable outcome.                      |
| T44 Global migration closure | Walk every ledger route incl. Users, agents, library and private-media consumers.  | No old normal edit modals, lower-page actions or technical-only navigation remains.                       |

T01–T44 are acceptance scenario indexes, not extra feature tickets. Split datasets/tests by the actual feature owner and evidence level.

#### D12.4 Playwright example: real movement and geometry

The following is an **implementation example to adapt inside the existing Studio test file**, where `test`, `expect` and the `appURL` fixture are already defined. Add the stated semantic test IDs to the actual production editor; do not create a fake component solely to pass it. It does not run in this review and does not replace paired-backend persistence tests.

```ts
// Add to the existing fixture-backed Studio tests after the relevant UI migration.
// Test IDs are proposed by this specification, not existing source guarantees.
test("draft canvas stays usable and pointer movement is one undoable change", async ({ page, appURL }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${appURL}/studio/workflow-versions/fixture-flow/edit`);

  const editor = page.getByTestId("workflow-editor");
  const stage = editor.getByTestId("workflow-canvas-stage");
  const node = editor.getByTestId("workflow-node-prepare");
  const handle = node.getByTestId("node-drag-handle");
  await expect(editor).toBeVisible();
  await expect(handle).toBeVisible();

  const viewport = page.viewportSize();
  const frame = await stage.boundingBox();
  if (!viewport || !frame) throw new Error("Canvas geometry unavailable");
  expect(frame.width).toBeGreaterThanOrEqual(850);
  expect(frame.height).toBeGreaterThanOrEqual(480);
  expect(frame.y).toBeGreaterThanOrEqual(0);
  expect(frame.y + frame.height).toBeLessThanOrEqual(viewport.height + 2);

  const before = await node.boundingBox();
  const grip = await handle.boundingBox();
  if (!before || !grip) throw new Error("Node geometry unavailable");
  const x = grip.x + Math.min(grip.width / 2, 80);
  const y = grip.y + grip.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 120, y + 60, { steps: 16 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      const after = await node.boundingBox();
      return after ? after.x - before.x : 0;
    })
    .toBeGreaterThan(80);

  await editor.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(async () => {
      const restored = await node.boundingBox();
      return restored ? Math.abs(restored.x - before.x) : Infinity;
    })
    .toBeLessThan(3);

  // Also check Y, Redo, save/reopen world coordinates, Escape, group movement,
  // current-ref persistence and graph semantics in the owning separate cases.
});
```

Do not use `force: true`, `dispatchEvent`-only dragging, direct component/domain mutation or a preconnected seeded end state as the sole proof of the gesture. DOM inspection/evaluation for computed geometry is legitimate; calling application internals to manufacture success is not. Native HTML drag/drop and library pointer dragging are different; use the actual gesture path supported by each control.

For connection tests use actual visible sockets and stable edge IDs. For save/reopen compare world-coordinate/document semantics or the actual read response, not pixel positions after an intentional Fit view change. For routing, verify both rendered path and current persisted routing metadata. Count-checks alone cannot prove the correct nodes were connected.

#### D12.5 Commands and final gate

Read the current README/mise/scripts before running; these names existed in the inspected pinned setup and may have changed in local work:

```sh
# From the actual frontend checkout, with the pinned toolchain and approved setup.
git status --short
mise exec -- pnpm run typecheck
mise exec -- pnpm run lint
mise exec -- pnpm run test:ci
mise exec -- pnpm run typecheck:playwright
mise exec -- pnpm run lint:playwright
mise exec -- pnpm run test:playwright
mise run check
```

Focused test selection belongs in the actual runner syntax, not an invented command. Browser-binary installation is an explicit environment step if missing, using the pinned existing runner; do not upgrade dependencies to hide a failed setup. The final `check` script and its required stages remain authoritative; verify whether Playwright is included and add a required stage without dropping legacy boundary/contract/temporal/security coverage. Keep real paired tests separate and run the repository's guarded disposable harness with a confirmed backend source. Never run destructive setup/reset against a shared database.

Measure execution time only after equivalent coverage and safe per-test state isolation exist. Current workers=1/retries=0 is an existing conservative baseline, not a reason to claim Playwright already made the suite faster. Parallelize only when the browser sessions, actors, database records, ports and test services cannot interfere. Missing tests, unexpected skips and retry-only success are not strict closure.

Keep source identity, lock hash, API producer identity, native command exits, warnings/skips, full trace and screenshots at the existing evidence locations. Scrub secrets/private payloads; use synthetic screenshots. On failure identify whether it is implementation, test assertion, fixture, browser installation or actual service behavior. Never remove the failing assertion to close a UI ticket.

<a id="execution"></a>

## 4. Execution backlog — 41 delivery cards inside the existing ownership

V01–V40 retain their prior indexes. **V41 makes the dashboard repair explicit under the already-existing `APP-FE-015.UX01`**; it is not a new product capability or an extra backend analytics engine. The 58 original master IDs remain in Appendix A. These counts are different levels and must not be added together. Prior authoring/Playwright subtasks keep their existing traceability under those owners.

All cards below are **DESIGNED / new verification NOT_RUN** in this review. Existing code and historical functional acceptance remain valuable; this file does not reset them. Delivery priority is **P1 usability/reliability repair** unless an owning task has a separately established P0 integrity issue. A screenshot complaint alone is not a security severity. Named engineering, UX and test owners are **TBD**; the existing APP IDs identify responsibility, not staffing assignments.

**Path notation:** `features/`, `shared/` and `core/` in frontend target descriptions are relative to `src/app/`. A directory is an ownership target to inspect, not a claim that all proposed components already exist. Backend paths begin `src/apps/` or `src/utils/`. Current source references and their evidence limits are in Appendix B.

| Workstream                                                          | Cards       |  Count |
| ------------------------------------------------------------------- | ----------- | -----: |
| Shared page, detail, table, query, navigation and recovery patterns | V01–V14     |     14 |
| Workflow editor                                                     | V15–V22     |      8 |
| Form designer                                                       | V23–V27     |      5 |
| Agent/decision/retrieval configuration                              | V28–V30     |      3 |
| Media, process and task journeys                                    | V31–V33     |      3 |
| Date picker and calendar                                            | V34–V35     |      2 |
| Reusable library                                                    | V36         |      1 |
| Browser/visual/integration/release evidence                         | V37–V40     |      4 |
| Dashboard                                                           | V41         |      1 |
| **Total document execution cards**                                  | **V01–V41** | **41** |

| Card        | Deliverable                                                                    | Existing APP owner(s)                                                                                            |
| ----------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [V01](#v01) | Reproduce the candidate and distinguish local progress from remaining defects  | `APP-FE-001.UX01`, `APP-FE-001.UX02`                                                                             |
| [V02](#v02) | Fix typography, cascade, spacing and component sizing at shared owners         | `APP-FE-004.UX01`                                                                                                |
| [V03](#v03) | Move object actions, History and Versions to the common header everywhere      | `APP-FE-007.UX01`, `APP-FE-004.UX01`, `APP-FE-032.UX01`                                                          |
| [V04](#v04) | Replace ordinary record-edit modals with consistent page edit mode             | `APP-FE-031.UX01`, `APP-FE-030.UX01`, `APP-FE-007.UX02`                                                          |
| [V05](#v05) | Replace flattened object output with meaningful detail sections                | `APP-FE-007.UX01`, `APP-FE-032.UX01`, `APP-FE-030.UX01`                                                          |
| [V06](#v06) | Use meaning-specific controls and remove generic clear-value bars              | `APP-FE-007.UX02`, `APP-FE-028.UX02`, `APP-FE-028.UX03`                                                          |
| [V07](#v07) | Make saved views and column settings part of the table toolbar                 | `APP-FE-008.UX01`, `APP-FE-007.UX01`                                                                             |
| [V08](#v08) | Make favorite an authoritative star control                                    | `APP-FE-008.UX01`                                                                                                |
| [V09](#v09) | Make Favorites useful navigation with the same collection language             | `APP-FE-008.UX01`, `APP-FE-007.UX01`                                                                             |
| [V10](#v10) | Put a readable access manager behind a scoped Access action                    | `APP-FE-031.UX01`, `APP-FE-006.UX01`                                                                             |
| [V11](#v11) | Repair navigable breadcrumbs, document titles and navigation hierarchy         | `APP-FE-007.UX01`, `APP-FE-004.UX01`                                                                             |
| [V12](#v12) | Make requests and work lists understandable operational collections            | `APP-FE-028.UX01`, `APP-FE-028.UX04`, `APP-FE-029.UX01`                                                          |
| [V13](#v13) | Build the supported visual filter/sort editor without JSON or comma keys       | `APP-FE-007.UX02`, `APP-FE-023.UX01`, `APP-FE-033.UX01`                                                          |
| [V14](#v14) | Provide in-page stale and uncertain-result recovery                            | `APP-FE-005.UX01`, `APP-FE-007.UX02`, `APP-FE-013.UX01`                                                          |
| [V15](#v15) | Make the workflow designer one bounded editor frame                            | `APP-FE-020.UX01`, `APP-FE-021.UX01`                                                                             |
| [V16](#v16) | Expose published inspection and the authorized draft path clearly              | `APP-FE-027.UX01`, `APP-FE-020.UX01`, `APP-FE-016.UX05`                                                          |
| [V17](#v17) | Repair palette dragging and precise node placement                             | `APP-FE-020.UX01`                                                                                                |
| [V18](#v18) | Make node selection and grouped movement coherent                              | `APP-FE-020.UX01`                                                                                                |
| [V19](#v19) | Make direct wiring explicit, type-correct and inspectable                      | `APP-FE-020.UX01`, `APP-FE-023.UX01`                                                                             |
| [V20](#v20) | Use smooth routes, movable waypoints and explicit automatic arrangement        | `APP-FE-020.UX01`                                                                                                |
| [V21](#v21) | Finish context menus, local actions and semantic history                       | `APP-FE-020.UX01`                                                                                                |
| [V22](#v22) | Move node properties, mappings and repair workflow into context                | `APP-FE-021.UX01`, `APP-FE-022.UX01`, `APP-FE-023.UX01`, `APP-FE-024.UX01`, `APP-FE-025.UX01`, `APP-FE-027.UX01` |
| [V23](#v23) | Finish the useful three-area form frame rather than counting columns           | `APP-FE-016.UX01`, `APP-FE-016.UX04`, `APP-FE-019.UX02`                                                          |
| [V24](#v24) | Render real field meaning and reliable direct placement                        | `APP-FE-016.UX02`, `APP-FE-016.UX03`, `APP-FE-017.UX02`                                                          |
| [V25](#v25) | Make field properties purpose-built and complete for supported types           | `APP-FE-017.UX02`, `APP-FE-017.UX03`, `APP-FE-017.UX04`, `APP-FE-017.UX05`                                       |
| [V26](#v26) | Keep one interactive sample state and a compact race-safe preview              | `APP-FE-019.UX02`, `APP-FE-019.UX03`, `APP-FE-016.UX05`                                                          |
| [V27](#v27) | Move rules, pages, languages and diagnostics into typed editor modes           | `APP-FE-018.UX01`, `APP-FE-018.UX02`, `APP-FE-018.UX03`, `APP-FE-019.UX01`, `APP-FE-019.UX03`                    |
| [V28](#v28) | Build a full-page agent detail/editor for a non-programmer                     | `APP-FE-030.UX01`, `APP-FE-025.UX01`                                                                             |
| [V29](#v29) | Make agent model, tools, sources and limits truthful selectors                 | `APP-FE-025.UX01`, `APP-FE-030.UX01`, `APP-FE-006.UX01`                                                          |
| [V30](#v30) | Separate agent queries, dynamic decisions and governed retrieval               | `APP-FE-030.UX01`, `APP-FE-025.UX01`, `APP-FE-023.UX01`, `APP-BE-019.UX01`                                       |
| [V31](#v31) | Integrate file and image transfer where the field is used                      | `APP-FE-017.UX05`, `APP-FE-028.UX03`, `APP-FE-036.UX01`                                                          |
| [V32](#v32) | Replace raw process-reference entry with authorized contextual navigation      | `APP-FE-032.UX01`, `APP-FE-028.UX04`, `APP-BE-027.UX01`                                                          |
| [V33](#v33) | Make human, worker and process commands contextual and safe                    | `APP-FE-029.UX02`, `APP-FE-029.UX03`, `APP-FE-029.UX04`, `APP-FE-032.UX01`                                       |
| [V34](#v34) | Anchor date selection to the field and preserve temporal semantics             | `APP-FE-014.UX01`, `APP-FE-007.UX02`                                                                             |
| [V35](#v35) | Make Calendar a genuine period/time-grid workspace                             | `APP-FE-014.UX01`, `APP-BE-008.UX01`                                                                             |
| [V36](#v36) | Present reusable definitions by purpose and exact compatible version           | `APP-FE-006.UX01`, `APP-FE-027.UX01`, `APP-FE-007.UX01`                                                          |
| [V37](#v37) | Expand existing Playwright tests to real gestures and recovery                 | `APP-FE-002.UX01`                                                                                                |
| [V38](#v38) | Require reviewed visual output and enforce layout invariants                   | `APP-FE-034.UX01`, `APP-FE-004.UX01`, `APP-FE-001.UX02`                                                          |
| [V39](#v39) | Prove complete non-technical journeys against real services                    | `APP-FE-037.UX01`, `APP-FE-017.UX01`, `APP-FE-028.UX03`, `APP-FE-029.UX01`, `APP-FE-036.UX01`                    |
| [V40](#v40) | Close each slice with migration, performance, rollout and real evidence        | `APP-FE-002.UX01`, `APP-FE-033.UX01`, `APP-FE-035.UX01`, `APP-BE-028.UX01`                                       |
| [V41](#v41) | Replace the dashboard query form/date list with useful metric cards and charts | `APP-FE-015.UX01`, with shared `APP-FE-004.UX01` / `APP-FE-002.UX01`                                             |

<a id="v01"></a>

### V01 — Reproduce the candidate and distinguish local progress from remaining defects

**Existing ownership:** `APP-FE-001.UX01`, `APP-FE-001.UX02`. **Design contract:** [D12](#d12).  
**Dependency/sequence:** First; required evidence setup, not a blanket implementation lock.

**Where:** Read the actual local checkout, working diff, AGENTS and producer manifest; update the existing task evidence/route inventory, not the repository policy to relax it.

**What and how:** Capture S20–S27 on the actual candidate, including the same scroll positions and an authorized draft. Record device scale, browser zoom, fonts, locale and route state. The online SHA has not advanced, while screenshots show local presentation changes; do not roll these back. Reproduce reported gestures independently from visual defects. Use safe synthetic data and preserve all dirty work.

**Closure evidence:** Baseline screenshot is recorded without approving it as a desired golden; actual actor/version state is known; every observed defect has a current owning component; no browser pass or local code change is claimed from a source read.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v02"></a>

### V02 — Fix typography, cascade, spacing and component sizing at shared owners

**Existing ownership:** `APP-FE-004.UX01`. **Design contract:** [D01](#d01).  
**Dependency/sequence:** Start immediately; pilot on Users list/detail and both editors.

**Where:** src/styles.scss; src/app/shared/styles/_typography.scss; imported console/field styles; shared record-summary/record-table/field wrappers and scoped overlay adapters.

**What and how:** Inspect computed root/body/control/table typography and font loading. Remove conflicting root shorthand/cascade effects deliberately. Implement the token scale, field-shell composition, density and logical spacing in D01. Repair nested-card padding and correct container min sizes. Keep existing language-specific font families unless measured evidence justifies another licensed choice. Do not add global CSS zoom, random one-off pixels or !important patches.

**Closure evidence:** At normal scale, actual body/values/control text meets the design baseline; labels and inputs are adjacent; controls fit every pane in en/fa/ar; both themes and compact spacing remain readable; no production font file is included in handoff artifacts.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v03"></a>

### V03 — Move object actions, History and Versions to the common header everywhere

**Existing ownership:** `APP-FE-007.UX01`, `APP-FE-004.UX01`, `APP-FE-032.UX01`. **Design contract:** [D03](#d03).  
**Dependency/sequence:** After the shared header seam; migrate every consumer, not only the pilot.

**Where:** Records resource-page, record headers/details and user-specific actions; Administration resource-actions; Studio catalog-header/catalog-actions/catalog-extras; operation/task/process detail owners.

**What and how:** Unify the page action slot and expose permitted command menus. Move Users Assign role, Reset password and Delete; move generic resource actions and catalog lifecycle actions from lower sections. Preserve row/field/node scope exceptions. Use a menu button with keyboard navigation and focus restoration. Command selection opens its focused form/confirmation, never silently dispatches a mutation.

**Closure evidence:** T01/T34/T44 pass across explicit Users actions and generic resource consumers; one visible command instance per scope; current action availability is preserved; History/Versions are reachable without scrolling below the object.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v04"></a>

### V04 — Replace ordinary record-edit modals with consistent page edit mode

**Existing ownership:** `APP-FE-031.UX01`, `APP-FE-030.UX01`, `APP-FE-007.UX02`. **Design contract:** [D03](#d03).  
**Dependency/sequence:** Reuse the header and field-shell; deliver one whole record journey first.

**Where:** features/records/presentation/resource-page.html and its mode/save/guard controller; record-fields; Studio catalog-editor; dedicated agent and other complex feature editors.

**What and how:** Separate record read/edit presentation while keeping identity and section placement. Replace the central full-record p-dialog with route or in-page mode and persistent Save/Cancel. Preserve draft values, hidden/omitted fields, current refs, validation pointers, denial and navigation guards. Password reset, grant/revoke and bounded business commands can remain focused action dialogs. Do not merely move the old recursive modal markup into a giant page.

**Closure evidence:** User and agent edit journeys have no generic Edit record dialog; cancel restores the confirmed record, failed/stale save retains input, required actions remain accessible after scrolling, and no unsupported field is lost during round-trip.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v05"></a>

### V05 — Replace flattened object output with meaningful detail sections

**Existing ownership:** `APP-FE-007.UX01`, `APP-FE-032.UX01`, `APP-FE-030.UX01`. **Design contract:** [D04](#d04).  
**Dependency/sequence:** Apply together with the owning record edit migration.

**Where:** shared/ui/record-summary/record-summary.ts/.html and record-presentation helpers; feature-specific presenters in Records, Administration, Operations and Studio.

**What and how:** Add typed, feature-owned detail sections for users, agents, task executions, processes and authored definitions. Put business name and state first, readable values near labels, Activity in a bounded side section, and exact machine data in secondary details. Preserve existing date formatting and history comparison helpers. Distinguish worker success from business fulfillment. Do not erase null/false/zero to simplify display.

**Closure evidence:** S25-style tiny values and remote labels disappear; an unfamiliar operator can identify object, state, relevant result and available action; long nested agent decisions render as choices, not schema paths; exact values and private visibility are preserved.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v06"></a>

### V06 — Use meaning-specific controls and remove generic clear-value bars

**Existing ownership:** `APP-FE-007.UX02`, `APP-FE-028.UX02`, `APP-FE-028.UX03`. **Design contract:** [D04](#d04).  
**Dependency/sequence:** Shared field-shell is available; migrate runtime and authoring consumers.

**Where:** shared field controls and field-wrapper; features/forms runtime fields; Records fields/schema adapters; Studio inspectors; shared temporal/media consumers.

**What and how:** Apply the input meaning matrix: multiline reasons, proper numeric controls, finite choices, authorized references, anchored dates and inline media. Replace full-row Remove value buttons with appropriate local clear/remove affordances. Clearing must use the exact nullable/omission policy and remain discoverable by keyboard. Preserve canonical numeric/string distinctions and partial invalid input.

**Closure evidence:** No standard field requires a raw code/reference/JSON value; a reason accommodates paragraphs; zero/false survive clearing neighboring fields; no large secondary clear row doubles the height of every field.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v07"></a>

### V07 — Make saved views and column settings part of the table toolbar

**Existing ownership:** `APP-FE-008.UX01`, `APP-FE-007.UX01`. **Design contract:** [D05](#d05).  
**Dependency/sequence:** Preserve the compact local implementation already shown in S24.

**Where:** shared/ui/saved-views; saved-view-repair; personal collection adapters; Studio catalog-extras and list consumers in Records/Operations.

**What and how:** Integrate current view, dirty state, Save as/Update/Manage menu and anchored Columns settings into the shared collection toolbar. Remove permanent name/columns/action forms below records. Keep exact persisted query/column semantics, defaults, incompatible repair, account cleanup and uncertain replay. Distinguish read-query application from mutation of a saved view.

**Closure evidence:** Lists use the same compact pattern; detail pages have no saved-query configuration block; returning from detail preserves the applied view; two windows, incompatible schema and lost update reply retain safe recovery.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v08"></a>

### V08 — Make favorite an authoritative star control

**Existing ownership:** `APP-FE-008.UX01`. **Design contract:** [D05](#d05).  
**Dependency/sequence:** Existing personal collection/link services; no new permission model.

**Where:** shared/ui/favorite-action/favorite-action.ts/.html; core/resources/personal-collections and authorized link/summary adapters; header/table placements.

**What and how:** Implement outline/filled/unknown/busy states and add/remove commands using returned favorite identity. Resolve saved state beyond the first page and across current-ref changes without inventing a durable identity format. Make star a named toggle button. Keep rapid or uncertain changes serialized/reconcilable; no local saved flag promoted to authoritative persisted state.

**Closure evidence:** Star state survives reopen, paging, reference refresh and actor switch; no false not-saved state for an off-page favorite; failed/uncertain requests do not silently invert state or expose another actor's target.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v09"></a>

### V09 — Make Favorites useful navigation with the same collection language

**Existing ownership:** `APP-FE-008.UX01`, `APP-FE-007.UX01`. **Design contract:** [D05](#d05).  
**Dependency/sequence:** Reuse V08 and the table/card identity pattern.

**Where:** features/records/presentation/favorites/favorites.html/.ts and its personal resource/link adapters.

**What and how:** Show readable title link, kind, exact version when relevant and trailing star/menu. Replace giant open/remove buttons and vague empty state. Add only contract-supported search/filtering; preserve paging, revoked/deleted target behavior and authorized current destination resolution. Keep favorite management a normal collection, not a settings form.

**Closure evidence:** A user recognizes and opens the target without an opaque reference; unavailable targets have safe guidance; no unintended operation executes on navigation; shared typography and navigation are applied.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v10"></a>

### V10 — Put a readable access manager behind a scoped Access action

**Existing ownership:** `APP-FE-031.UX01`, `APP-FE-006.UX01`. **Design contract:** [D03](#d03).  
**Dependency/sequence:** Existing grants and authorized selectors; confirm exact permission types.

**Where:** Studio catalog access/grant controls, catalog-extras; Administration group/reference pickers and existing grant command adapters.

**What and how:** Move Access grants out of the main detail tail to a labeled icon/action. Show authorized recipients and actual grant meanings, with searchable people/group controls and deliberate add/revoke confirmation. Do not substitute a generic map editor or imply that use grants authorize editing. Keep current refs and incomplete/forbidden states explicit.

**Closure evidence:** Existing grants load readably; off-page recipients resolve safely; no copied IDs; stale/revoked/denied operations preserve local intent and do not broaden authority.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v11"></a>

### V11 — Repair navigable breadcrumbs, document titles and navigation hierarchy

**Existing ownership:** `APP-FE-007.UX01`, `APP-FE-004.UX01`. **Design contract:** [D03](#d03).  
**Dependency/sequence:** Use existing shell/router/permission seams; no new router framework.

**Where:** Actual workspace shell and breadcrumb renderer located from bootstrap; operations.routes.ts, administration.routes.ts, record.routes.ts and Studio route/header components.

**What and how:** Replace text ancestors with permitted router links, decorative separators and a current-page label. Add safe Back-to-collection fallbacks that preserve list context and draft guards. Update browser titles on locale/route reuse. Provide accessible Focus mode for editors. Remove the normal Private uploads shortcut only after inline consumers are migrated, retaining legitimate backend/deep-link behavior.

**Closure evidence:** T03/T44 pass for direct links and Back/Forward; Calendar/Dashboard do not keep Users title; every visible ancestor is operable or explicitly current; navigation never leaks an inaccessible parent title.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v12"></a>

### V12 — Make requests and work lists understandable operational collections

**Existing ownership:** `APP-FE-028.UX01`, `APP-FE-028.UX04`, `APP-FE-029.UX01`. **Design contract:** [D05](#d05).  
**Dependency/sequence:** Reuse shared list/detail pattern; preserve work-item policies.

**Where:** Operations request/workspace page components, request/work-item list adapters, status presentation and process destination navigation.

**What and how:** Lead with human-readable request identity/type, current state and meaningful date/priority labels. Use the shared query/view/pagination controls where supported. Make Start a request and available reviewer actions discoverable. Retain owner/claim/available queues and safe empty/denied/stale states. Do not invent a numeric priority name mapping or broad process access.

**Closure evidence:** A requester can find/open/resume a real draft and a reviewer can find actual claimable work; UI does not present raw ISO timestamps or only Open request as row identity; competing claims and returning list state are preserved.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v13"></a>

### V13 — Build the supported visual filter/sort editor without JSON or comma keys

**Existing ownership:** `APP-FE-007.UX02`, `APP-FE-023.UX01`, `APP-FE-033.UX01`. **Design contract:** [D10](#d10).  
**Dependency/sequence:** Current generated query-field descriptors and exact SearchRequest semantics.

**Where:** shared/ui/list-query/list-query.html, query-filters.html and controller/value helpers; generated resource query descriptors; backend src/utils/pagination.py is read-only contract evidence.

**What and how:** Implement D10.3 typed rows, ordered sorts, a readable summary and explicit ALL conjunction. Reuse existing type-aware controls instead of replacing them. Add stable local row IDs for focus/reorder; keep them out of wire DTOs. Decode current multi_field sorts compatibly. Do not offer nested OR/groups/SQL or cross-field search that the endpoint cannot express.

**Closure evidence:** UI→wire→UI tests cover scalar types, null operations, IN, BETWEEN and sort precedence; the example agent query serializes correctly; normal users never type a query JSON or comma-separated machine field names.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v14"></a>

### V14 — Provide in-page stale and uncertain-result recovery

**Existing ownership:** `APP-FE-005.UX01`, `APP-FE-007.UX02`, `APP-FE-013.UX01`. **Design contract:** [D03](#d03).  
**Dependency/sequence:** Preserve current command coordinator; no blanket automatic retry.

**Where:** Record/catalog command state; feature edit and save controllers; core transport ApiFailure/current-ref coordination; safe support feedback.

**What and how:** Separate validation, authorization, stale ref and unknown command outcome. Preserve the local draft and exact replay payload/key. Replace reload-only toast dead ends with current-state inspection and deliberate compatible reapply. Keep an action result linked to the action that produced it. Do not auto-merge security policy, workflow graph or external-effect commands.

**Closure evidence:** Independent-window stale writes and lost replies are exercised; no duplicate command or private-data loss; recovery has a visible next step and remains correct after actor change.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v15"></a>

### V15 — Make the workflow designer one bounded editor frame

**Existing ownership:** `APP-FE-020.UX01`, `APP-FE-021.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Shared EditorFrame geometry; existing canvas adapter is retained.

**Where:** features/studio/presentation/workflow-board template/styles/subcomponents; workflow-canvas panel/toolbar; app shell Focus mode.

**What and how:** Move the large selection panel, keyboard connectors, history, graph and assistance tools into contextual dock tabs/header/issues tray. Keep the canvas and right dock in one min-size-zero row, with dock-body scrolling. Avoid long empty center areas when the inspector grows. Keep navigation and primary actions visible. Do not hide the old controls without migrating their behavior.

**Closure evidence:** S22/S23 structure is no longer possible on the reference desktop sizes: canvas and essential controls stay within one frame, long inspector does not lengthen the whole page, and all displaced capabilities are keyboard-reachable.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v16"></a>

### V16 — Expose published inspection and the authorized draft path clearly

**Existing ownership:** `APP-FE-027.UX01`, `APP-FE-020.UX01`, `APP-FE-016.UX05`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Existing version/creation/promotion/publication lifecycle only.

**Where:** Studio version/catalog navigation, workflow/form header state, current draft guards and creation/open commands.

**What and how:** Show exact version, Published/Retired read-only message and a permitted Create/Open draft action. Preserve pan/zoom/find/inspect and simulated answers while forbidding definition mutation. Make draft Save, workflow promotion and publication visibly different. Do not set a local flag to bypass published immutability to satisfy drag tests.

**Closure evidence:** Published view is useful and unmistakable; a user can enter a legitimate editable draft without copied IDs; no published graph/schema/pin is changed and stale reference failures remain safe.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v17"></a>

### V17 — Repair palette dragging and precise node placement

**Existing ownership:** `APP-FE-020.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Existing draft, catalog and add-step domain operation.

**Where:** Workflow palette component; workflow-canvas dragstart/dragover/drop/place path; workflow-board addType/add and coordinate helpers.

**What and how:** Test the actual right palette and implement payload validation, ghost, compatible drop indication, one inverse coordinate transform and one node per successful drop. Distinguish scrollbar/menu interaction from drag. Provide Add/click-to-place alternative, cancellation and stale-drag rejection on document/actor replacement. Disambiguate exact-version entries with repeated names.

**Closure evidence:** Drop succeeds at intended point after zoom/pan and palette scroll; cancelled/outside/invalid drag creates nothing; keyboard/click alternative creates the same valid node; actual save/reopen preserves its identity/position.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v18"></a>

### V18 — Make node selection and grouped movement coherent

**Existing ownership:** `APP-FE-020.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Keep the existing ordinary-selection repair and expand it.

**Where:** workflow-canvas node handle/selection events; workflow-board/workflow-interactions; domain canvas-editing moveSelection/selection state.

**What and how:** Unify ordinary click, Shift-click, marquee, blank click, outline and context-menu targeting. Move groups by one delta; commit once at drag end; cancel on Escape/capture loss. Keep menus/inputs from starting node drag. Preserve valid pending inspector buffers. Undo should reverse the movement, not a prior pan event.

**Closure evidence:** Real pointer and keyboard tests cover group→ordinary-third selection, marquee, drag, cancel and one-step Undo/Redo; no wrong-selection duplication/deletion and no per-mousemove history flood.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v19"></a>

### V19 — Make direct wiring explicit, type-correct and inspectable

**Existing ownership:** `APP-FE-020.UX01`, `APP-FE-023.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Exact current handler ports/outcomes and existing domain validation.

**Where:** workflow-canvas connection creation and outcome panel; board connect/reconnect; typed connection/mapping inspector and catalog node model.

**What and how:** Use visible compatible ports, a clear rubber-band preview and explicit outcome selection at connection creation. Keep control/data meaning distinct. Edge click selects its real identity. Confirm supported source and target reassignment behavior in installed Foblex; retain metadata across reconnection. Avoid remote hidden defaults and free-text machine IDs as normal wiring.

**Closure evidence:** Actual port drag creates the intended control edge and data edge; both endpoint reassignment cases pass; wrong kind/port/outcome/cancel leave original graph unchanged; labels and persisted semantics match.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v20"></a>

### V20 — Use smooth routes, movable waypoints and explicit automatic arrangement

**Existing ownership:** `APP-FE-020.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Existing routing/workspace persistence; review a layout dependency only if necessary.

**Where:** workflow-canvas f-connection configuration/scoped path styles/waypoints; existing routing and layout/group domain helpers; board layout command path.

**What and how:** Set a supported curve type explicitly, provide readable arrowheads/hit path and separate parallel/return edges. Make selected routing handles actually editable and persisted. Add Arrange as a layout-only command with deterministic positions and one undo transaction; reuse or isolate a justified layout solver. Never substitute layout-reset or demo reset for automatic arrangement.

**Closure evidence:** T17/T18 pass on branches, return loops and disconnected nodes; graph content is unchanged by route/arrange commands; node boxes do not overlap in the test graph; old layout restores with Undo; reopening does not auto-rearrange saved work.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v21"></a>

### V21 — Finish context menus, local actions and semantic history

**Existing ownership:** `APP-FE-020.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Current context-menu seam and guarded workspace commands.

**Where:** workflow-canvas menuItems/openMenu/openEdgeMenu; board command controller/history; supported keyboard shortcut handling.

**What and how:** Provide targeted node/edge/group/blank menus and visible/keyboard equivalents. Keep menus inside viewport and restore focus. Group one logical edit into one undo step and keep navigation out of semantic history. Guard deletion; do not automatically reconnect across removed approvals. Only implement clipboard fragments through safe bounded schema-aware logic.

**Closure evidence:** Wrong prior selection cannot receive a right-click action; Escape/focus and keyboard menu work; undo preserves identities and incomplete buffers; destructive behavior is explicit and no approval bypass is introduced.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v22"></a>

### V22 — Move node properties, mappings and repair workflow into context

**Existing ownership:** `APP-FE-021.UX01`, `APP-FE-022.UX01`, `APP-FE-023.UX01`, `APP-FE-024.UX01`, `APP-FE-025.UX01`, `APP-FE-027.UX01`. **Design contract:** [D06](#d06).  
**Dependency/sequence:** Existing handler metadata, exact pins, reusable pickers and publication validator.

**Where:** Workflow node/human-task/AI/integration inspectors; data mapping and transition editors; readiness/diagnostics; board promotion/publication controller.

**What and how:** Compose task-oriented properties in the right dock: general, inputs/outputs, mappings, branches and relevant assignment/provider settings. Show exact pin selection and unavailable dependencies. Keep issues navigable to the selected setting. Separate WIP save/validate/promote/publish outcomes, retaining all constraints. Do not expose normal config as raw recursive JSON.

**Closure evidence:** A reference workflow can be configured and validated without leaving the frame or copying refs; issue links focus correct controls; current published pins and configured branches survive changes and save/reopen.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v23"></a>

### V23 — Finish the useful three-area form frame rather than counting columns

**Existing ownership:** `APP-FE-016.UX01`, `APP-FE-016.UX04`, `APP-FE-019.UX02`. **Design contract:** [D07](#d07).  
**Dependency/sequence:** Shared EditorFrame and current live preview are reused.

**Where:** Form-builder template/styles and existing tabbed tools; app shell Focus mode; form-canvas and preview pane composition.

**What and how:** Use container-based useful-width thresholds and a tabbed Add/Outline/Edit dock. At wide sizes keep actual design plus preview adjacent; at constrained sizes collapse tools before shrinking content. Move Rules/Languages/Settings into frame modes. Remove configuration forms below the editor after equivalent controls exist. Do not revert local three-panel progress.

**Closure evidence:** At normal desktop widths controls fit and values are readable; at narrow widths deliberate mode/dock changes preserve state; no four cramped nested columns, duplicate synthetic form, or several-screen technical tail remains.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v24"></a>

### V24 — Render real field meaning and reliable direct placement

**Existing ownership:** `APP-FE-016.UX02`, `APP-FE-016.UX03`, `APP-FE-017.UX02`. **Design contract:** [D07](#d07).  
**Dependency/sequence:** Existing safe placement, key generation and renderer model.

**Where:** Form-canvas field card model/template/styles; form label/localization resolver; builder quickAdd/drop; form-placement/field-placement/fresh-placement helpers.

**What and how:** Resolve actual labels/requiredness/help/type so cards match preview rather than all reading text. Replace placeholder pencil lines with meaningful passive control presentation. Use selected/focused adorners and temporary insertion markers; keep non-drag move controls. Preserve layout/collection ancestry, canonical bindings and placement-only duplication semantics.

**Closure evidence:** Title/Amount/Reason label parity and proper input shapes pass; add/reorder/reparent/duplicate works in empty and nested containers; resting fields have no permanent before/after instruction bands; identities and data survive save/reopen.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v25"></a>

### V25 — Make field properties purpose-built and complete for supported types

**Existing ownership:** `APP-FE-017.UX02`, `APP-FE-017.UX03`, `APP-FE-017.UX04`, `APP-FE-017.UX05`. **Design contract:** [D07](#d07).  
**Dependency/sequence:** Shared controls, exact component schemas and current complex-field contracts.

**Where:** Studio form-inspector/form-geometry/options/collection/media presenters; canonical field and schema editing helpers; shared authorized pickers.

**What and how:** Use relevant inspector groups and explicit option/row/media/constraint editors. Hide technical identity behind Advanced without hiding required functionality. Preserve unsupported existing properties and explain limitations. Use readable localized messages and actual bounds; no recursive Add value/Field maps for common configuration.

**Closure evidence:** Every advertised field kind has a usable applicable configuration path; choices/rows/attachments can be authored without JSON; numeric/null/omission and hidden properties round-trip correctly; errors locate their owning setting.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v26"></a>

### V26 — Keep one interactive sample state and a compact race-safe preview

**Existing ownership:** `APP-FE-019.UX02`, `APP-FE-019.UX03`, `APP-FE-016.UX05`. **Design contract:** [D07](#d07).  
**Dependency/sequence:** Existing preview service/renderer/generation fences are extended.

**Where:** Form-builder commands/state and preview effect; runtime-form sample binding; obsolete lower-page sample editor and expert-context composition.

**What and how:** Keep one answer-state owner in the preview. Remove duplicated lower-page synthetic inputs and large always-on banners. Refresh bounded valid unsaved design separately from saving; reject late responses using generation/document/actor identity. Preserve compatible answers on label/view/locale changes and show stale/error state without locking the editor.

**Closure evidence:** Out-of-order responses cannot overwrite the newest design; sample survives compatible edits; no duplicate inputs or side-effect uploads/requests/provider calls; preview device width is actual layout, not a scaled screenshot.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v27"></a>

### V27 — Move rules, pages, languages and diagnostics into typed editor modes

**Existing ownership:** `APP-FE-018.UX01`, `APP-FE-018.UX02`, `APP-FE-018.UX03`, `APP-FE-019.UX01`, `APP-FE-019.UX03`. **Design contract:** [D07](#d07).  
**Dependency/sequence:** Actual backend rule/navigation/option dialect only.

**Where:** Form behavior/calculation/localization/PageSettings/view controls; inspector option/navigation preview and diagnostic adapter; builder frame tabs.

**What and how:** Replace the normal node-pointer/query JSON editor with selected-field context and typed controls. Keep language catalog editing in its own frame mode and selected-field translations in context. Use real supported rule/function/page/view variants and preserve parameterized data. Make diagnostic items select/focus the repair target. Keep advanced developer JSON separate from normal workflow.

**Closure evidence:** No normal design/test journey needs a JSON pointer or raw query document; all modes share unsaved state, Save and undo policy; unsupported constructs are preserved and explicitly identified, not erased.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v28"></a>

### V28 — Build a full-page agent detail/editor for a non-programmer

**Existing ownership:** `APP-FE-030.UX01`, `APP-FE-025.UX01`. **Design contract:** [D10](#d10).  
**Dependency/sequence:** Existing agent route/record adapter and actual draft spec.

**Where:** Administration agent route entry; Records resource-page/fields dispatch seam; new feature-owned agent presenter/edit sections through existing AI adapters.

**What and how:** Replace recursive schema-modal editing and flattened details with Overview, Instructions & decisions, Data & tools, Limits and supported Test/evidence. Use choice cards, locale tabs, readable summaries and current version state. Keep the same section language in read-only and edit modes. No provider execution on incidental edits.

**Closure evidence:** Agent question, choices, data scope and model are understandable at a glance; editing uses full page with preserved draft and typed validation; no Value 1/labels/fa field-path wall remains; exact published/draft behavior preserved.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v29"></a>

### V29 — Make agent model, tools, sources and limits truthful selectors

**Existing ownership:** `APP-FE-025.UX01`, `APP-FE-030.UX01`, `APP-FE-006.UX01`. **Design contract:** [D10](#d10).  
**Dependency/sequence:** Current metadata and selector contracts; catalog gaps scoped separately.

**Where:** Agent data/model/tool/limit section adapters; existing provider/model/connection selectors; permitted-data and trusted-tool backend contracts read before wiring.

**What and how:** Consume authorized catalogs and display availability, capability, exact pins and redaction/classification. Distinguish model suggestion from execution credentials and usage limits from supported spend guarantees. Preserve now-ineligible saved choices with safe repair context. Do not turn a raw key textarea into a supposed picker by adding a label.

**Closure evidence:** Actual authorized/off-page selections render and validate; denied/revoked resources expose no private metadata; no arbitrary tool/source keys or invented strict billing cap; agent scope does not grant business approval.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v30"></a>

### V30 — Separate agent queries, dynamic decisions and governed retrieval

**Existing ownership:** `APP-FE-030.UX01`, `APP-FE-025.UX01`, `APP-FE-023.UX01`, `APP-BE-019.UX01`. **Design contract:** [D10](#d10).  
**Dependency/sequence:** Capability inventory first; implement supported portions without waiting for unrelated gaps.

**Where:** Agent editor and Studio AI input/mapping controls; shared query editor; backend ai/domain/dto.py, agent/contracts/tool owner; current generated API transport.

**What and how:** Build D10's capability table for this candidate. Deliver typed list filtering, static/input-bound choices and permitted-data configuration now where supported. For retrieval, identify the actual persisted/query/tool schema and map a guided source/parameters/limit/result UI to it. Known saved-report lookup is bounded and approved, not an unrestricted database query. Record precise missing preview/catalog/grouping contracts.

**Closure evidence:** A list filter is not mislabeled an agent retrieval designer; each visible setting maps to a real contract; static/input variants serialize correctly; preview never dispatches an actual tool by accident; no invented SQL/OR/endpoints.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v31"></a>

### V31 — Integrate file and image transfer where the field is used

**Existing ownership:** `APP-FE-017.UX05`, `APP-FE-028.UX03`, `APP-FE-036.UX01`. **Design contract:** [D04](#d04).  
**Dependency/sequence:** Existing BinaryTransfer/runtime resource services; preserve association semantics.

**Where:** BinaryTransfer; CaseResources; forms media/attachment controls; account avatar and current image/file consumers; generic-media route and sidebar integration.

**What and how:** Provide local choose/drop, real progress or honest indeterminate state, preview, replace/remove and upload→associate stages. Keep returned refs internal. Handle uploaded-but-unlinked separately and preserve current images until replacement succeeds. Remove standalone utility dependency from normal use; retain legitimate backend/deep-link compatibility. No unsanctioned public storage URLs or garbage-collection commands.

**Closure evidence:** Every in-scope consumer completes upload and association in place; lost link reply does not blindly repeat byte upload; cancellation and actor changes fence callbacks; normal navigation no longer presents Private uploads as the required first step.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v32"></a>

### V32 — Replace raw process-reference entry with authorized contextual navigation

**Existing ownership:** `APP-FE-032.UX01`, `APP-FE-028.UX04`, `APP-BE-027.UX01`. **Design contract:** [D04](#d04).  
**Dependency/sequence:** Inspect available discovery contracts; never broaden reviewer access.

**Where:** Administration process-controls; Operations process-entry/tracking/request destination; existing request/task tables and safe link adapters.

**What and how:** Resolve a process from its authorized parent context and provide readable selection/list entry only where an existing API permits it. Preserve useful deep links and a clearly technical operator fallback when actually justified. Do not create a general process search promise from a detail-only endpoint, or infer process IDs from task execution refs. Redesign details/action placement.

**Closure evidence:** A normal authorized requester/operator reaches process tracking without copying codes; a contracted-task reviewer with no broader access still receives safe denial; unavailable discovery becomes an exact backend gap, not fabricated UI data.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v33"></a>

### V33 — Make human, worker and process commands contextual and safe

**Existing ownership:** `APP-FE-029.UX02`, `APP-FE-029.UX03`, `APP-FE-029.UX04`, `APP-FE-032.UX01`. **Design contract:** [D03](#d03).  
**Dependency/sequence:** Existing operation-specific authority and lifecycle rules.

**Where:** Work-item decision controls; resource-actions; task execution/schedule detail; process recovery/receipt presenters.

**What and how:** Move object commands to the header or current task action area, keeping the primary human decision obvious. Open focused typed dialogs for reasons/parameters/confirmation. Separate human approval, AI tool approval, worker run/retry/revoke and external recovery semantics. Show queued/unknown/confirmed result faithfully. Reuse current idempotency coordinator.

**Closure evidence:** No lower-page task button strip remains; action availability matches actual state; command selection alone does not execute; unknown external effects are reconciled rather than retried under a new identity.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v34"></a>

### V34 — Anchor date selection to the field and preserve temporal semantics

**Existing ownership:** `APP-FE-014.UX01`, `APP-FE-007.UX02`. **Design contract:** [D08](#d08).  
**Dependency/sequence:** Installed shared overlay/datepicker API; current temporal conversion logic.

**Where:** shared/ui/temporal-control/temporal-control.html/.ts/.styles and existing overlay seam; every date consumer including filters/calendar/dashboard.

**What and how:** Replace ordinary desktop modal date selection with an anchored popup, collision/scroll handling, keyboard grid navigation and return focus. Integrate typed input/error/clear meaning. Keep date-only vs instant vs local time and supported calendar/DST ambiguity handling. Do not replace tested conversions with naive JavaScript parsing.

**Closure evidence:** Picker opens beside field near all viewport edges, inside scroll panes and RTL; Escape returns focus; DST and all-day tests pass; desktop normal dates do not open a centered modal.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v35"></a>

### V35 — Make Calendar a genuine period/time-grid workspace

**Existing ownership:** `APP-FE-014.UX01`, `APP-BE-008.UX01`. **Design contract:** [D08](#d08).  
**Dependency/sequence:** Shared header/picker; current event projection. Team/reminder gaps only block dependent commands.

**Where:** Calendar calendar-page/CalendarViews/editor and adapters; Operations route title; approved rendering adapter if a new standard calendar library is justified.

**What and how:** Implement period toolbar, mini-calendar/source rail, month grid, week/day time axis/all-day lane, useful agenda, empty states and event detail popup. Preserve source-authorized editability, civil/instant semantics, bounded pagination and reminder configuration. Adopt a compatible FullCalendar Standard adapter only after review if current rendering cannot meet the design; no Google synchronization or Premium features by default.

**Closure evidence:** T35–T38 pass, including populated overlaps, no-events grid, more than one API page and read-only deadlines; view does not consist of seven long date bars; no invented recurrence/invitation/permission behavior.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v36"></a>

### V36 — Present reusable definitions by purpose and exact compatible version

**Existing ownership:** `APP-FE-006.UX01`, `APP-FE-027.UX01`, `APP-FE-007.UX01`. **Design contract:** [D05](#d05).  
**Dependency/sequence:** Existing library/catalog/search/select/reuse contracts.

**Where:** Studio reusable library, form component/data-type catalogs, published version selection and template/reuse controls.

**What and how:** Lead with readable name, type, description/preview and exact version. Keep long code secondary; use consistent compact filters/views and selection state. Distinguish copy/reference reuse and deliberate version upgrade; preserve source checksum/provenance and compatible current grants. Do not silently upgrade published pins to latest.

**Closure evidence:** An unfamiliar designer can find and select a real compatible item without copied IDs; empty/unavailable/private cases are truthful; preview and action fit shared layout; exact chosen version remains pinned.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v37"></a>

### V37 — Expand existing Playwright tests to real gestures and recovery

**Existing ownership:** `APP-FE-002.UX01`. **Design contract:** [D12](#d12).  
**Dependency/sequence:** Existing runner/fixtures are preserved; no from-zero installation story.

**Where:** playwright.config.ts; tests/playwright/studio.spec.ts and new feature-owned test files; current fixture/paired harness; scripts/check-project.mjs and required stages.

**What and how:** Add the scenario matrix with actual pointer actions, keyboard alternatives, layout and side-effect assertions. Separate deterministic fixture scope from paired services. Use semantic locators/test IDs, independent actor/data isolation and safe trace artifacts. Migrate existing browser coverage only when equivalent scenarios are retained. Measure speed after equivalent coverage.

**Closure evidence:** Chromium/Firefox critical cases execute with actual identities; no force/internal-injection/skip-based passes; pointer reconnection and media association have their own tests; final gate includes required new checks without dropping old ones.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v38"></a>

### V38 — Require reviewed visual output and enforce layout invariants

**Existing ownership:** `APP-FE-034.UX01`, `APP-FE-004.UX01`, `APP-FE-001.UX02`. **Design contract:** [D12](#d12).  
**Dependency/sequence:** D01 dimensions and shared adoption inventory; human reviewer TBD.

**Where:** Playwright visual/geometry fixtures and evidence; shared tokens and scoped owner components where failures appear; existing APP visual/accessibility records.

**What and how:** Capture required viewport/theme/locale/density/state combinations and inspect full-size output. Add invariants for header/frame/overlay/field proximity/overflow/fonts. Keep goldens unapproved until reviewed; do not accept old screenshots just to make CI green. Separate agent self-review from user approval and manual assistive-technology checks.

**Closure evidence:** Current screenshots have an explicit before/after defect comparison; no failing region masked or tolerance widened; structural regressions fail even if buttons exist; manual unresolved observations are retained honestly.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v39"></a>

### V39 — Prove complete non-technical journeys against real services

**Existing ownership:** `APP-FE-037.UX01`, `APP-FE-017.UX01`, `APP-FE-028.UX03`, `APP-FE-029.UX01`, `APP-FE-036.UX01`. **Design contract:** [D12](#d12).  
**Dependency/sequence:** Dependency-ready frontend slices and guarded disposable paired backend.

**Where:** Existing paired-smoke/Studio/request/reviewer/media/worker acceptance harness; exact current DTO/client pair and twenty-primitive matrix.

**What and how:** Exercise reference form construction, graph authoring, validation/lifecycle, eligible request, private upload, submission, claims, correction and outcome through actual controls. Preserve deterministic faults, stale/duplicate/uncertain/cancel cases. Add a second configured domain for reuse rather than hardcoding purchase-only UI. Use owned disposable resources and actual warnings/evidence policy.

**Closure evidence:** Full scenario has no JSON/copied refs/developer rescue; required human approval remains; no fixture outcome promoted to live acceptance; omissions and backend exceptions retain their own scope, not a green parent status.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v40"></a>

### V40 — Close each slice with migration, performance, rollout and real evidence

**Existing ownership:** `APP-FE-002.UX01`, `APP-FE-033.UX01`, `APP-FE-035.UX01`, `APP-BE-028.UX01`. **Design contract:** [D12](#d12).  
**Dependency/sequence:** Actual focused/paired checks; all affected route consumers inspected.

**Where:** Current APP task/change records; route migration ledger; full check and release evidence; graphify update after code changes when available.

**What and how:** Record exact candidate, migrated routes, removed obsolete presentation, all commands/pass/fail/skip counts, screenshots and unresolved defects. Measure editor responsiveness on named hardware with graph/form sizes and preserve D05 decision limits. Roll out compatible presentation changes without schema/lifecycle resets; retain recovery and support notes. Do not give a percentage complete from ticket counts.

**Closure evidence:** No unverified human/deployment claim; final unchanged-source gate and required scoped evidence retained; approved exceptions named; next slice is explicit; dead controls are not quietly left on non-pilot screens.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

<a id="v41"></a>

### V41 — Replace the dashboard query form/date list with useful metric cards and charts

**Existing ownership:** `APP-FE-015.UX01`, with shared `APP-FE-004.UX01` / `APP-FE-002.UX01`. **Design contract:** [D09](#d09).  
**Dependency/sequence:** Existing analytics catalog/query; shared fields/header. Not a new backend analytics project.

**Where:** src/app/features/analytics/presentation/dashboard/dashboard.html and controller/styles; metric-card/metric-card.html; existing analytics result/drill-down adapters.

**What and how:** Fix sibling label/input grid composition; build compact period settings, catalog-supported KPI cards, actual bounded chart and readable data mode. Keep per-widget loading/empty/unavailable/stale/error. Decode correct unit/value/population, do not fabricate trend/revenue or current-state history. Use returned drill-down descriptors. Reuse or justify a lazy bounded chart renderer.

**Closure evidence:** T39–T41 pass: a real summary and chart appear when supported, not a date list; count zero/mean null/unavailable remain distinct; correct actor-filtered data and drill-down; font/toolbar/style match the rest of the product.

**Inherited requirements:** the relevant T scenarios in D12, source-qualified before/after captures, the owning canonical/API invariants and the unchanged-source final gate. A local check does not replace required real-service or human acceptance.

## 5. Conditional backend changes — only to close an exact UI capability gap

Most complaints in this brief are frontend presentation/composition problems. A readable label, correct gutter, top action menu, star, smooth curve, anchored overlay, real metric chart or contextual editor does not require a new backend service. Prefer existing contracts and adapters. Do not generate a backlog of new endpoints to avoid fixing layouts.

| Potential gap                           | Verify before proposing                                                                                                             | Compatible minimal proposal when genuinely missing                                                                                                          | Work that proceeds without it                                                                               |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Calendar membership-aware team choices  | Actual ordinary-member selector and current eligibility checks, not an admin group list.                                            | A bounded authorized selector/current selected-value projection owned by Calendar/Groups. No broad group disclosure.                                        | Calendar grid, personal events, period navigation, anchored date input.                                     |
| Calendar current reminder configuration | Whether event detail/update offers a safe preservation path and exact current offsets.                                              | A bounded source-authorized current configuration projection or explicit preserve semantics, through the existing owner.                                    | Visual calendar/read-only event inspection; safe commands not needing the absent data.                      |
| Agent safe tool/source discovery        | Current trusted-tool registry, existing catalogs/selectors and context-specific use authorization.                                  | Read-only bounded metadata with readable labels, exact versions, parameter schema and eligibility; no credentials.                                          | Agent layout, instruction/choice editor, actual provider/model controls, ordinary agent-list query builder. |
| Rich agent retrieval queries            | Actual local service/DTOs beyond the inspected flat SearchRequest; stored query version, inputs, permissions and approved executor. | A reviewed typed, bounded query contract only for supported sources; explicit validation/preview and execution authority. No arbitrary SQL tool by default. | Correct existing filter/sort UI and known tool parameter controls.                                          |
| Saved query/source preview              | Existing pure validation/preview endpoint, allowed result projection and limits.                                                    | A separate read-only safe preview/validation projection if approved, with actor checks, bounds, timeouts and private no-store output.                       | Query configuration/readable summary; do not substitute actual tool execution.                              |
| Process discovery                       | Current request/task context navigation, process search/select capabilities and role access.                                        | A bounded authorized discovery projection if a real operator journey needs it and none exists.                                                              | Fix current context navigation and readable existing process details.                                       |
| Favorite lookup/current state           | Existing favorite search/paging and stable resource resolution.                                                                     | Only if existing APIs cannot safely answer current target membership: a bounded actor-scoped lookup, not a new favorite system.                             | Header/star presentation and normal collection migration using current APIs.                                |
| Extra dashboard metrics                 | Current registered metric dictionary and population definitions.                                                                    | A new explicitly defined metric with tests and ownership, not a browser sum over private/current-page data.                                                 | All supported metric cards, charts, units and drill-down.                                                   |
| Operation notification destinations     | Existing source producer/resolver and current operation links.                                                                      | The owning destination contract if still reserved.                                                                                                          | Both editors, list/detail redesign, calendar and dashboard visual work.                                     |

A backend proposal must specify user outcome, existing inspected code/contracts, exact input/output schema, authorization, bounds, compatibility, failures, tests and owning APP ID. Keep all fixed JSON DTOs/envelopes under BaseDTO, snake_case names and existing conventions. Validate current pyproject/lock versions before proposing backend code. No migrations, provider spend, topology changes or new storage fields are approved solely by a UI design example.

## 6. Delivery sequence, scope control and measurable acceptance

### Slice A — one coherent shared product surface

Deliver V01–V06/V11/V14 through a real Users list/detail/edit and one generic task-execution detail. This intentionally tests both explicit user actions and generic resource actions. Produce the token/field/header/page-frame seam plus route ledger. A Users screenshot with good padding but Assign role still below the record is not accepted.

Then finish V07–V10/V12/V13 against actual collections. Preserve saved-view persistence and do not regress compact local work. The observable outcome is that a non-programmer can find a record, understand it, change a permitted field, choose an action and return to the same list without technical references or lost data.

### Slice B — make the workflow editor genuinely manipulable

Deliver V15–V22 with a draft graph containing branches, a return loop, data ports and enough nodes to exercise the viewport. The first demonstrable vertical segment is palette drop → configure → wire a specific outcome → save/reopen. Then prove group movement, both endpoint reassignment, waypoint editing, Arrange/Undo and publication-path correctness. Styling an unmovable node does not close the slice.

### Slice C — make building forms fast and understandable

Deliver V23–V27 with real field labels/control shapes and one client preview state. First demonstrate add Title/Amount/Reason → edit label/validation → enter sample → reorder → save/reopen, all inside the editor. Then extend through collections, media, dynamic choices, rules, multilingual labels and twenty-kind conformance. Do not postpone actual basic label parity behind an unrelated backend integration.

### Slice D — agent/query configuration without code knowledge

Deliver V28–V30 with explicit supported-contract coverage. Show the query filter's typed payload in test evidence, not in the user's normal screen. Show a complete agent detail and edit including static/input choices and actual approved connection/data selections. Separate genuine retrieval-catalog/preview gaps from the UI work already possible. A generic schema form with prettier borders is not an agent editor.

### Slice E — calendar, dashboard and complete surrounding journeys

Deliver V31–V36 and V41 using the accepted shared patterns. Calendar uses meaningful populated/empty/time/overlap fixtures and safe event edits. Dashboard uses actual registered metrics, not placeholder numbers or date rows. Inline upload is integrated before removing its normal standalone navigation. Migrate remaining route families from the ledger, including settings, reusable definitions and Operations screens.

These can be parallelized only with named ownership of shared files, contract generation and lockfiles. Owners are currently TBD. Do not run multiple agents against the same package lock, generated API, shared header or schema migration simultaneously. Integrate/review the shared pattern before multiplying it across routes.

### Slice F — real evidence and user acceptance

V37–V40 accompany every slice rather than being postponed to the end. The final candidate includes the complete migration matrix, focused tests, real browser gestures, required paired journeys, representative responsive/RTL screenshots, recovery instructions and the unchanged-source gate. Missing manual or hosted/deployment evidence is reported separately.

**User outcome checks proposed for acceptance, not measured baselines:**

| Persona            | Demonstration with no coding knowledge                                                                                    | Evidence to collect                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Administrator      | Find a user, understand their actual access/state, edit a field, open a role/password action and return to the same list. | Task completion, assistance needed, navigation errors, lost edits and specific confusing labels.     |
| Form designer      | Build the reference form, set constraints/choices, preview as a client and save/reopen.                                   | Correct structure/values, no JSON/copied IDs, invalid-state recovery and before/after screen review. |
| Workflow designer  | Add, move, connect, configure and arrange a meaningful graph, then use the supported validation/lifecycle.                | Pointer/keyboard success, correct edge meaning, no pin changes, recoverable mistakes.                |
| Agent designer     | Configure the question, choices, model and permitted data/tool bindings, then inspect the resulting policy.               | Correct variant/authorization, no accidental execution, no technical-code prerequisite.              |
| Operator           | Find the relevant result, distinguish failure from uncertainty, and choose a supported action.                            | No false outcome, no blind retry, safe support references, understandable recovery.                  |
| Requester/reviewer | Complete the actual request/approval/correction journey with local attachments.                                           | Server-authorized completion, private data preserved, competing-claim and session behavior.          |

Record completion time and assistance only after running the task with agreed participants. Do not manufacture a “five-minute” baseline, success rate or satisfaction score. Named participant/product approval remains TBD. Developer tests alone do not satisfy persona acceptance.

No revised effort or model-speed estimate is asserted here. Existing estimates were based on earlier source and scope; re-estimate remaining work after the candidate and these delivery slices are reconciled. Do not price each V card as equal effort or add the 41-card count to the 58 ownership IDs.

## 7. Non-negotiable preservation and rejection criteria

**Preserve:** immutable published definitions and active-case pins; server-side authorization/eligibility/client rules; opaque refreshed references; exact canonical values and patch semantics; operation-specific idempotency; private uploads/downloads; actor/session cleanup; existing envelopes/error codes; current form/workflow/worker domain ownership; required human authority.

**Reject a superficial implementation when:**

- Only shared CSS changed while the real template composition still places the canvas under large panels or details above a button strip.
- A new “nice” component exists on `/ui-preview` but production routes still use the old editor or generic modal.
- A field card still says `text` or a schema key while the actual preview has a meaningful label.
- A diagram is styled with curves but nodes, endpoints or routing points do not respond to actual pointer gestures.
- The Arrange button clears layout or reloads a seed instead of calculating a reversible layout.
- The form has two sample-value owners or extra normal configuration forms below the editor.
- A query editor can draw unsupported groups but silently flattens them or sends a different predicate.
- A dashboard looks busy only because synthetic metrics/percentages are hardcoded into live components.
- A calendar is seven boxes with long date strings and no time-grid/event layout.
- A private image field still requires upload elsewhere, then copy/paste a reference.
- Users is treated as an exception to global action placement or Calendar keeps the Users browser title.
- Required controls are hidden to make an overflow/screenshot assertion pass.
- A read-only version is made writable to “fix” drag, or permission checks are removed to make a demo work.
- An agent-generated screenshot is declared user-approved without the actual review.

**Completion report for the coding agent:** show the user-visible outcome first, followed by exact changed files/routes, current code/contract identity, before/after captures, commands and native outcomes, skips/limitations, recovery/rollout notes and the next remaining slice. Explicitly name any in-scope requirement that still fails. Do not summarize a partial styling pass as “UI/UX fixed.”

### Copy-ready continuation instruction

```text
Implement the next dependency-ready vertical slice of FRONTEND_FIXES_MASTER.md
revision 5.0 in the real application routes. Read its D01–D12 design contract and
the owning V cards before editing. Preserve existing APP IDs, local dirty work,
current domain services, authorization, canonical values and immutable pins.

Do not deliver another plan or a CSS-only makeover. Refactor the shared header,
field/page/editor composition where required and migrate all consumers in the
slice, including explicit Users actions. Use the exact wire contract; no normal
JSON/ref-copy workflow and no invented endpoint. Keep existing working preview,
Playwright, query, picker and command infrastructure.

Show a before/after rendered screen and perform the real pointer/keyboard/data
journey. Add failing regressions, repair the implementation, run focused tests,
required paired checks and the full unchanged-source gate. Do not force clicks,
weaken tests, skip required cases or auto-approve broken visual goldens. Report
fixture, integrated, human and deployed evidence separately. Finish with changed
files, route adoption, actual results and precise remaining defects.
```

<a id="ownership"></a>

## Appendix A — The original 58 IDs: exact ownership and retained scope

This is the same original tracking set. The new visual repair cards refine its user-facing criteria; they do not erase broader behavior or acceptance. Original numbers are retained for traceability. A previously delivered feature may receive a scoped UX follow-up without reopening its historical implementation claim. **Do not calculate progress by counting V cards plus APP IDs.**

| Original no. | Existing ID       | Preserved outcome                                                             | Current visual recovery cards / residual                                                                                                        |
| -----------: | ----------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
|            1 | `APP-FE-001.UX01` | Reconcile the current frontend/backend baseline                               | [V01](#v01)                                                                                                                                     |
|            2 | `APP-FE-001.UX02` | Create a reproducible visual and usability baseline                           | [V01](#v01), [V38](#v38)                                                                                                                        |
|            3 | `APP-FE-004.UX01` | Unify design tokens and action hierarchy                                      | [V02](#v02), [V03](#v03), [V11](#v11), [V38](#v38)                                                                                              |
|            4 | `APP-FE-007.UX01` | Make navigation and record screens task-oriented                              | [V03](#v03), [V05](#v05), [V07](#v07), [V09](#v09), [V11](#v11), [V36](#v36)                                                                    |
|            5 | `APP-FE-007.UX02` | Standardize field controls and recovery states                                | [V04](#v04), [V06](#v06), [V13](#v13), [V14](#v14), [V34](#v34)                                                                                 |
|            6 | `APP-FE-006.UX01` | Reuse authorized resource pickers and verify editor adoption                  | [V10](#v10), [V29](#v29), [V36](#v36)                                                                                                           |
|            7 | `APP-FE-005.UX01` | Recover safely from stale and uncertain mutations                             | [V14](#v14)                                                                                                                                     |
|            8 | `APP-FE-036.UX01` | Preserve the session boundary and private transfers                           | [V31](#v31), [V39](#v39)                                                                                                                        |
|            9 | `APP-FE-016.UX01` | Deliver a visual form workspace with a live client-preview dock               | [V23](#v23)                                                                                                                                     |
|           10 | `APP-FE-016.UX02` | Finish safe cross-parent field and layout movement                            | [V24](#v24)                                                                                                                                     |
|           11 | `APP-FE-016.UX03` | Complete placement duplication without changing canonical bindings            | [V24](#v24)                                                                                                                                     |
|           12 | `APP-FE-016.UX04` | Finish responsive editor and runtime layout parity                            | [V23](#v23)                                                                                                                                     |
|           13 | `APP-FE-016.UX05` | Clarify pending edits, Apply, Save, Undo and Publish                          | [V16](#v16), [V26](#v26)                                                                                                                        |
|           14 | `APP-FE-017.UX01` | Verify every declared form primitive end to end                               | [V39](#v39)                                                                                                                                     |
|           15 | `APP-FE-017.UX02` | Provide typed canonical-field creation and binding                            | [V24](#v24), [V25](#v25)                                                                                                                        |
|           16 | `APP-FE-017.UX03` | Build typed validation controls and actionable errors                         | [V25](#v25)                                                                                                                                     |
|           17 | `APP-FE-017.UX04` | Complete collection and table configuration                                   | [V25](#v25)                                                                                                                                     |
|           18 | `APP-FE-017.UX05` | Finish attachment configuration and transfer feedback                         | [V25](#v25), [V31](#v31)                                                                                                                        |
|           19 | `APP-FE-018.UX01` | Replace ordinary behavior JSON with constrained rules                         | [V27](#v27)                                                                                                                                     |
|           20 | `APP-FE-018.UX02` | Make dynamic choices type-safe and race-safe                                  | [V27](#v27)                                                                                                                                     |
|           21 | `APP-FE-018.UX03` | Clarify calculations and manual overrides                                     | [V27](#v27)                                                                                                                                     |
|           22 | `APP-FE-019.UX01` | Build typed pages, views, variants and localization                           | [V27](#v27)                                                                                                                                     |
|           23 | `APP-FE-019.UX02` | Deliver live side-by-side preview conforming to the shared runtime            | [V23](#v23), [V26](#v26)                                                                                                                        |
|           24 | `APP-FE-019.UX03` | Make sample input and diagnostics navigable                                   | [V26](#v26), [V27](#v27)                                                                                                                        |
|           25 | `APP-FE-028.UX01` | Complete eligible creation and resumable private drafts                       | [V12](#v12)                                                                                                                                     |
|           26 | `APP-FE-028.UX02` | Redesign the runtime form for understandable completion                       | [V06](#v06)                                                                                                                                     |
|           27 | `APP-FE-028.UX03` | Protect runtime patch, row and attachment semantics                           | [V06](#v06), [V31](#v31), [V39](#v39)                                                                                                           |
|           28 | `APP-FE-028.UX04` | Show truthful progress, history and final outcomes                            | [V12](#v12), [V32](#v32)                                                                                                                        |
|           29 | `APP-FE-029.UX01` | Complete work queues and claim-race recovery                                  | [V12](#v12), [V39](#v39)                                                                                                                        |
|           30 | `APP-FE-029.UX02` | Render exact configured human decisions                                       | [V33](#v33)                                                                                                                                     |
|           31 | `APP-FE-029.UX03` | Complete targeted return and linked correction                                | [V33](#v33)                                                                                                                                     |
|           32 | `APP-FE-029.UX04` | Separate AI recommendations, tool approval and business approval              | [V33](#v33)                                                                                                                                     |
|           33 | `APP-FE-020.UX01` | Make the workflow canvas a usable direct-manipulation editor                  | [V15](#v15), [V16](#v16), [V17](#v17), [V18](#v18), [V19](#v19), [V20](#v20), [V21](#v21)                                                       |
|           34 | `APP-FE-021.UX01` | Build exact-version typed node inspectors                                     | [V15](#v15), [V22](#v22)                                                                                                                        |
|           35 | `APP-FE-022.UX01` | Finish assignment and human-task inspectors                                   | [V22](#v22)                                                                                                                                     |
|           36 | `APP-FE-023.UX01` | Provide typed visual data mapping                                             | [V13](#v13), [V19](#v19), [V22](#v22), [V30](#v30)                                                                                              |
|           37 | `APP-FE-024.UX01` | Complete supported branch, timer, event and subprocess editors                | [V22](#v22)                                                                                                                                     |
|           38 | `APP-FE-025.UX01` | Finish governed integration and AI configuration                              | [V22](#v22), [V28](#v28), [V29](#v29), [V30](#v30)                                                                                              |
|           39 | `APP-FE-027.UX01` | Make publication, repair and version comparison understandable                | [V16](#v16), [V22](#v22), [V36](#v36)                                                                                                           |
|           40 | `APP-FE-012.UX01` | Finish unified inbox and authenticated SSE behavior                           | Carry forward: existing inbox/SSE, recipient/deep-link matrix and operation destinations; regress redesigned shell/contextual actions. See A.1. |
|           41 | `APP-FE-014.UX01` | Complete calendar team selection, dates and reminders                         | [V34](#v34), [V35](#v35)                                                                                                                        |
|           42 | `APP-FE-015.UX01` | Preserve and regress the implemented analytics experience                     | [V41](#v41), shared [V02](#v02) / [V38](#v38); retain original analytics semantics and full acceptance                                          |
|           43 | `APP-FE-030.UX01` | Replace generic integration/AI administration JSON                            | [V04](#v04), [V05](#v05), [V28](#v28), [V29](#v29), [V30](#v30)                                                                                 |
|           44 | `APP-FE-031.UX01` | Finish identity, group, client and request-type administration                | [V04](#v04), [V10](#v10)                                                                                                                        |
|           45 | `APP-FE-032.UX01` | Make reports, execution receipts and recovery usable                          | [V03](#v03), [V05](#v05), [V32](#v32), [V33](#v33)                                                                                              |
|           46 | `APP-FE-013.UX01` | Preserve and regress safe support/error handling                              | [V14](#v14)                                                                                                                                     |
|           47 | `APP-FE-008.UX01` | Preserve preferences, saved views, favorites and help                         | [V07](#v07), [V08](#v08), [V09](#v09)                                                                                                           |
|           48 | `APP-FE-033.UX01` | Close real API/UI coverage and correct the JSON register                      | [V13](#v13), [V40](#v40)                                                                                                                        |
|           49 | `APP-FE-034.UX01` | Verify remaining accessible names and multilingual authoring                  | [V38](#v38)                                                                                                                                     |
|           50 | `APP-FE-035.UX01` | Measure bounded performance and lifecycle cleanup                             | [V40](#v40)                                                                                                                                     |
|           51 | `APP-FE-037.UX01` | Prove the connected reference journey and a second configuration              | [V39](#v39)                                                                                                                                     |
|           52 | `APP-FE-002.UX01` | Extend existing Playwright and enforce final-tree gates with truthful handoff | [V37](#v37), [V40](#v40)                                                                                                                        |
|           53 | `APP-BE-008.UX01` | Verify or provide actor-eligible team selection                               | [V35](#v35)                                                                                                                                     |
|           54 | `APP-BE-014.UX01` | Reconcile inbox destination producers and documentation                       | Conditional: current authorized operation notification destinations, not another notification transport. See §6.3.                              |
|           55 | `APP-BE-019.UX01` | Fill only demonstrated designer metadata or diagnostic gaps                   | [V30](#v30)                                                                                                                                     |
|           56 | `APP-BE-020.UX01` | Verify existing runtime conformance; repair proven backend mismatches only    | Conditional: shared canonical/runtime mismatch repair after exact-pair failing cases. V39 consumes this evidence; see §6.3.                     |
|           57 | `APP-BE-027.UX01` | Close proven outcome and reconciliation projection gaps                       | [V32](#v32)                                                                                                                                     |
|           58 | `APP-BE-028.UX01` | Adapt the existing disposable paired harness for browser acceptance           | [V40](#v40)                                                                                                                                     |

### A.1 Scope not erased by a visual repair

**Notifications:** keep recipient-scoped persisted inbox/history, unread/read behavior, authenticated streaming, reconnect/backfill, actor cleanup, current-ref marking and authorized deep-link resolution. Current operation-destination gaps remain with the producer/resolver owner. Relocating a bell/action must not change delivery semantics or present historical items as newly delivered popups.

**Analytics:** retain exact populations/units/as-of times, authorized drill-down queries, unavailable versus unknown versus zero, date/timezone semantics and deletion filters. Apply the improved page/header/readable formatting pattern without inventing monetary metrics or a new chart service.

**Identity, clients, request types, AI/integrations, reporting and operations:** V04/V05/V10/V12/V28/V29/V32/V33 define the improved human interface, not permission to omit existing specialist settings. Carry forward exact client eligibility, secret handling, claims/corrections, approval actions, reports/history pagination, dispatch receipts/reconciliation and remaining schedule/connection/agent inspectors. New domain controls must cover the actual contract or retain an explicit compatibility limitation; hiding missing controls is not completion.

**All form primitives and workflow semantics:** V24–V27 and V39 do not reduce the twenty-kind matrix to six quick fields. Preserve complex collection/media/action behavior, canonical field/placement distinction, reusable versions, exact pins, views/localization and all supported node types/branches/timers/subprocess mappings. A small accepted editor demonstration is not the entire matrix.

**Quality, release and support:** retain earlier private-transfer, session expiry/rotation, task race, workers/providers, migrations/restore and measured performance requirements appropriate to the affected scope. Documentation, operational recovery and named user/owner acceptance remain separate from code tests. Do not introduce shared resets, new tenancy or HA infrastructure under a UI ticket.

## Appendix B — Source evidence and contract provenance

**Source identity is not browser identity.** Frontend main was rechecked online in this review and still resolved to `6aba0a5a6fad8ed7f6d51918a390ee13c12d9ae2`; backend main still resolved to `4a5ec27f9f14eba7ad7fd7bbfa5280a7ed77d272`. The latest local screenshots cannot be assigned to either working tree without a recorded build/source fingerprint. Preserve the implementing agent's local changes.

**C01–C32** below are the previous review's selected source excerpts carried forward at the same pinned frontend revision, not a claim that every file was reread or rerun in this continuation. **C33–C39** record additional source inspected for this revision. Blob SHAs are GitHub content identities; a test file or past verification record is not evidence that its tests ran here.

Frontend lookup base: `https://github.com/Metal-Bat/angular-base/blob/6aba0a5a6fad8ed7f6d51918a390ee13c12d9ae2/`. Backend lookup base: `https://github.com/Metal-Bat/async-fast-api-base/blob/4a5ec27f9f14eba7ad7fd7bbfa5280a7ed77d272/`. Append the exact path. Reconcile current local files before editing.

| Ref | Exact file                                                                            | Blob SHA                                   | Inspected evidence / scope                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 | `AGENTS.md`                                                                           | `ffd5a25f06904396a297501675d6a3604f500671` | Current architecture, PrimeNG-first policy, strict frontend evidence gate, DB-002/D07 reconciliation.                                                                                     |
| C02 | `package.json`                                                                        | `14bf8049ca7c8e597de06fa69a59174bc19185a2` | pnpm 12.11.2; Angular 21.2.25; Foblex 19.3.0; PrimeNG 21.1.10; Playwright 1.64.0 declared; browser/type/lint commands exist.                                                              |
| C03 | `playwright.config.ts`                                                                | `1074b511b568fa54e25e66c0b8db23e652adf84b` | Three browser projects; one worker; no retries; failure traces/screenshots.                                                                                                               |
| C04 | `tests/playwright/studio.spec.ts`                                                     | `96eeb75de6bdd3cc816aa40030abb718522b1bdc` | Three fixture-backed production-page tests: selection/duplication, live preview, explicit click-to-connect outcome. Not a complete drag, visual or real-service suite.                    |
| C05 | `src/app/features/studio/infrastructure/workflow-canvas/workflow-canvas.html`         | `bae14f4f99c74cf7fc25d197522cd5e33686f478` | Existing edge selection/context handling, output outcome chooser, waypoints, node/port mutation guards and whole-card drag handle.                                                        |
| C06 | `src/app/features/studio/infrastructure/workflow-canvas/workflow-canvas.ts`           | `d28bbf8ad57bf874ec5c07ce9491e1c6af6eb4cc` | Existing outcome and context state; extends CanvasNavigation. Selected source ranges read, not a browser reproduction.                                                                    |
| C07 | `src/app/features/studio/infrastructure/workflow-canvas/canvas-navigation.ts`         | `1124808beb969e0ea1db90d44161416453466b7b` | Navigation deliberately separated from mutation guards; preserve this repair.                                                                                                             |
| C08 | `src/app/features/studio/presentation/workflow-board/workflow-board.ts`               | `6f1a74dbf9501efec7cf3c369c64f52eff1fc648` | Selected range: current selection reset, explicit readOnly status, edge callbacks and domain update/history pipeline.                                                                     |
| C09 | `src/app/features/studio/presentation/form-builder/form-builder.html`                 | `b43af303c3e95cc1cd3afc7a10208c7d8d28d57b` | Selected range: existing authoring-workspace and form-card drag/drop outputs; current screenshot supplies the visible preview/JSON evidence.                                              |
| C10 | `src/app/features/studio/presentation/form-builder/form-builder.scss`                 | `e8dba0017fde00687d0e64f88f1b22b1ba350173` | Outer 3fr/2fr workspace plus inner three-column designer; independent 80rem/64rem breakpoints and sticky scrollable preview.                                                              |
| C11 | `src/app/features/records/presentation/resource-page.html`                            | `82cc31955efbfba73213ecdb447f7c886389b1e2` | Generic record edit/create p-dialog; actions after detail; existing shared list/query/table composition.                                                                                  |
| C12 | `src/app/features/records/presentation/record.routes.ts`                              | `4c4a815712b22545c274934274663e8f29cd9521` | Existing ResourcePage route ownership, providers, access and unsaved guards.                                                                                                              |
| C13 | `src/app/features/administration/presentation/administration.routes.ts`               | `6a6fba4ebef815795df85d927dad88395240865f` | Agents use recordRoute; process-controls is a distinct component; task schedules/executions use records.                                                                                  |
| C14 | `src/app/features/studio/presentation/resource-catalog/resource-catalog.html`         | `abae6bb2c0ad6c4bdc5251d7ca632f8c01650f43` | Catalog content/actions/extras ordering; current dialogs and report/history flows.                                                                                                        |
| C15 | `src/app/features/studio/presentation/resource-catalog/resource-catalog.ts`           | `8f44a8ce94e23ac2a55fa2eb692ff857fe8f926d` | Selected range: existing catalog headers/actions/editor, shared summary, dependencies and saved-view application.                                                                         |
| C16 | `src/app/features/studio/presentation/catalog-extras/catalog-extras.ts`               | `dc33a40a22e47ae6a2c3e41f758beea615d1e5be` | Existing FavoriteAction/SavedViews/DependencyReadiness composition and canLeave seam.                                                                                                     |
| C17 | `src/app/shared/ui/saved-views/saved-views.html`                                      | `6edb2d3382cedbf5780da6cfadf667134e731f0d` | Permanent large editor for selector/columns/name/apply/update/default/remove/reload; preserve repair and replay semantics while relocating.                                               |
| C18 | `src/app/shared/ui/favorite-action/favorite-action.ts`                                | `7e7714ec2be81eb726fb94bb25db6de8c94239cd` | Add-only control, local saved state reset on reference/kind changes; extend to authoritative current toggle without guessing favorite identity.                                           |
| C19 | `src/app/features/records/presentation/favorites/favorites.html`                      | `940b8649091d9b35c2f26f16012fa6672079c607` | Large open/remove buttons, minimal empty-state and standalone paging; actual favorite page was source-reviewed, not screenshot-reviewed.                                                  |
| C20 | `src/app/shared/ui/record-summary/record-summary.ts`                                  | `e737ff68c0fd67043b3d4162fae32cc1fbb1cbdc` | Generic flattened overview/path labels; reusable date formatting and history changes already exist.                                                                                       |
| C21 | `src/app/features/administration/presentation/resource-actions/resource-actions.html` | `e7982156750210b334d9516e4b3496f7ce7cff67` | Bottom action buttons and generic command-schema dialog; keep command ownership while replacing presentation.                                                                             |
| C22 | `src/app/features/administration/presentation/process-controls/process-controls.html` | `04eb1b458e3f8e44fc352cf717ef0bad558caf4e` | Required raw process reference, selected summary and resource actions.                                                                                                                    |
| C23 | `src/app/shared/ui/temporal-control/temporal-control.html`                            | `57f16188daff63066a9bfc7103332530ef436451` | Calendar navigation/grid uses a modal p-dialog; date/time/calendar/offset controls share an existing seam.                                                                                |
| C24 | `src/app/shared/ui/list-query/list-query.html`                                        | `df34f0428cfc1c86715547167f50c7f8a124a05f` | Selected range: repeated Advanced filters heading, typed filter component, comma-separated sort field input.                                                                              |
| C25 | `src/app/shared/ui/list-query/query-filters.html`                                     | `a6ab3df93345cc840bd18f666ef79bd693a4aa20` | Selected range: field/operator/value rows already exist; boolean/date/list variants are not missing.                                                                                      |
| C26 | `src/app/features/calendar/presentation/calendar-page/calendar-page.html`             | `c4a6425b5cb0437107c15cc395c1c56f27b3250a` | Standalone date/timezone form, existing CalendarViews and in-page editor/reminders.                                                                                                       |
| C27 | `src/app/features/operations/presentation/generic-media/generic-media.ts`             | `c1e4c93b521acf0e55451817fb07fdb239d3729d` | Existing BinaryTransfer upload/download and actor cleanup; not the same as completing an attachment association.                                                                          |
| C28 | `src/app/features/operations/presentation/operations.routes.ts`                       | `a17fbbae459e72ea6f5900fa95a52585bfb2cc8c` | Selected range: calendar, favorites, media, report feature ownership and shared process destination port.                                                                                 |
| C29 | `mise.toml`                                                                           | `40bcd70c7bc65ab52fd8aefe75c9896c367e2d9b` | Exact Node/pnpm tools; install, dev and check entry points.                                                                                                                               |
| C30 | `scripts/check-project.mjs`                                                           | `6e7b7e7a1549e8e767b985def78f4bf3b2c51100` | Selected range: requiredCheckStages, optional configured paired smoke, source identity and diagnostic capture.                                                                            |
| C31 | `docs/delivery/FRONTEND-BACKLOG.md`                                                   | `2f044d6c6319f1d99fcf285fbad14a080aeeb356` | Selected current instructions: authoritative APP ownership, preserve history, no fixture-to-integration promotion.                                                                        |
| C32 | `.agents/skills/contract-consistency/SKILL.md`                                        | `d0011df6104926fa04677514b14293200afe6c2c` | Existing mapping/boundary/compatibility and evidence-before-change rules.                                                                                                                 |
| C33 | `src/app/features/analytics/presentation/dashboard/dashboard.html`                    | `4ce60c56fee31dcba08c6dcdbf67ee0c452de7bb` | Frontend: separate label/control siblings in a two-column grid; end-date/timezone/dimension settings; one MetricCard output.                                                              |
| C34 | `src/app/features/analytics/presentation/metric-card/metric-card.html`                | `f9d2301e60a18b1bd9c4383ec3c677fd029b197a` | Frontend: per-date percentage-width bars plus a full table; existing null/stale/unavailable and drill-down semantics to preserve.                                                         |
| C35 | `src/styles.scss`                                                                     | `6a62832f9c0c4b32afc813661ab20f1472cbcbf1` | Frontend: Material root font shorthand, shared stylesheet imports, fallback native-control rules and theme/density tokens. Computed root font size was not measured.                      |
| C36 | `src/app/shared/styles/_typography.scss`                                              | `ffe866a7e19c26425bfd62e48972336b0c6eabfc` | Frontend: existing language-aware Inter / Yekan Bakh / Noto Sans Arabic family declarations. Actual browser font load/weights remain to verify.                                           |
| C37 | `src/utils/pagination.py`                                                             | `c2a7cff58d82005db01785b3004e85de027e5a8c` | Backend: selected ranges 1–170 and 245–375. Typed filter/sort DTOs, field/operator/value validation, bounds and ALL-combined in-memory filtering. No whole query subsystem audit claimed. |
| C38 | `src/apps/ai/domain/dto.py`                                                           | `dea7dded116117763803461e9cba7e6f494a5d22` | Backend: selected range 1–140. Agent query fields, create/update/detail and model/provider metadata; typed tool-approval description including bounded lookup_saved_report arguments.     |
| C39 | `tests/utils/test_live_query_policy.py`                                               | `ee4cce77bec0a546c73d835cab788fe6637113d5` | Backend test source read for owner navigation; imports current pagination implementation. Tests were not executed.                                                                        |

**Supplied OpenAPI:** `openapi.json`, SHA-256 `043b96cdf9efe0278472256ea13fbb601ac96f01c869608ff910766f68fc3e9a`. Parsed snapshot counts: 379 operations and 565 component schemas. Described authoring, calendar, analytics, AI, private-media, link and workflow workspace contracts informed this specification. This is not proof that the current deployed API or unpushed peer source is identical. Do not infer full runtime behavior from DTO presence.

Source search additionally located `src/apps/ai/domain/contracts.py` and `src/apps/ai/application/agent_service.py` for permitted retrieval and trusted-tool pinning; search excerpts are navigation evidence, not a completed executor/security review. The coding agent must read the exact owning implementation and tests for its chosen source/tool.

**This review executed:** source/document inspection, supplied-image inspection, public-reference research and Markdown generation/validation. **This review did not execute:** the Angular application, browser gestures, Playwright, `mise run check`, paired backend/worker/storage tests, migrations, deployment, manual accessibility or user acceptance. Local Node was 22.16.0; the required mise/graphify toolchain and a local graph were not available. No font files are distributed.

Public-reference URLs and implementation boundaries are in R01–R14. They support patterns and documented APIs, not installed compatibility or a mandate to copy another application's implementation. The occasional inaccessible public page is not presented as fully inspected.

## Appendix C — Prior screenshot evidence retained

These earlier screenshots are historical visual evidence from the user's localhost, not proof that every old defect remains unchanged in the latest working copy. S20–S27 in §1 are the newer evidence. The descriptions concern visible composition; reported pointer failures still require reproduction in an authorized draft.

| Ref | Supplied image                   | Screen                                | Visible evidence from the earlier capture                                                                                                                                                 |
| --- | -------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01 | `Screenshot_20261013_230550.png` | Saved form display                    | Excess vertical field spacing; a full-width Remove value action below each scalar input; preview controls spread across the full header.                                                  |
| S02 | `Screenshot_20261013_230750.png` | My requests                           | Raw ISO timestamp, generic Open request row label, numeric priority without explanation, and a large saved-view editor dominating a one-row list.                                         |
| S03 | `Screenshot_20261013_230803.png` | Workflow detail, scrolled lower       | Versions, remove, Access grants, Add to favorites and the large saved-view panel appear below the diagram instead of in relevant headers.                                                 |
| S04 | `Screenshot_20261013_230900.png` | Workflow Display tab                  | Read-only four-node diagram, overlapping control wires/labels and generic handler names; read-only mode must be respected.                                                                |
| S05 | `Screenshot_20261013_230917.png` | Workflow designer, lower page         | Keyboard connection controls, history and advanced sections require leaving the canvas; palette and inspector extend the outer page.                                                      |
| S06 | `Screenshot_20261013_231012.png` | Workflow designer, canvas and palette | Right palette exists but is narrow, scroll-heavy and shows repeated Notification labels; node/port labels are tiny; footer says read-only.                                                |
| S07 | `Screenshot_20261013_231054.png` | Form designer, top                    | Published badge, four cramped columns, raw schema paths, permanent insertion targets, large expert JSON controls inside the preview, and nested scrolling. A side preview already exists. |
| S08 | `Screenshot_20261013_231104.png` | Form designer, lower page             | Translations and a second synthetic sample form occupy a long page below the editor; sample-data responsibilities are duplicated.                                                         |
| S09 | `Screenshot_20261013_231110.png` | Form designer, options/navigation     | Node pointer and synthetic query JSON textarea remains the visible options/navigation test interface.                                                                                     |
| S10 | `Screenshot_20261013_231154.png` | Reusable data types                   | Code-first long machine identifiers, duplicated filter heading and largely generic list treatment.                                                                                        |
| S11 | `Screenshot_20261013_231207.png` | Reusable library                      | Kind is selected both by navigation tabs and a separate control; code-first rows and ambiguous checkmark actions.                                                                         |
| S12 | `Screenshot_20261013_231315.png` | AI agent editing                      | Deeply nested generic Edit record modal, schema class name AIDecisionContract, Add value/Field controls, language-code maps, flattened detail behind it and a stale-resource error toast. |
| S13 | `Screenshot_20261013_231347.png` | Task execution detail                 | Generic overview, raw queue/worker identifiers, an overprecise seconds value and a separate low-page Actions panel.                                                                       |
| S14 | `Screenshot_20261013_231408.png` | Process controls                      | A process-reference input is the only visible starting point; no ordinary discovery or contextual selection is shown.                                                                     |
| S15 | `Screenshot_20261013_231426.png` | Users                                 | Advanced filter configuration consumes a large part of the first viewport; sparse one-column data; Include deleted users is visibly unchecked.                                            |
| S16 | `Screenshot_20261013_231436.png` | Calendar agenda                       | Controls lack a coherent period toolbar; empty days are presented as large outlines; timezone is free text.                                                                               |
| S17 | `Screenshot_20261013_231443.png` | Date picker                           | Choose date opens as a centered page-dimming dialog instead of next to the field.                                                                                                         |
| S18 | `Screenshot_20261013_231455.png` | Calendar month                        | A grid of verbose full-date cards without conventional weekday headings or useful day-cell event space.                                                                                   |
| S19 | `Screenshot_20261013_231458.png` | Calendar week                         | A single strip of full-date cards leaves most of the screen unused; selected mode and empty-state guidance need clarity.                                                                  |

## Appendix D — Required implementation evidence template

Use this in the existing owning change record. Populate only actual results. Keep historical failures and previous accepted scopes intact.

```text
Slice / V cards / existing APP owner:
User outcome and exact remaining scope:
Routes migrated and old presentation removed:
Frontend commit + working-source fingerprint:
Backend/source or fixture identity and contract hash:
Lock/tool/browser/OS/font/viewport/theme/locale/density identities:
Reproduced defect and first failing layer:
Changed files and architectural seams reused:
Before and after screenshots with explicit visual differences:
Domain/contract checks, command and native result:
Actual browser gestures and layout checks, command and result:
Paired real-service journey, command and result or NOT_RUN reason:
Warnings, errors, skips and retained failure artifacts:
Full final unchanged-source mise run check:
Agent visual self-review findings:
Human product/visual decision (TBD until supplied):
Manual accessibility/device decision (separate):
Recovery, rollout, support and compatibility notes:
Exact blockers, owner and next dependency-ready slice:
```

**Do not report a plan as an implementation, a declared component as browser verification, a fixture as a live journey, an agent self-review as user acceptance, or a test pass as deployment.**

### Reported select/calendar regression continuation — 2026-10-17

The [scoped repair record](docs/changes/APP-FE-004-LOCALE-OVERLAYS.md) tracks the subsequently reproduced nested-dropdown offset, preference spacing, public login-theme cache and calendar-aware timestamp display. Its final receipt and actual live form/canvas/three-language interactions are independent of earlier acceptance. Yekan Bakh assets remain missing; font acceptance and overall master closure are not claimed.

### Reopened form and canvas flow acceptance — 2026-10-18

The [native editor flow audit](docs/changes/APP-FE-016-EDITOR-FLOW-AUDIT.md) records failures found through UI-created drafts against the running backend, their repairs and retained attempts. Earlier minimal drag/save checks do not establish complete authoring acceptance. The current full gate, live flow matrix, cleanup and source identity are tracked separately under `artifacts/editor-flow-audit/`; master and human visual acceptance remain open.

### Ordered follow-up and font choice — 2026-10-18

The user replaced the earlier Yekan Bakh requirement with bundled open-source
Vazirmatn and requested this order: typography; Calendar/operations; agent and
integration administration; requests/tasks; advanced forms/workflow; final
acceptance. [The owning follow-up](docs/changes/APP-FE-038-ORDERED-FOLLOW-UP.md)
records scoped changes, native/service results and exact remaining dependencies.
The old missing Yekan Bakh asset condition is superseded, not a current blocker.
No whole-master, manual, deployment or user-acceptance closure is inferred.

### Data mapper continuation — 2026-10-18

[The data mapper record](docs/changes/APP-FE-023-DATA-MAPPING.md) tracks LIST and
structured constants, nested request and indexed-item fields, typed conversion
ports, field-based projections, deliberate mapping repair and their actual
browser/service evidence. Remaining producer limits are explicit; this does not
close the whole master or imply private sample/provider execution acceptance.

### Pinned subprocess input continuation — 2026-10-18

[The existing APP-FE-024.3 owner](docs/changes/APP-FE-024-SUBPROCESS.md) now covers
purpose-built structured child constants, explicit authorized sources, deliberate
mapping repair and exact-version inspection. Current receipts govern scoped
verification; remaining advanced lifecycle, interface-authoring and manual/deployed
acceptance are not inferred from this continuation.

### Workflow interface and wait continuation — 2026-10-19

APP-FE-024.3/.2: Properties now provides named reusable-workflow inputs, exact
registered output-port choices, nested object/collection input fields and business
outcomes targeting real Finish steps. Authorized condition value paths reuse the
producer completion owner and explain typed request-mapping requirements.
Pending edits, Apply/Discard, Undo/Redo and published read-only behavior reuse the
existing editor. Field containment and localization are verified independently of
page width. Actual-service child publication/execution and parallel timer/event
lifecycle are recorded in [the owning continuation](docs/changes/APP-FE-024-INTERFACE.md)
and its scoped completion receipt. Missing receipts do not imply completion; full
fault/dependency, producer-limited mapper features and human/deployed acceptance
remain separate.

The same continuation now consumes declared child inputs without a request-type
lookup, maps indexed collection fields into pinned child inputs, uses actual child
business outcomes and verifies asynchronous child settlement. Process controls
explain the producer's active-child mutation restriction. Actual bounded-cycle,
unconditional-else and transaction-preservation checks are separate from open
request-schema reconstruction and legacy transform producer findings; see the
peer handoff and current receipt. No whole-master or manual acceptance is inferred.

### Ordered remaining-work acceptance — 2026-10-19

[The execution crosswalk](docs/delivery/ORDERED-REMAINING-WORK.md) preserves the
existing owners and avoids duplicate implementations. The continuation repairs
named correction authoring, decision-draft retention, empty-reference polling and
Save-before-Resolve feedback stability. Actual reviewer, protected approval,
workflow fault/dependency, form lifecycle, Calendar deadline/recovery and supported
Agent checks are recorded in [the ordered execution journal](docs/changes/APP-FE-038-ORDERED-EXECUTION.md).
Its final source-qualified completion receipt governs final verification; an
absent or partial receipt is incomplete. Backend-dependent mapper/agent/team
capabilities and manual/deployment/user acceptance remain explicitly separate.

### Literal field and page-validation repair — 2026-10-19

The [existing-owner continuation](docs/changes/APP-FE-016-LITERAL-SCOPES.md) fixes literal schema-key names in forms, corrections and authorized workflow value choices. Page navigation respects invalid raw input and exact field boundaries. Final actual-service, three-language/three-engine and full-gate evidence belongs to its completion receipt; absent or partial evidence is incomplete. Parent/master readiness and external acceptance remain open.

### Linked correction navigation — 2026-10-19

APP-FE-029.UX03 [continues the existing feedback owner](docs/changes/APP-FE-029-LINKED-CORRECTIONS.md)
with named field links, current nested row positions, page-aware focus and retained
unsaved/invalid input. Links never resolve, save or decide tasks. Hidden, removed,
denied or unavailable fields retain explicit safe states. The source-qualified
completion receipt owns actual results; parent/master acceptance remains open.
