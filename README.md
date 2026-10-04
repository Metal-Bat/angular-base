# async-fast-api-base-frontend

Our application fork of the Angular 21 standalone starter, organized around domain boundaries. The operations, studio, and administration plans and draft components are restored on this branch. The application now opens a workspace shell with lazy Operations, Studio, and Administration area pages and an explicit unknown-route screen. Each area owns a child route table with fail-closed access policies and explicit denial screens; the area homes require authoritative permissions. Framework-independent form/graph models and read-only adapters establish the feature boundaries. A same-origin server session boundary and allowlisted runtime configuration are implemented. Typed API transport, login/bootstrap, session renewal and permission-aware navigation are implemented locally. The shared runtime renderer and operations services are implemented locally through Step 35, including a real backend Firefox requester/reviewer journey. See [operations services and verification](docs/OPERATIONS-SERVICES.md); [Authoring studio](docs/STUDIO.md) implements Steps 29–33; [Administration](docs/ADMINISTRATION.md) implements Steps 34–35. [Release readiness](docs/RELEASE-READINESS.md) tracks Steps 36–38 and pending external decisions; the latest completed local batch is recorded as [substeps 36a–36d and 37a](docs/BACKLOG.md#release-follow-up-substeps).

## Getting started

Install [mise](https://mise.jdx.dev/), then run:

```sh
git clone https://github.com/Metal-Bat/async-fast-api-base-frontend.git
cd async-fast-api-base-frontend
mise trust
mise install
mise run install
mise run dev
```

The development server runs at http://localhost:4200. `mise.toml` pins Node 24.21.0, npm 12.2.0, RTK 0.47.0, graphifyy 0.9.53, and Husky 9.1.7. Husky is also a local development dependency so installation configures the repository hooks.

## Stack and checks

Angular uses 21.2.25, CLI/build 21.2.24, and Material/CDK 21.2.14. TypeScript stays on 5.9.3 to match Angular's compiler compatibility. Tailwind CSS 4 is connected through PostCSS, alongside the Material theme in `src/styles.scss`. PrimeNG 21.1.10 is also configured with Aura and PrimeIcons. The official `tailwindcss-primeui` plugin supplies PrimeNG semantic utilities. Keep PrimeNG, Material, and Tailwind available together; choose components through local imports. See [UI library choices](docs/UI-LIBRARIES.md) for examples and design boundaries.

| Command                         | Purpose                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| `mise run check`                | Check formatting, API inventory, application types, lint, unit tests, and production build |
| `mise run session`              | Start the loopback session boundary; see [session setup](docs/SESSION-BOUNDARY.md)         |
| `mise run build`                | Build for production                                                                       |
| `mise run lint`                 | Check lint without rewriting files                                                         |
| `mise run test`                 | Run Vitest unit tests once                                                                 |
| `mise exec -- npm test`         | Run unit tests in watch mode                                                               |
| `mise exec -- npm run lint:fix` | Apply lint fixes                                                                           |
| `mise exec -- npm run format`   | Format maintained project files                                                            |
| `mise exec -- npm run commit`   | Open the Conventional Commits prompt                                                       |

The Angular build worker pool uses a scoped Piscina 5.3.2 override for [the patched prototype-pollution advisory](https://github.com/advisories/GHSA-67c8-pqhq-4rmx).

Tests use Angular's unit-test builder with Vitest and jsdom. Route tests cover direct entry, navigation, page titles, and unknown routes. Local Firefox runners cover authentication, UI and workspace journeys, including the real backend runner. Build/test workers are capped at two and Vitest files run sequentially to limit resource use. The GitHub Actions project-checks workflow installs the committed Node/npm versions, runs `npm ci` and the full check task, and uploads the production build. Dependabot proposes npm and workflow updates; Angular and PrimeNG packages are grouped for compatibility review. VS Code tasks and launch configurations use mise to select the same tool versions.

## Domain-oriented organization

Keep business rules independent of UI and transport libraries. As features are added, group their domain models, application use cases, infrastructure adapters, and presentation components under `src/app/features/<domain>/`. Use `core` for application-wide infrastructure and `shared` for reusable UI and utilities. These are architectural conventions, not implemented business features in this starter. See [extending the starter](docs/ARCHITECTURE.md) and [maintenance notes](docs/UPGRADE.md).

## Git and release workflow

Husky runs lint-staged before commits, validates Conventional Commit messages, and runs the full check task before pushes. Commitizen, commitlint, and release-it support the existing release workflow.

```sh
mise exec -- npm run release
```

The release command updates the version and changelog and can create and push release commits, tags, and a GitHub release. Use it only when preparing a release.

## AI-assisted development

Repository skills under `.agents/skills` provide Angular, Material, PrimeNG, Tailwind, and optional library guidance. Skills for NgRx, Angular Aria, or AngularFire do not install or configure those libraries. PrimeNG and Material are both available for presentation components. The graphify skill and `AGENTS.md` describe codebase graph navigation and updates. `CLAUDE.md` and `.rtk/filters.toml` document RTK usage.

Generated `graphify-out/` content and local `.codex/hooks.json` are ignored. Skill files are excluded from the application formatting check so their supplied content is preserved.

## License

MIT © [Amin Azarpey](https://github.com/AminAzarpey)

## PrimeNG license choice

PrimeNG 21.1.10 is MIT-licensed and needs no key or account. The Angular 21 toolchain satisfies its peer requirements. See [license and compatibility notes](docs/PRIMEUI-LICENSE.md).

## Application plans and backend reference

- [Numbered implementation steps](docs/BACKLOG.md#numbered-implementation-steps): stable step numbers, current progress, and ticket mappings; request work with “do Step 9”.
- [Implementation backlog](docs/BACKLOG.md): priorities, dependencies, acceptance criteria, and delivery milestones.
- [API inventory](docs/API-INVENTORY.md): operations mapped from the supplied backend snapshot.
- [OpenAPI snapshot](docs/reference/openapi.json), [readiness review](docs/reference/frontend-readiness-review.md), and [source manifest](docs/reference/manifest.json): supplied reference files and checksum provenance.
- [Setup review](docs/SETUP-REVIEW.md) and [historical upgrade review](docs/HISTORICAL-UPGRADE.md): earlier validation and migration context, rather than a new verification of backend behavior.

Run `mise exec -- npm run api:inventory` to regenerate the inventory and `mise exec -- npm run api:check` to check it for drift. The API check is included in `mise run check`. Treat supplied specifications as reference material; implementation must confirm backend contracts and address the blockers recorded in the backlog.

The upstream boilerplate update remains on `chore/angular-boilerplate`. Personal application work continues on `feat/personal-admin-workspace`.

The session decision, server deployment variables and browser contract are in [SESSION-BOUNDARY.md](docs/SESSION-BOUNDARY.md). [DATA-HANDLING.md](docs/DATA-HANDLING.md) defines actor cleanup and storage policy; [CI-CHECKS.md](docs/CI-CHECKS.md) records CI gates and dependency evidence.

Steps 6–8 are implemented in the matching local backend; [PLATFORM-CONTRACT.md](docs/PLATFORM-CONTRACT.md) records the tested patch, new API snapshot, and remaining integration gates. Steps 9–13 are also implemented and locally verified; see [API-CLIENT.md](docs/API-CLIENT.md). Steps 14–18 are implemented locally: [UI/localization](docs/UI-FOUNDATION.md), [command coordination](docs/COMMAND-COORDINATION.md), and [runtime document model](docs/RUNTIME-DOCUMENT.md). Steps 19–23 add the [runtime renderer](docs/RUNTIME-RENDERER.md), conformance fixtures and [requester/reviewer journey](docs/WORKSPACE-JOURNEYS.md). The next task is **Step 24**: process timeline and the real backend journey.
