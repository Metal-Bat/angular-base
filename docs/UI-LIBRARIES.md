# Choosing UI libraries

PrimeNG is the default for new or redesigned ordinary business controls. Tailwind handles layout. Keep PrimeNG, Angular Material and CDK installed; existing working controls are reused until their domain task changes them. The [screen register](delivery/screen-patterns.md) assigns each current template a migration owner.

Retained exceptions have specific purposes: native exact-decimal/date/file controls preserve canonical values and browser file handling; the native confirmation dialog provides established focus containment/restoration; Material remains in the development compatibility showcase; Foblex remains the specialist canvas adapter. A new exception needs a documented interaction reason and focused browser evidence. This policy does not approve JSON editors as normal business UI.

Reuse `ControlField`/`FieldWrapper` for linked label/help/error IDs, `SelectControl` for translated choices and form disabled/touched semantics, `RecordTable`/`ListQuery` for applied filters, `RecordSummary` for safe details, and `Feedback` for confirmation and uncertain-write reconciliation. Consumer controls must explicitly bind their error/hint IDs. No new universal form renderer is introduced.

## Available configuration

| Library          | Configuration                                                                                 | How to select it                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| PrimeNG          | Aura preset via `providePrimeNG` in `src/app/app.config.ts`; PrimeIcons CSS in `angular.json` | Import the needed PrimeNG components/modules into the consuming component |
| Angular Material | `mat.theme()` in `src/styles.scss`; CDK installed                                             | Import the needed Material modules into the consuming component           |
| Tailwind CSS     | `.postcssrc.json`, `src/tailwind.css`, and the global styles entry in `angular.json`          | Add utility classes to templates; no Angular component import needed      |

## Choosing components in code

A standalone component can use either library, or both when the screen calls for it:

```ts
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-ui-example",
  imports: [MatButtonModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-4 p-4">
      <button matButton type="button">Material action</button>
      <p-button label="PrimeNG action" />
      <button type="button" class="rounded border px-4 py-2">Tailwind action</button>
    </div>
  `,
})
export class UiExample {}
```

Import only what the consuming component uses. The example demonstrates selection in code; a runtime preference does not automatically replace one library's components with another's.

## PrimeNG and Tailwind integration

`tailwindcss-primeui` 0.6.1 is installed alongside Tailwind 4. Its CSS import in `src/tailwind.css` exposes utilities such as `bg-primary`, `text-primary-contrast`, `text-muted-color`, `bg-surface-100`, and `rounded-border`, backed by PrimeNG theme tokens. Plain Tailwind utilities remain available for Material controls and native elements. The current Material root font is 14px, so rem-based spacing follows that scale (`p-2` is 0.5rem, currently 7px).

```html
<section class="rounded-border bg-surface-100 p-4">
  <p class="text-muted-color">PrimeNG theme colors with Tailwind layout.</p>
  <div class="flex flex-wrap items-center gap-4">
    <button pButton type="button" class="p-2">PrimeNG with utility spacing</button>
    <button matButton type="button" class="mt-2">Material with utility layout</button>
    <button type="button" class="rounded-border bg-primary px-4 py-2 text-primary-contrast">Native control with PrimeNG semantic colors</button>
  </div>
