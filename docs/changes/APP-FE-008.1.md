# APP-FE-008.1 — Persistent Arabic and demo integration

Backlog: APP-FE-008.1
Date: 2026-10-11
Area: localization, preferences, runtime forms, help and Studio

## Summary

Arabic now persists through ordinary profile preferences and reloads in RTL. Runtime forms, dynamic option requests, help state and the form translation editor accept Arabic alongside English and Persian. The frontend consumes the same en/fa/ar producer as the expanded developer seed.

## Why

Arabic previously appeared in the picker but was session-only. Runtime and help decoders still accepted only en/fa, and the authoring editor could replace an Arabic catalog's locale settings. The developer demo requires real persisted locale behavior.

## What Changed

- Reused existing Arabic messages, language picker, theme and shared controls. Added Arabic digits to workspace numbering choices.
- Extended persisted preference decoding and writes; actor cleanup, optimistic revisions and canonical values are retained.
- Accepted Arabic runtime language with RTL validation and passed ar through option requests.
- Added eleven Arabic help topics and metadata-only release app-fe-help-2. Backend deployment must configure HELP_RELEASE_METADATA_FILE to this release's metadata for help acknowledgment persistence; content remains frontend-owned.
- Extended the form catalog editor with Arabic text, source-revision calculation, preservation of existing locale settings and async edit fencing. Existing parameterized message protections remain.
- Consumed complete en/fa/ar OpenAPI snapshots, generated clients and notification version 3 inspector metadata from one reviewed producer. Versions 1 and 2 remain present and unchanged.

## Architecture

No architecture change. Existing preference, renderer, help and authoring owners remain responsible for their contracts.

## Compatibility

Arabic enum members and optional localized fields are additive. GET help-state accepts ar. Canonical values, operation IDs, permissions, private transport and immutable published versions are preserved. Existing two-language authored documents remain editable.

## Validation

- Focused Angular locale/preferences/runtime/editor selection: 37 passed.
- `BROWSER_ENGINE=chromium BROWSER_BINARY=/opt/brave.com/brave/brave mise run check`: all 12 stages passed with zero captured diagnostics, 597 unit tests, production build and 12 browser quality scopes. Start/end source hash was identical: `2f22e768eb1a58e39962a59080b6aa6c0ad2ec03c13e789b5284dd7b6bade7ff`.
- Backend-owned actual paired browser selection: six passed, covering en/fa/ar and both normal/lost approval responses, ordinary authentication, worker receipt, acknowledgment and authorization denials. This is separate from fixture browser quality coverage.
- Exact producer comparison includes all three languages and the actual pnpm lockfile.
- Earlier full attempts retained: stale generated UI inventory, editor complexity/braces, and a stale handler count assertion. These were corrected; the final full run passed. One immediately restarted run corrected version assertion literals to their canonical string type.

Result: PASS for this local feature scope. Existing accessibility incomplete observations remain in browser artifacts; no claim of exhaustive accessibility, native-client, hosted, deployed or user acceptance is made. Backend D07 SDK exceptions remain backend-owned and are not expanded here.

## Backlog Impact

Enabled: APP-BE-005.1 multilingual developer seed; APP-FE-008 persistent preferences; APP-FE-010 help; APP-FE-019 form authoring.

Blocked: None newly introduced.

Superseded: Session-only Arabic behavior for the new compatible backend.

Conflicts: None. Existing parent completion history and unrelated delivery scopes remain unchanged; unfinished relationships were reviewed.

## References

Commit: None.

Pull Request: None.

- [Reviewed intake](../reference/app-fe-008.1/contract-intake.json)
- [Help release metadata](../delivery/help-release-metadata.json)
- Full local gate logs and source manifest: ignored artifacts/check/.
