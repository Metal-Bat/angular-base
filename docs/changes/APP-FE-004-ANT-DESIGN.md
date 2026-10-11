# Ant Design alongside Material, PrimeNG and Tailwind — 2026-10-11

User explicitly requested adding Ant Design to the Angular UI stack. NG-ZORRO 21.3.3 is pinned to match the existing Angular 21 peers; React Ant Design is not introduced. Existing working business screens are reused. The mixed-library development preview now includes an Ant input, disabled/enabled action, live output and popup select with Tailwind layout.

The public shared AntDesign directive supplies a local NG-ZORRO i18n service synchronized with the existing en/fa/ar preference. Its containing section uses CDK direction for reactive RTL. Light/dark vendor styles are generated from pinned CSS into an ignored optional local asset, scoped to Ant boundaries and Ant overlay panes. Vendor resets stay out of Material/PrimeNG sections; Ant styles load once only when used. Input/button/select surface, border, font and action tokens follow the workspace. The CSS layer allows Tailwind utility overrides. Modern CSS @scope/:has support is required. Ant overlay panes are included in the scope; an actual select popup is exercised.

Install/start/build/watch hooks prepare the optional asset. The production build keeps its existing warning/error budgets; the preview remains a development route. No API path, payload, calendar semantics, persisted preferences or existing component framework is replaced. This is the user-authorized compatibility addition to APP-FE-004.

## Acceptance evidence

- `/tmp/ant-package-metadata.json`: release and Angular 21 peer compatibility.
- `/tmp/ant-lock-comparison-2.log`: existing package version set preserved; seven required packages added.
- `/tmp/ant-frozen-install.log`: frozen offline pnpm install passed, including deterministic style preparation.
- `/tmp/ant-build.log`: production compilation passed at 498.11 kB initial total with unchanged budgets.
- `/tmp/ant-delivery-check.log`: delivery translation, generated inventory and contract checks passed.
- `/tmp/ant-browser-sandbox.log`: first real Firefox input/action/light-dark/RTL/font compatibility run passed.
- `/tmp/ant-overlay-browser.log`: input/action and select popup compatibility run passed. Local HTML, JSON and native screenshot are retained in `artifacts/browser-sandbox/2026-10-11T19-33-31.922Z/`. Existing accessibility violations gate remains enforced; incomplete/manual findings are separate.
- `/tmp/ant-install.log`: registry-speed and existing deprecated-subdependency messages are retained from installation. These are not suppressed in the final frontend check.

The final complete verification authority is `artifacts/check/manifest.json`, its stage logs and `/tmp/frontend-precommit-check.log`; source identity and zero emitted frontend warnings are required. The graph is refreshed separately. Browser journeys use isolated HTTP fixtures; this addition does not establish live backend integration, whole-product readiness, deployment or user acceptance.

The first full run stopped at the repository selector/attribute-order lint rules; `/tmp/ant-failed-check-1.log` and its manifest retain that failure. The directive now uses the required app prefix and the template follows the enforced attribute order. The generic native-control fallback excludes all Ant internal control classes, including the select search input, rather than only ant-input/ant-btn.

The user requested the combined Ant Design/Arabic changes be committed after the Arabic work completed. Its earlier successful gate is retained in docs/delivery/arabic-verification.json; the final pre-commit gate verifies the exact current combined source. The Ant-era formatting/type failures during concurrent Arabic implementation remain in /tmp/ant-failed-check-2.log and /tmp/ant-final-ui-browser.log; no generated contract was weakened to bypass them.
