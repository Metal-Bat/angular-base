# Angular and tooling upgrade

Updated October 2, 2026. This change updates the existing starter and establishes the toolchain for the [implementation backlog](BACKLOG.md). It does not implement the backend-dependent product journeys.

## Resolved toolchain

| Tool or package                                      | Previous declaration                | Selected version                |
| ---------------------------------------------------- | ----------------------------------- | ------------------------------- |
| Node                                                 | Unspecified; shell resolved Node 16 | 24.21.0 through mise            |
| npm                                                  | Project devDependency 11            | 12.2.0 through mise             |
| Angular framework / CLI and build / CDK and Material | 20.1                                | 21.2.25 / 21.2.24 / 21.2.14     |
| TypeScript                                           | 5.8                                 | 5.9.3                           |
| angular-eslint                                       | 20.1.1                              | 21.4.0                          |
| ESLint                                               | 9                                   | 10.11.0                         |
| typescript-eslint                                    | 8.34.1                              | 8.71.0                          |
| Tailwind and its PostCSS plugin                      | 4.1                                 | 4.3.3                           |
| PostCSS                                              | 8.5.6                               | 8.5.28                          |
| RxJS                                                 | 7.8.0                               | 7.8.2                           |
| tslib                                                | 2.3                                 | 2.8.1                           |
| PrimeNG                                              | Not installed                       | 21.1.10                         |
| PrimeUI themes and PrimeIcons                        | Not installed                       | 2.0.3 and 8.0.2                 |
| Test runner                                          | Karma and Jasmine                   | Vitest 4.1.11 with jsdom 30.1.1 |
| Commitlint                                           | 19.8                                | 21.2.3                          |
| release-it and changelog plugin                      | 19.0 / 10.0                         | 21.1.0 / 12.0.2                 |
| lint-staged                                          | 16.1                                | 17.6.0                          |
| Prettier                                             | 3.6                                 | 3.9.9                           |

The official `tailwindcss-primeui` integration is pinned to 0.6.1. PrimeNG uses an ordered CSS layer so Tailwind utilities can override its styles. A shared `.app-dark` selector controls PrimeNG, Tailwind dark variants, and Material color schemes; see [UI integration examples](UI-LIBRARIES.md).

