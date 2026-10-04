# Versioned runtime documents — Step 18

`features/forms/domain/runtime-document.ts` is independent of Angular and UI libraries. It separates visible canonical data, prior correction data, row identity, render nodes, schema metadata, behavior state, actions, effective policy, locale and pinned form/design identity.

The infrastructure adapter validates `bpms.runtime/1`, the render dialect and JSON Schema dialect before mapping data. It bounds JSON size/depth and render node counts, rejects cyclic or non-JSON input, validates scope/policy relationships and requires visible field metadata. It never fetches authoring definitions or synthesizes defaults for missing/hidden values. Read-only summary/print/observer contexts cannot expose writes or commands.

Compatibility is explicit: ready, unsupported (dialect, primitive or capability), or invalid (shape, policy or pin). Known primitive names are declared separately from advertised renderer capabilities. Steps 19–21 advertise only capabilities backed by tested renderers. A missing capability needs a valid declared fallback; unsupported content is not silently discarded.

`RuntimeReader` reads the authorized work-item runtime endpoint or pinned business-request view using the typed API client. `readPinnedRequest` checks form/design pins again at the application boundary. A latest-definition change cannot silently select another renderer for an existing request.

Conformance tests cover edit, summary, print, observer, Persian correction, missing metadata, unsupported dialects/primitives/capabilities, hidden bindings, defaults, bounded/cyclic input and pin changes. Step 18 delivers the document model and reader; controls, canonical-value editing and user-facing compatibility screens are now implemented in [Steps 19–21](RUNTIME-RENDERER.md).

Steps 19–26 now advertise all 20 implemented primitive capabilities, including repeated rows and attachments. Configuration rejects unsupported advertisements. See [support and behavior limits](RUNTIME-RENDERER.md).
