# Documentation cleanup — 2026-10-11

User requested removal of finished plans and obsolete documentation before committing the workspace changes.

Removed the detailed implementation plans of the 13 APP tasks recorded DONE from the canonical delivery backlog. Stable task IDs, recorded verification levels and change-record links remain for the status checker and acceptance history. The 25 tasks still recorded BLOCKED retain their requirements; implementation alone does not close their acceptance.

Removed nine obsolete or duplicate files: the completed delivery/consistency installation guides and merged agent addenda, the package-installation validation/tree descriptions, and three byte-identical root copies of execution rules, contracts/acceptance and timing. The authoritative copies remain under docs/delivery. Historical change records, peer contracts, active repairs and verification evidence remain available. No gate was removed or weakened to accommodate documentation deletion.

The final full check manifest records the source verified before commit. Python verification caches are now ignored alongside the existing local browser/check reports and graph output.
