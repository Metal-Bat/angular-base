# Application architecture

This fork boots a standalone, zoneless Angular workspace shell. The root redirects to `/operations`; `/operations`, `/studio`, and `/administration` load their area components lazily. Unknown URLs render a recovery page inside the shell. Each area owns a lazy child route table guarded by an explicit access policy. `/forbidden` and `/access-unavailable` provide separate denial and unresolved-session screens. Each area uses a shared overview component to describe planned capabilities. Area homes link the implemented capabilities, protected by authoritative session and capability checks. Steps 9–13 implement generated transport, login, account bootstrap, server renewal and permissions. Steps 19–23 now add a shared runtime renderer and requester/reviewer screens; [API-CLIENT.md](API-CLIENT.md) records the implemented transport and access contracts.

## Domain boundaries

When adding a domain, organize it under `src/app/features/<domain>/`:

- `domain`: business models, invariants, and rules independent of Angular and UI libraries.
- `application`: use cases and interfaces for infrastructure dependencies.
- `infrastructure`: HTTP, persistence, and other adapters implementing those interfaces.
- `presentation`: Angular routes, components, forms, and presentation state.

Create these folders as they become useful. Keep application-wide infrastructure in `core` and reusable presentation utilities in `shared`. Presentation and infrastructure may depend on domain contracts; domain rules should not import PrimeNG, Material, HTTP clients, or framework services.

Use lazy route loading when introducing feature entry points. Choose backend URLs, authentication providers, state management, and deployment settings in the consuming application.

## Implemented foundation

| Layer                        | Concrete example                                                                                | Responsibility                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core auth                    | `core/auth/session-context.ts`                                                                  | In-memory unresolved/signed-out/authenticated navigation context; verified account/permission bootstrap, login/logout and no browser token persistence. |
| Core permissions             | `core/permissions/route-access-guard.ts`                                                        | Deny unconfigured child routes; check resolved session and all explicitly required permissions.                                                         |
| Core transport               | `core/transport/resource-reference.ts`                                                          | Encode an opaque reference as one whole URL segment without interpreting it.                                                                            |
| Form domain                  | `features/forms/domain/form-version.ts`                                                         | Framework-independent definition/version identity.                                                                                                      |
| Form application             | `features/forms/application/form-version-reader.ts`                                             | Reader port and use case that rejects replacement of a pinned version.                                                                                  |
| Form infrastructure          | `features/forms/infrastructure/form-version-adapter.ts`                                         | Shape-check a read-only identity projection of supplied `FormVersionDTO` fields.                                                                        |
| Form presentation            | `features/forms/presentation/form-version-summary/`                                             | Accessible identity display primitive available to future preview and authorized runtime views.                                                         |
| Studio domain/infrastructure | `features/studio/domain/workflow-topology.ts` and `infrastructure/workflow-topology-adapter.ts` | Framework-independent read-only control topology and its supplied `GraphSnapshot` projection.                                                           |
| Area composition             | `features/<area>/presentation/<area>.routes.ts`                                                 | Own lazy child routes and compose future route-scoped adapter providers.                                                                                |

The adapters validate the fields they project, not the complete backend document or runtime dialect. They retain opaque references, graph outcomes and condition text without executing expressions. These are read-only projections: do not write them back as complete snapshots, discard configuration/bindings/targets on save, add layout coordinates to executable DTOs, or fetch privileged authoring data to render an ordinary-user task. Generated transport DTOs are implemented in Step 9; the authorized runtime document model and renderer belong to Steps 18–19 after the backend contract. There is no form runtime or canvas board yet; deployed API integration remains a release gate.

## Route access policy

All current area homes declare authenticated capability policies. The guard retains an explicit `planning-preview` policy for a deliberately public empty-path static screen; no current area route uses it. For a protected child, declare `data: { access: 'authenticated', requiredPermissions: [...] }`. An explicitly empty permission list means any resolved authenticated actor; a missing or malformed list denies access. Permission strings must come from the verified backend contract, not a generic administrator flag. Policies are read from the child's own route configuration, so parent metadata cannot accidentally make a child public.

