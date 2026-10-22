# Workspace design

The workspace serves people managing requests, tasks, records and workflow definitions.
Its interface follows Impeccable's Operate guidance: familiar controls, clear hierarchy,
restrained accent use and consistent task flows.

## Existing visual system

Use PrimeNG for standard business controls, the existing Material/CDK/native exceptions,
and the existing canvas implementation. Reuse shared controls and semantic tokens.
Inter serves English; Vazirmatn serves Persian and Arabic. Keep the language-aware
font tokens, supported palettes, light/dark themes, density settings and RTL behavior.

## Shared presentation

Use `--console-canvas` for the page, `--console-surface` for content and
`--console-navigation` for the secondary navigation layer. Reserve
`--console-accent` and `--console-accent-soft` for actions, selection and focus.
Use `--console-text`, `--console-muted` and `--console-border` across both themes.

Page titles use a stable 1.75rem size; section headings use 1.25rem and subsection
headings 1.125rem. Preserve readable body and data sizes. Group related controls,
separate sections with whitespace, and avoid extra containers inside panels.
Tabular data uses tabular numerals. Selection and caret colors follow the palette.

The sidebar starts immediately under the measured sticky header. Navigation uses
at least 44px targets, visible keyboard focus and a restrained selected state.
On narrow screens it expands into document flow with bounded scrolling so that
long navigation remains reachable. Directional arrows mirror in RTL.

## Verification

Check rendered desktop and phone layouts, long translated labels, dark mode,
keyboard focus, navigation, and horizontal overflow. Preserve loading, empty,
error and permission states. Browser fixture results establish local UI evidence;
they do not establish real-service, deployment or user acceptance.