</section>
```

Import `ButtonModule` and `MatButtonModule` in the consuming standalone component for that example. Semantic color utilities use PrimeNG tokens; Material controls retain their Material theme tokens. The shared workspace preset maps public PrimeNG color tokens to Material system tokens.

PrimeNG styles use the `primeng` CSS layer. The global order is `theme, base, primeng, components, utilities`, allowing utilities to override layered PrimeNG rules. Material's generated styles remain under its own theme control; use its public theme APIs for colors and typography instead of relying on utility specificity against internal selectors.

## Shared dark mode

The default is light mode. PrimeNG's `darkModeSelector`, Tailwind's `dark` variant, and Material's `color-scheme` all follow `.app-dark` on the document root. Toggle the class in presentation code to switch the three systems together:

```ts
document.documentElement.classList.toggle("app-dark", true); // dark
// Use false to return to light mode.
```

Use Angular's injected `DOCUMENT` when implementing a theme service. The shell uses `ColorScheme` for the theme toggle. Preferences are held in memory. See [UI foundation](UI-FOUNDATION.md) for component selection, localization and repeatable browser checks.

See the [official integration package](https://github.com/primefaces/tailwindcss-primeui) and [PrimeNG 21 Tailwind guide](https://v21.primeng.org/tailwind).

## Design and domain boundaries

### Workflow canvas and form builder

`@foblex/flow` **19.3.0** is the selected local workflow canvas adapter, with pinned Angular-compatible companion packages. Its MIT source and Angular compatibility are documented in the [canvas decision](CANVAS-ADR.md), alongside the Rete Angular renderer comparison and measured Firefox prototype.

Foblex imports live only in studio infrastructure. The lazy workflow route supplies a canvas port to presentation state; owned domain models retain stable keys, separate control/data edges, trusted metadata and diagnostics. Revisioned workspace persistence is implemented separately from executable graphs, with explicit promotion and publication.

The form builder uses a code-owned palette, nested outline and keyboard reorder controls. Schema/render/behavior inspectors feed backend validation and shared-runtime simulated preview. CDK remains available for future drag-and-drop enhancements. See [implemented studio and limits](STUDIO.md); broader accessibility/RTL/browser and performance acceptance remain QA-04/QA-05.

Keep library imports in feature presentation components and reusable UI wrappers. Domain models and application use cases remain independent of Material, PrimeNG, and Tailwind. Choose components based on interaction needs and keep typography, spacing, colors, density, and focus behavior consistent across the feature.

Retain both the Material Sass theme and PrimeNG's provider. Customize Material through its Sass/theme APIs and PrimeNG through design tokens. Prefer Tailwind for layout and spacing; avoid broad selectors or styling internal component DOM that could affect the other library. Tailwind's base reset is global, so verify the appearance of real controls from both libraries when changing global styles.

When adding mixed-library screens, check keyboard navigation, focus restoration, validation states, dark mode, overlay stacking, responsive layout, and production bundle budgets. Library availability does not establish compatibility for every component combination. PrimeNG is pinned to the MIT-licensed v21 line and needs no activation key; see the [license choice](PRIMEUI-LICENSE.md).

## References

- [PrimeNG setup and per-component imports](https://v21.primeng.org/installation)
- [Angular Material buttons](https://material.angular.dev/components/button/overview)
- [Angular Tailwind integration](https://angular.dev/guide/tailwind)

Step 19 uses native labeled inputs, selects and textareas for shared runtime scalar controls, with the existing field wrapper and global tokens. The PrimeNG preset is imported by an awaited startup initializer so theme registration completes before the UI opens, while the preset is a separate bundle. This does not remove its startup download. The development `/operations/runtime-preview` exercises the same renderer used by requester and reviewer screens.

## APP-FE-004 token and pattern contract

Public `workspacePreset` semantic tokens, `--console-*` colors and `--workspace-control-height` define surfaces, contrast, focus and density. `.app-dark`, document `dir`, and the existing typography/layout styles are shared across controls and body-appended overlays. Material's 14px root scale means 1rem is 14px; spacing tokens must be tested at that actual scale, rather than assuming 16px. Keep the existing production bundle thresholds and the CSS layer order.

The development `/ui-preview` showcases linked invalid fields, enabled/disabled/loading controls, populated/empty tables, a shared PrimeNG selector, mixed-library inputs, modal overlays and native confirmation. `test:browser-ui` checks 390px layout, keyboard focus restoration, theme contrast, en/fa/ar direction and canonical values; automated accessibility is enabled by the project quality gate. This evidence does not substitute for manual assistive-technology or final device acceptance.

## APP-FE-015–020 owned adapters

New metric tables/cards and authoring selectors/buttons use the existing PrimeNG stack. The metric graphic is owned decorative CSS with an exact accessible PrimeNG table; no chart vendor dependency or paid-library decision is introduced. SchemaInput continues its established PrimeNG/native typed input composition. Native labeled checkboxes/textareas remain the documented simple form/rule/synthetic-input exception; a small semantic translation table is an owned static presentation without sorting/pagination. Development fixtures and draft page controls are excluded or capability-gated from production. Foblex stays behind the existing lazy studio infrastructure port. Its measurement lifecycle, graph models and WIP/promotion boundaries remain owned and pinned.

## APP-FE-021–025 typed workflow inspectors

Workflow inspector/reference/mapping/transition controls use PrimeNG buttons, text inputs and the existing PrimeNG selector/SchemaInput composition. Existing labeled native checkboxes, textareas, semantic details/fieldsets and short lists remain the simple structural/form exceptions. Common readonly details, draft configuration, exact version selection and graph mapping are cohesive components, not a new arbitrary OpenAPI editor. Foblex stays in the existing lazy infrastructure adapter. Uncovered normal workflows remain explicit acceptance gaps; the collapsed expert panel cannot satisfy them. No library, framework, stylesheet layer or warning budget was replaced.