The guard sends unresolved sessions to `/access-unavailable`, signed-out actors to `/login` with a safe return path, and missing capabilities or invalid policies to `/forbidden`. Authoritative bootstrap resolves the account only after all permission pages load. Account changes abort actor-owned work; server renewal is coordinated, cross-tab logout clears memory, and focus/denial-driven permission revalidation removes access to an open denied route. Server authorization remains authoritative. See [API-CLIENT.md](API-CLIENT.md) and [SESSION-BOUNDARY.md](SESSION-BOUNDARY.md).

## Enforced imports

ESLint checks domain/application independence from Angular, UI libraries, infrastructure, generated DTOs and core adapters. Domain models additionally cannot import application use cases. Presentation components consume application/domain contracts; feature route files may compose infrastructure providers. Infrastructure cannot depend on presentation. Core and shared UI cannot import features. Canvas package imports are restricted to feature infrastructure adapters, including when a route file composes an adapter. A new reusable business primitive lives in its owning feature, such as the form-version display, rather than making generic shared UI depend on business features.

## UI choices

PrimeNG, Angular Material/CDK, and Tailwind CSS remain available together. Import the components needed by each standalone component. Tailwind supplies layout and utilities; PrimeNG uses Aura tokens and Material uses its own public theme API. See [UI library choices](UI-LIBRARIES.md) for integration examples.

The shared `.app-dark` selector supports dark styling. A theme toggle and persisted user preference are application features to add when needed.

## Verification

Run `mise run check` after changing the starter. It checks formatting, API inventory drift, application TypeScript, ESLint, Vitest tests, and a production build. Tests verify root outlet rendering, lazy area navigation, direct URLs, document titles, active navigation, unknown-route recovery, fail-closed access decisions, session reset, opaque reference encoding, DTO projection and pin preservation. The shared form identity display is tested for safe text rendering and input changes. Five deliberately forbidden import probes were rejected by ESLint without writing probe files. Add tests for the behavior of each new feature. `.github/workflows/check.yml` runs the same check task after an exact dependency install and uploads the production build; it does not deploy or release. Dependabot proposes grouped Angular and PrimeNG updates plus workflow updates. End-to-end tests and deployment pipelines are not included. A successful hosted CI run, negative CI checks, and license/security reports remain ARC-04 validation work.

The form presentation layer consumes pure runtime documents and an injected options port. Operations routes compose the typed transport, component-owned page/editor facades and shared renderer. Authoritative pins, policy, actor resets and the mutation coordinator fence reads and commands. The development runtime preview uses that renderer with synthetic providers and is excluded by production file replacement. See [runtime rendering](RUNTIME-RENDERER.md) and [workspace commands](WORKSPACE-JOURNEYS.md).

## Authoring studio

Steps 29–33 add owned catalog/editor ports and framework-independent form/workflow/workspace rules. Studio infrastructure adapts generated API contracts and supplies a lazily loaded Foblex canvas. Presentation state depends on ports, with actor fencing, revision conflicts and guarded unsaved changes. Independent editor WIP is explicitly promoted to executable versions. Form preview uses the shared runtime renderer through the server-authorized simulation endpoint. See [studio](STUDIO.md) and [canvas decision](CANVAS-ADR.md).

## Administration and release serving

Steps 34–35 supply a generated, allowlisted administration port and 101 commands with exact permission/parameter contracts. Routes compose infrastructure; presentation state freezes reviewed commands, fences actor changes and redacts credentials. `server/main.mjs` can serve an immutable browser build via `FRONTEND_DIR`, preserving SPA/cache policy while session/API paths remain boundary-owned. Health and readiness services are not consumed or forwarded by the frontend. [Administration](ADMINISTRATION.md) and [release readiness](RELEASE-READINESS.md) distinguish implemented local behavior from pending external release gates.