Every retained direct dependency was checked against the npm registry. Exact versions are in `package.json`; `package-lock.json` pins the complete dependency tree. Packages already at their current stable versions remain unchanged. TypeScript 7 was deliberately excluded: the Angular 21 build package requires `>=5.9 <6.0`. TypeScript 5.9.3 also satisfies typescript-eslint. See [Angular compatibility](https://angular.dev/reference/versions).

mise manages Node and npm, while npm manages Angular and project libraries. Ordering the npm tool before Node and enabling `activate_aggressive` prevents an older nvm installation or Node's bundled npm from shadowing the selected tools. This was verified with the user's Node 16 shell environment. See [mise Node support](https://mise.jdx.dev/lang/node.html).

## Migration and configuration changes

Angular 21 core migration collections were downloaded at 21.2.25, CLI schematics at 21.2.24, and CDK/Material at 21.2.14. Their applicable migrations ran before Angular 22 migration-only commands. Angular 21 migrations needed no source changes for this small standalone application. The optional application-builder migration is unnecessary because the project already uses `@angular/build:application`.

An initial Angular 22 upgrade made `ChangeDetectionStrategy.Eager` explicit. The key-free PrimeNG 21 decision returned the framework to Angular 21, with the equivalent `ChangeDetectionStrategy.Default` on the starter component. CLI/CDK/Material migrations needed no further application changes. The migration's blanket suppression of two template diagnostics was removed because this starter does not need it; strict template checking remains enabled.

The test target now uses `@angular/build:unit-test`; the existing two tests run under Vitest with `vitest/globals`. Karma, its launchers/reporters, Jasmine and Jasmine types were replaced. Tests run in jsdom without requiring Chrome; browser integration remains QA backlog work. See [Angular's Vitest migration guidance](https://angular.dev/guide/testing/migrating-to-vitest).

PrimeNG's Aura provider is registered. No product screens or graph library were added. Angular Material remains a supported component choice alongside PrimeNG; Tailwind is available with either library. See [UI library choices](UI-LIBRARIES.md). The follow-up setup review connected Tailwind through PostCSS and added the PrimeIcons stylesheet. Product theme consolidation remains UI-01. See [PrimeNG installation](https://primeng.dev/installation).

**Key-free UI stack:** PrimeNG 21.1.10 is MIT-licensed. Angular and CDK were aligned to v21 to satisfy its peer requirements; themes use 2.0.3. The former v22 license launcher was removed. No account or key is needed. See [license and compatibility notes](PRIMEUI-LICENSE.md).

The starter's remote Google Fonts links were removed. Builds no longer fetch fonts from the network; the existing CSS font fallback stack is used. Product typography and any self-hosted fonts belong to UI-01.

Lint is now nonmutating (`lint:fix` is separate). Husky uses its current `husky` setup command; hooks and VS Code tasks run through mise. The old Karma browser debug configuration was replaced with an Angular unit-test debug terminal. Staged TypeScript/templates run ESLint and Prettier; other supported text files run only Prettier.

The unused `@commitlint/config-angular`, `eslint-config-xo`, `eslint-plugin-import`, `eslint-plugin-jsdoc`, `eslint-plugin-prefer-arrow`, `eslint-plugin-prettier` and `globals` dependencies were removed. None was used by the active lint/commit configuration. This also avoids retaining eslint-plugin-import's incompatible ESLint 9 peer constraint in the ESLint 10 setup. npm was moved out of devDependencies into mise. Existing Commitizen, conventional changelog adapter, Husky, prettier integration and pretty-quick remain at their verified current releases.

npm 12 blocks unlisted dependency lifecycle scripts by default. `allowScripts` explicitly lists the installed versions of the Angular toolchain's native packages: esbuild, Parcel watcher, lmdb and msgpackr-extract. Future version changes require updating this list after reviewing those install steps; there is no blanket lifecycle-script allowance.

## Dependency audit scope

The Angular 21 build package pins Piscina 5.2.0. A scoped override selects patched 5.3.2, within the same major, to address [GHSA-67c8-pqhq-4rmx](https://github.com/advisories/GHSA-67c8-pqhq-4rmx). Build and unit tests validate this override. Remove it when the Angular 21 build dependency includes the patch.

The first updated install reported six high-severity dependency entries in release tooling. A scoped override upgrades release-it's pinned Undici 7.29.0 to the compatible patched 7.30.0. The remaining `basic-ftp` advisory is inherited through release-it → proxy-agent → pac-proxy-agent → get-uri. The available patched basic-ftp 6.2.1 is outside get-uri's 5.x dependency contract, so this upgrade does not force that major version or apply npm's suggested release-it downgrade.

The final full audit reports **six high-severity entries**, all from that remaining basic-ftp chain (including the changelog plugin's dependency on release-it). The production-only audit reports **zero vulnerabilities**. These are development/release-tool dependencies, not production application dependencies. Recheck the audit before a release and remove the Undici override when upstream includes a patched version. A dependency audit is not a full application security assessment.

## Verification

The following table records historical upgrade checks; the current Angular 21 stack is validated separately after the license-driven downgrade. See [the follow-up setup review](SETUP-REVIEW.md) for the current bundle size and Firefox browser verification.

| Check                               | Result                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `mise exec -- npm ci`               | Passed with the final lockfile and explicit native script list                 |
| `mise run check`                    | Lint, both existing unit tests and production build passed                     |
| `npm run typecheck` through mise    | Passed                                                                         |
| `npm run format:check` through mise | Passed; reference snapshots, generated files and agent instructions excluded   |
| `npm ls --all` through mise         | Passed without invalid peer dependencies                                       |
| `npm run api:check` through mise    | Passed: 302 operations across 36 areas; mapped backlog IDs exist               |
| Reference and documentation checks  | All local links resolve; copied sources match originals byte for byte          |
| Production bundle                   | 399.19 kB initial, below the 500 kB warning budget                             |
| `npm audit --omit=dev` through mise | Zero vulnerabilities reported                                                  |
| Full npm audit                      | Six high-severity entries in the release-tool dependency chain described above |
| Repository graph                    | `graphify update .` completed using local code extraction                      |

Live API integration, confidential-client sessions, canvas behavior and real-browser journeys were not run. VS Code configurations were updated but not exercised in the GUI. Starter unit tests do not establish those integrations.

## Reference maintenance

The two supplied documents were copied unchanged into `docs/reference`. `npm run api:inventory` generates the source SHA-256 manifest and the 302-operation inventory with mappings to the backlog; `npm run api:check` detects drift and missing mapped ticket headings. It does not rewrite or regenerate the OpenAPI contract itself. Do not infer its backend commit from the review commit: that provenance was not provided.

The backlog contains 78 open stories with priorities, role ownership, relative sizes, dependencies, acceptance criteria and validation. Backend findings are preserved as reported findings with explicit integration gates. No external issues, Pages, releases or backend changes were created.
