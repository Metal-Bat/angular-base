# Source register

Review date: 2026-10-09. All repository references below are pinned, not moving main links. A source finding is not a test result. Sources E01–E40 combine this review’s reads with prior pinned reads at the identical revisions.

## E01 — BE `AGENTS.md`

Existing graphify, entity-format and BaseDTO rules; delivery addendum is not in the inspected root file.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/AGENTS.md

## E02 — BE `src/core/base_dto.py`

Normal field/serialization-alias guard; computed names and nested model inheritance are not inspected.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/core/base_dto.py

## E03 — BE `src/core/base_entity.py`

Base identity/revision/timestamps, mapper versioning, descriptions and database comments.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/core/base_entity.py

## E04 — BE `src/apps/users/domain/preferences_entity.py`

New preference entity uses multiline fields and constraints, but field/comment metadata is less complete than the base.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/users/domain/preferences_entity.py

## E05 — BE `src/apps/users/domain/preferences.py`

Typed defaults and patch semantics; appearance default is system.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/users/domain/preferences.py

## E06 — BE `src/apps/users/presentation/personal.py`

Implemented GET/PATCH self profile/preferences and descriptive contracts.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/users/presentation/personal.py

## E07 — BE `.agents/skills/crud-api-contract/SKILL.md`

Generic resource skill prohibits PATCH; this conflicts with existing self-service PATCH routes.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/.agents/skills/crud-api-contract/SKILL.md

## E08 — BE `.agents/skills/swagger-contracts/SKILL.md`

Existing detailed nested schemas, examples, lifecycle, localization and HTTP documentation requirements.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/.agents/skills/swagger-contracts/SKILL.md

## E09 — BE `src/utils/presenter.py`

SuccessResponse data, PageResponse result, ErrorResponse numeric code and optional data; selectors have bounded page/items modes.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/utils/presenter.py

## E10 — BE `src/utils/localized_docs.py`

Existing subject tags, ordered operations and shared localized headers.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/utils/localized_docs.py

## E11 — BE `src/apps/support/domain/dto.py`

Some public fields have detailed descriptions while incident fields are largely bare annotations.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/support/domain/dto.py

## E12 — BE `src/apps/tasks/domain/dtos/schedules.py`

Create/output inheritance, clocked requirements, limited conditional/time validation and update fields.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/tasks/domain/dtos/schedules.py

## E13 — BE `src/apps/tasks/presentation/routes.py`

Existing admin-only task/schedule APIs; some schedule orchestration is in route bodies.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/tasks/presentation/routes.py

## E14 — BE `scripts/run_check.py`

Beginning source fingerprint and exact D07 policy; no equivalent final source-state comparison in the inspected implementation.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/scripts/run_check.py

## E15 — BE `docs/delivery/approved-decisions.json`

Recorded DB-002 two-file migration decision and D07 exact warning exceptions.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/docs/delivery/approved-decisions.json

## E16 — BE `docs/changes/DB-002.md`

New migration baseline, legacy transition caveats and recorded verification scope.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/docs/changes/DB-002.md

## E17 — BE `src/utils/pagination.py`

Live-only shared pagination and lifecycle-neutral apply_query.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/utils/pagination.py

## E18 — BE `src/apps/health/setup.py`

Required worker/scheduler execution checks are always unknown in inspect().

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/health/setup.py

## E19 — BE `src/apps/requests/application/demo.py`

Reuses application publication owners; baseline provenance uses form hash and existing workflow branch does not compare complete graph content.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/src/apps/requests/application/demo.py

## E20 — BE `scripts/bootstrap_application.py`

Existing basic seed CLI and ownership guards; not the proposed rich workflow suite.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/scripts/bootstrap_application.py

## E21 — BE `docs/delivery/workflow-defaults.md`

Preview/apply/layout reset contract; migration notes are historical after DB-002.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/docs/delivery/workflow-defaults.md

## E22 — BE `docs/delivery/through-020-handoff.md`

Implemented support/calendar/analytics/runtime handoff; additive migration instructions are now historical.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/docs/delivery/through-020-handoff.md

## E23 — BE `docs/delivery/protected-effect-policy.md`

Proposed protected operation mapping; not implemented production approval evidence.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/docs/delivery/protected-effect-policy.md

## E24 — BE `docs/delivery/BACKEND-BACKLOG.md`

Current APP task authority, 21 recorded complete and 11 original tasks open.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/docs/delivery/BACKEND-BACKLOG.md

## E25 — FE `docs/delivery/FRONTEND-BACKLOG.md`

