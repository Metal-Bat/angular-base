# UI foundation — Steps 14–16

The authenticated shell now provides permission-aware area navigation, breadcrumbs, an account menu, a responsive navigation toggle and a paginated notification subject preview. Loading, retry, empty, denied and missing-route states have working behavior. Full notification actions remain Step 27.

## Theme and component selection

`core/theme/workspace-preset.ts` maps PrimeNG's public semantic tokens to the shared console palette. PrimeNG and Tailwind use the same blue accent, surfaces, text and input-border tokens in light/dark mode. The system font stack and shared `.app-dark` selector keep feature pages consistent. Tailwind handles layout and spacing in the documented layer order. Native controls have shared focus, disabled and error styles; library internals retain their own theme APIs.

Choose PrimeNG for operational tables and dialogs; use Material when its form-field behavior fits the interaction. Import components locally. `shared/ui/ui-showcase` demonstrates both input libraries, field errors, a table, a PrimeNG dialog and native confirmation. The authenticated `/ui-preview` route is development-only; production file replacement removes its route and component chunks.

`ColorScheme` changes the current document theme. No theme preference or actor content is persisted. `FieldWrapper` supplies an explicit control ID and linked hint/error IDs; consuming controls must bind those IDs. `Feedback` provides live command status, pointer-linked error summaries, explicit reconciliation and confirmation. Native modal confirmation restores focus; actor cleanup cancels it and clears issues.

## Language, values and dates

`Locale` switches English/Persian and document LTR/RTL. Persian messages load lazily. Labels and chrome translate; canonical values, typed keys, outcomes, commands and version pins do not change. Unknown/server-provided text stays unchanged and Angular escapes it. Mixed-language sample values use directional isolation. Accept-Language follows the selected locale; the next authorized read can obtain server-localized labels.

Date display explicitly requires a timezone and uses the Gregorian calendar through Intl. Fixtures use UTC where a timezone is needed. Step 19 uses explicit Gregorian date-only strings and offset-bearing datetime input. Jalali entry and business timezone presentation require a separate agreed policy. Changing locale never parses or rewrites a stored date or numeric value.

## Verification

Run `npm run test:browser-ui` with Firefox installed. It creates a temporary development build, runs the disposable authenticated fixture and cleans up the build. Firefox checks shared typography, light/dark transition, Persian RTL with unchanged input values, dialog semantics, confirmation focus containment/restoration, validation-link focus and small-screen overflow. Unit tests cover locale and feedback cleanup. The production check measures the existing bundle budgets; the preview is excluded and translations are lazy.

These checks establish the foundation. Full assistive-technology review, supported-browser coverage and WCAG 2.2 AA assessment remain QA-04; runtime renderer and canvas RTL checks follow their implementation steps.

The shared runtime renderer uses native scalar controls with the same field wrapper and tokens. `/operations/runtime-preview` is development-only. Theme loading uses an awaited startup initializer and a lazy preset import; this keeps the initial production bundle below its warning budget while still loading the preset before application UI appears. The preset remains part of startup network work.

## PrimeNG and Tailwind refinement, October 4, 2026

Login uses PrimeNG InputText and Button directives with the existing reactive form, password cleanup, error messages and server session flow. Tailwind supplies the responsive card, field spacing, typography and semantic color utilities through `@theme inline` in `src/tailwind.css`. The shell header and Operations dashboard use the same palette and PrimeNG actions. Entry animations use native CSS; hover/focus transitions are brief and the existing reduced-motion rule disables motion for users who request it. Keyboard focus, labels, visible validation, loading/disabled submit, mobile layout and Persian RTL remain part of browser verification.

The shell loads through its route's `loadComponent` so its presentation controls are outside the initial bundle. Existing build budgets remain unchanged. Extend these shared tokens and spacing conventions when refining further screens rather than introducing independent palettes.

Refinement verification: 258 unit tests and the production build passed; the generated manifest measured 415,553 initial bytes. The login browser journey and its automated accessibility audit passed. Disposable Chromium previews verified PrimeNG controls, light/dark mode, mobile Persian RTL, field validation, reduced motion and no horizontal overflow. The broader Firefox shared-UI fixture timed out at the Persian stage, including an isolated rerun; the development build later took 285 seconds during severe host load. That fixture remains unverified for this refinement. Stage-only fixture diagnostics now identify timeout location without logging credentials or field values.

The admin panel refinement keeps the desktop toolbar and sidebar available while scrolling and collapses navigation on mobile. Only the current area landing page receives its `aria-current="page"` marker; individual work links identify their own active route. Operations has a primary request action, an inbox shortcut, and linked workflow steps. Administration cards describe each resource while preserving permission filtering. These screens share the existing PrimeNG theme and Tailwind layout utilities.

Panel verification: the production build and 258 unit tests passed. Targeted lint has no errors. The Chromium landing fixture passed navigation and automated accessibility checks for Studio and Administration in light/dark mode. A disposable overview fixture checked desktop light/dark and mobile Persian RTL with zero horizontal overflow or automated WCAG violations. These fixture checks use synthetic accounts and do not establish full manual accessibility or live backend workflow signoff.

### Named color palettes

The header Theme dropdown offers Blue, Indigo, Violet, Emerald, Teal, Rose and Amber, each in light and dark mode. These curated choices use the installed Aura primitive scales documented by [PrimeNG](https://primeng.org/theming/styled) and [Tailwind](https://tailwindcss.com/docs/colors); they are not a ranking of universally best themes. Shared console variables feed PrimeNG semantic primary tokens, Material primary tokens, Tailwind utilities and canvas accents. Light mode uses shade 700 with white text; dark mode uses shade 300 with dark text. The appearance choice stays in memory, consistent with the existing color-mode behavior; no account data or credentials are stored.

The dropdown uses PrimeNG Select with grouped modes, translated palette names, per-option color swatches and an active-choice checkmark. Its labelled combobox supports keyboard navigation, Escape and focus restoration. The popup attaches to the document body to avoid clipping in the sticky header; its labelled scroll region is keyboard focusable through supported PrimeNG passthrough attributes. Signals retain the selected value when localized option labels change. Browser checks exercise all fourteen choices and primary-text contrast, alongside existing form, modal, localization and authentication journeys.

### Languages and Persian typography

The language dropdown uses native names (English, فارسی, العربية) from `core/localization/languages.ts`. Each entry declares its direction; a typed catalog loader supplies its translations. Runtime configuration accepts all registered languages. Selection updates document language/direction, translations, number/date formatting, PrimeNG labels and the Accept-Language header. Overlapping asynchronous switches retain the newest selection and its catalog. Canonical fields, option values and user drafts are unchanged.

Persian typography prefers Yekan Bakh/YekanBakh through `--workspace-font-family`; Material typography, PrimeNG and Tailwind inherit that same variable. No Yekan Bakh binary is present in this repository or the inspected local font folders. Installed copies can resolve locally; otherwise Tahoma is used. `public/fonts/README.md` documents the exact destination and supported filenames. Start/build hooks generate font faces only for available WOFF2 files, with `font-display: swap`, so missing files cause no font requests. Arabic uses an Arabic-capable system stack.

The current OpenAPI renderer/options and Designer Library bodies support en/fa only. Those calls use `Locale.contentLanguage()` (English for Arabic UI), while UI translations and the Accept-Language header remain Arabic. Supporting Arabic-authored runtime documents requires a backend contract change rather than widening generated DTOs in the frontend.
