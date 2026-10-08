# Starter maintenance

These notes describe the reusable boilerplate update. The personal application branch adds the [admin backlog](BACKLOG.md), supplied backend reference snapshots, and API inventory tooling on top of that base. See [historical upgrade notes](HISTORICAL-UPGRADE.md) for the earlier detailed review.

This update keeps the welcome application and empty routes while refreshing dependencies and development tools. There are no backend-specific schemas, API inventory checks, admin routes, or deployment credentials in the starter.

The compatible stack is Angular 21.2.25, Angular CLI/build 21.2.24, Material/CDK 21.2.14, PrimeNG 21.1.10, TypeScript 5.9.3, and Tailwind CSS 4. PrimeNG 21 is MIT-licensed and requires no activation key; see [license notes](PRIMEUI-LICENSE.md).

## Changes

- Pin Node, npm, RTK, graphifyy, and Husky through mise; retain Husky as a project dependency.
- Keep Angular Material and Tailwind and add PrimeNG, Aura, PrimeIcons, and the official Tailwind integration plugin.
- Replace Karma/Jasmine with Angular's Vitest unit-test builder and jsdom.
- Set the application and test TypeScript source roots explicitly.
- Route VS Code tasks and Git hooks through mise so they use the same toolchain.
- Supply reusable AI skills and exclude generated graph output and local agent hooks from Git.
- Apply scoped dependency overrides for Angular's worker pool and release-it's HTTP client.

Run `mise trust`, `mise install`, and `mise run install` on a fresh checkout, then `mise run check`. Installation uses the committed lockfile. Review peer requirements together when upgrading Angular, Material/CDK, PrimeNG, or TypeScript; avoid force-installing incompatible versions.

The release tooling still uses the repository's existing release-it workflow. Production dependency auditing and development-tool auditing should be assessed separately when maintaining it.