Frontend original APP task authority and incomplete integrated acceptance.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/docs/delivery/FRONTEND-BACKLOG.md

## E26 — FE `docs/delivery/END-OF-BACKLOG.md`

Recorded 53-path/121-schema paired mismatch, incomplete features and boundary limitations.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/docs/delivery/END-OF-BACKLOG.md

## E27 — FE `src/app/core/auth/preferences.ts`

Real GET/PATCH, limited preference projection, density not applied in inspected load path and light-mode reset patch.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/src/app/core/auth/preferences.ts

## E28 — FE `src/app/core/theme/color-scheme.ts`

Local theme reset goes to blue/light; actor cleanup reset is a separate concern from persisted defaults.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/src/app/core/theme/color-scheme.ts

## E29 — FE `src/app/core/auth/profile/profile-appearance.ts`

Actual Reset appearance control and honest session-only Arabic notice.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/src/app/core/auth/profile/profile-appearance.ts

## E30 — FE `src/app/features/help/presentation/help-page/help-page.ts`

Viewed/dismissed state is session-memory based.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/src/app/features/help/presentation/help-page/help-page.ts

## E31 — FE `src/app/features/calendar/presentation/foundation-preview/foundation-preview.ts`

Development-only hardcoded calendar/readiness/metric showcase.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/src/app/features/calendar/presentation/foundation-preview/foundation-preview.ts

## E32 — FE `src/app/features/studio/presentation/form-inspector/form-inspector.ts`

Studio imports SchemaInput from Administration; complex settings remain partially unsupported.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/src/app/features/studio/presentation/form-inspector/form-inspector.ts

## E33 — FE `docs/delivery/NODE-INSPECTOR-COVERAGE.md`

Typed inspector improvements and remaining normal authoring/real-service coverage.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/docs/delivery/NODE-INSPECTOR-COVERAGE.md

## E34 — FE `docs/delivery/json-ui-register.md`

56 source matches are a contextual inventory, not 56 confirmed defects.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/docs/delivery/json-ui-register.md

## E35 — FE `scripts/check-project.mjs`

Final source digest guard exists; paired smoke is conditional on peer configuration.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/scripts/check-project.mjs

## E36 — FE `scripts/check-peer-contract.mjs`

Copied legacy producer snapshot verification, not full current live producer compatibility.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/scripts/check-peer-contract.mjs

## E37 — FE `scripts/browser-quality-check.mjs`

Serial scopes lack parent per-scope deadline/cleanup controls in inspected code.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/scripts/browser-quality-check.mjs

## E38 — FE `AGENTS.md`

Delivery rules present, including an obsolete migration-policy reference that needs reconciliation.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/AGENTS.md

## E39 — FE `docs/UI-LIBRARIES.md`

PrimeNG-first for touched business UI, retained Material/CDK/native exceptions.

Source: https://github.com/Metal-Bat/angular-base/blob/95f88dce6f1a48da87294929041378c174e6b39c/docs/UI-LIBRARIES.md

## E40 — BE `pyproject.toml`

Python >=3.14.7, Pydantic range, exact AI package constraint and warning configuration; minimums are not installed versions.

Source: https://github.com/Metal-Bat/async-fast-api-base/blob/9999641f8e37077829ebbe7159a6cd794fb94b91/pyproject.toml

## Official framework references

The external documentation supports general design mechanisms, not the implementation status of either repository. Verify APIs against actual lockfiles before using examples; no framework upgrade is authorized by this handoff.

- O01 — FastAPI response models and output filtering: https://fastapi.tiangolo.com/tutorial/response-model/
- O02 — FastAPI distinct input/output schemas: https://fastapi.tiangolo.com/how-to/separate-openapi-schemas/
- O03 — Pydantic fields and aliases: https://docs.pydantic.dev/latest/concepts/fields/
- O04 — Angular feature/component conventions: https://angular.dev/style-guide
- O05 — PrimeNG v21 theme documentation entry: https://v21.primeng.org/ (follow the theming documentation matching the pinned v21 release).

## Local isolated evidence

The package-root `verification/base_dto_probe.py` transcribes only the inspected BaseDTO guard and declares synthetic probe classes. `base_dto_probe_result.json` records Python 3.13.5 / Pydantic 2.13.5. It demonstrates that the existing guard accepts a computed camelCase name and a nested non-BaseDTO model. It does not demonstrate a live route leaking such a key. No SQLModel, FastAPI application, pinned Python 3.14.7, database, browser, worker or provider was exercised.
