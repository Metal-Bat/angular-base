# Consistency documentation installation — 2026-10-09

Scope: install instructions and navigation only. No CONS/APP implementation started, task status changed, business approval inferred, or application code/configuration/data altered. The supplied package and skill were already present as new files; no extraction or replacement of differing package files was needed.

## Compared and merged

- Root `AGENTS.md`: retained graphify and delivery rules; replaced the obsolete active DB-001 migration-policy bullet with reconciliation against the current recorded DB-002 decision. Merged the root consistency addendum once and the scoped instruction clarifications from [SKILL-AMENDMENTS.md](SKILL-AMENDMENTS.md).
- `docs/BACKLOG.md` and `docs/delivery/FRONTEND-BACKLOG.md`: inserted the exact respective navigation blocks from the root installation guide. Original task bodies, IDs, statuses, decisions and historical evidence remain unchanged.
- `docs/FRONTEND-BACKLOG.md`: compared byte-for-byte with the authoritative delivery supplement before replacing this duplicate with a navigation pointer. There were no unique edits. The full original content remains in `docs/delivery/FRONTEND-BACKLOG.md`; no task history was deleted from its authority.
- `docs/UI-LIBRARIES.md`: clarified that technical mixed-library capability does not override PrimeNG-first business UI policy; added public-seam, producer-manifest and persisted-versus-cleanup default rules. No existing skill file was replaced.
- `.agents/skills/contract-consistency/SKILL.md`: confirmed present and explicitly required by the merged root instructions. Its supplied content was kept unchanged.

## Confirmed instruction reconciliation

Read the peer backend's existing `docs/delivery/approved-decisions.json` and `docs/changes/DB-002.md` without modifying them. They record DB-002's schema-first/required-data-second repository migration policy, superseding DB-001 and the earlier additive-only file policy. This installation gives no permission to reset or stamp shared databases or change migrations. D07 records only two exact backend SDK exceptions; VERIFIED_WITH_EXCEPTION remains distinct from strict readiness, and frontend checks still require zero warnings.

The peer's `users/presentation/personal.py` and preferences DTOs already define GET/PATCH self-profile/preferences contracts. The frontend's existing preferences adapter uses the preferences route. Scoped root rules now preserve these compatibility exceptions, omitted/null semantics and separate HTTP/application error values. Recursive nested/computed DTO and effective Swagger review is documented as a future verification requirement, not a test run by this installation.

## Unresolved installation conflicts

1. **Duplicate backlog versus delivery tooling.** The installation guide directs duplicate APP ledgers to become pointers or checked generated mirrors. The existing `scripts/delivery-status.mjs` requires byte-identical `docs/FRONTEND-BACKLOG.md` and `docs/delivery/FRONTEND-BACKLOG.md`. The new pointer resolves links correctly and preserves one task authority, but that script will reject it until a later explicitly authorized tooling change supports pointers. The script was left unchanged because this request permits documentation installation only. Do not report `delivery:status` or the full repository gate as passing for this installation.

## Peer and optional skill reconciliation

The backend CRUD and Swagger skills are outside this frontend installation. They initially contained the documented contradictory/incomplete wording, then changed independently during installation. A final read confirmed the peer CRUD skill now contains the scoped self-service PATCH exception and the Swagger skill contains the recursive nested/computed/serialization clarification. This frontend installation did not write either peer file and does not claim their installation or verification as its own work.

The frontend product-delivery/smart-backlog/CRUD/Swagger skill targets are absent. They are optional existing-skill targets, not required missing package files; no substitute skill was invented or an entire existing skill replaced. The merged root instructions cover applicable frontend interpretations and explicitly reference the supplied contract-consistency skill.

The recorded reset/default, producer-manifest and other feature discrepancies remain future repair-register work. Installing a rule does not repair current code or close its APP/CONS task. Existing decision ledgers and change records retain their historical facts.

## Installation verification

Compared existing backlogs before editing. Checked exact snippet insertion, preserved original backlog bodies and statuses, single consistency section, skill presence/reference, and 108 local documentation links and file paths. The two original authoritative backlog bodies match their HEAD versions exactly after removing the inserted link blocks; both former duplicate bodies were identical at HEAD. Root guide links inside its two snippet code blocks were resolved relative to their stated destination files. Backend paths in amendment instructions were checked against the read-only peer checkout; placeholder installation trees are examples, not missing frontend files. External source URLs were retained without claiming a network check.

Only Markdown documentation/instructions changed. No dependency, mise/environment configuration, migration, application code or data changes; no seed/reset, implementation check or implementation-completion marking. Formatting and local link checks are installation evidence only.

## Subsequent authorized tooling reconciliation — notification work

The original documentation-only installation and its failure limitation above remain historical facts. The subsequent requested APP-FE-012/036/037 implementation updates `scripts/delivery-status.mjs` to accept either the former identical mirror or a pointer to the canonical ledger with no duplicate APP task sections. It still checks all 38 unique sequential IDs, statuses and change-record files. This resolves the duplicate-backlog tooling conflict without rewriting task history, replacing skill files or inventing approvals. Its execution result is recorded with the notification acceptance evidence; installation itself did not run implementation verification.
