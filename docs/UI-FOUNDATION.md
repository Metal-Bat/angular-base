# UI foundation — Steps 14–16

The authenticated shell now provides permission-aware area navigation, breadcrumbs, an account menu, a responsive navigation toggle and a paginated notification subject preview. Loading, retry, empty, denied and missing-route states have working behavior. Full notification actions remain Step 27.

## Theme and component selection

`core/theme/workspace-preset.ts` maps PrimeNG's public semantic tokens to Material's public system colors. Both libraries use Arial/Tahoma typography, normal density and the shared `.app-dark` color scheme. Tailwind handles layout and spacing in the documented layer order. Native controls have shared focus, disabled and error styles; library internals retain their own theme APIs.

Choose PrimeNG for operational tables and dialogs; use Material when its form-field behavior fits the interaction. Import components locally. `shared/ui/ui-showcase` demonstrates both input libraries, field errors, a table, a PrimeNG dialog and native confirmation. The authenticated `/ui-preview` route is development-only; production file replacement removes its route and component chunks.

`ColorScheme` changes the current document theme. No theme preference or actor content is persisted. `FieldWrapper` supplies an explicit control ID and linked hint/error IDs; consuming controls must bind those IDs. `Feedback` provides live command status, pointer-linked error summaries, explicit reconciliation and confirmation. Native modal confirmation restores focus; actor cleanup cancels it and clears issues.

## Language, values and dates

`Locale` switches English/Persian and document LTR/RTL. Persian messages load lazily. Labels and chrome translate; canonical values, typed keys, outcomes, commands and version pins do not change. Unknown/server-provided text stays unchanged and Angular escapes it. Mixed-language sample values use directional isolation. Accept-Language follows the selected locale; the next authorized read can obtain server-localized labels.

Date display explicitly requires a timezone and uses the Gregorian calendar through Intl. Fixtures use UTC where a timezone is needed. Step 19 uses explicit Gregorian date-only strings and offset-bearing datetime input. Jalali entry and business timezone presentation require a separate agreed policy. Changing locale never parses or rewrites a stored date or numeric value.

## Verification

Run `npm run test:browser-ui` with Firefox installed. It creates a temporary development build, runs the disposable authenticated fixture and cleans up the build. Firefox checks shared typography, light/dark transition, Persian RTL with unchanged input values, dialog semantics, confirmation focus containment/restoration, validation-link focus and small-screen overflow. Unit tests cover locale and feedback cleanup. The production check measures the existing bundle budgets; the preview is excluded and translations are lazy.

These checks establish the foundation. Full assistive-technology review, supported-browser coverage and WCAG 2.2 AA assessment remain QA-04; runtime renderer and canvas RTL checks follow their implementation steps.

The shared runtime renderer uses native scalar controls with the same field wrapper and tokens. `/operations/runtime-preview` is development-only. Theme loading uses an awaited startup initializer and a lazy preset import; this keeps the initial production bundle below its warning budget while still loading the preset before application UI appears. The preset remains part of startup network work.
