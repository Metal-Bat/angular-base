# Extending the starter

The starter boots a standalone, zoneless Angular application with an empty route table and the Angular welcome page. It supplies development tooling and UI integration. It does not supply a backend client, authentication, an admin dashboard, domain models, or application-specific environment settings.

## Domain boundaries

When adding a domain, organize it under `src/app/features/<domain>/`:

- `domain`: business models, invariants, and rules independent of Angular and UI libraries.
- `application`: use cases and interfaces for infrastructure dependencies.
- `infrastructure`: HTTP, persistence, and other adapters implementing those interfaces.
- `presentation`: Angular routes, components, forms, and presentation state.

Create these folders as they become useful. Keep application-wide infrastructure in `core` and reusable presentation utilities in `shared`. Presentation and infrastructure may depend on domain contracts; domain rules should not import PrimeNG, Material, HTTP clients, or framework services.

Use lazy route loading when introducing feature entry points. Choose backend URLs, authentication providers, state management, and deployment settings in the consuming application.

## UI choices

PrimeNG, Angular Material/CDK, and Tailwind CSS remain available together. Import the components needed by each standalone component. Tailwind supplies layout and utilities; PrimeNG uses Aura tokens and Material uses its own public theme API. See [UI library choices](UI-LIBRARIES.md) for integration examples.

The shared `.app-dark` selector supports dark styling. A theme toggle and persisted user preference are application features to add when needed.

## Verification

Run `mise run check` after changing the starter. It checks formatting, application TypeScript, ESLint, Vitest tests, and a production build. The existing tests verify bootstrap and welcome-page rendering; add tests for the behavior of each new feature. End-to-end tests and deployment pipelines are not included.
