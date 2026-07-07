# Calendar programme documentation

Status: active documentation index  
Last reviewed: 2026-07-07

Use these files together:

- [`../project-roadmap.md`](../project-roadmap.md) — full product sequence and current Work ID.
- [`source-test-v2-contract.md`](source-test-v2-contract.md) — required source-research output.
- [`calendar-readiness-contract.md`](calendar-readiness-contract.md) — completion states for each racing system and source.
- [`machine-readable-contracts.md`](machine-readable-contracts.md) — schema, registry, stable-reference, validator, and incremental coverage implementation map.
- [`incremental-coverage-contract.md`](incremental-coverage-contract.md) — cross-system arbitrary-window, partial-success, coverage-observation, merge, and completion-audit rules.
- [`coverage-observation-schema.md`](coverage-observation-schema.md) — machine-readable requested/observed scope, partial coverage, source-error, and completion-audit claim contract.
- [`validation-responsibility-contract.md`](validation-responsibility-contract.md) — Batch / Promotion / Coverage / Completion responsibility and blocking boundaries.
- [`implementation-roadmap.md`](implementation-roadmap.md) — reconciliation, pipeline activation, shared incremental coverage implementation, pilots, release, expansion, and operations.
- [`current-baseline-audit.md`](current-baseline-audit.md) — reconciled repository capabilities and gaps.
- [`baseline-reconciliation-map.md`](baseline-reconciliation-map.md) — reviewed retain/repair/migrate/replace/archive decisions and execution order.
- [`pipeline-v1-build-boundary.md`](pipeline-v1-build-boundary.md) — static-build read boundary and explicit generation separation.
- [`pipeline-v1-candidate-contract.md`](pipeline-v1-candidate-contract.md) — bounded candidate envelope, rank limits, and human-review rules.
- [`pipeline-v1-promotion.md`](pipeline-v1-promotion.md) — approved-candidate registry gates, monotonic normal promotion, and explicit corrective downgrade boundary.
- [`pipeline-v1-public-projection.md`](pipeline-v1-public-projection.md) — deterministic Public Ceiling and field-policy projection.
- [`pipeline-v1-jra-reference-adapter.md`](pipeline-v1-jra-reference-adapter.md) — first source adapter migrated to the candidate v1 boundary.
- [`pipeline-v1-release-gate.md`](pipeline-v1-release-gate.md) — grouped Pipeline v1 completion and remaining-work boundary.
- [`dynamic-dates-contract.md`](dynamic-dates-contract.md) — explicit reference date, timezone, Today/Tomorrow, rolling window, and stale-state rules.
- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.
- [`operations-v1-contract.md`](operations-v1-contract.md) — review-only operator status, thresholds, and no-write boundary.
- [`operations-v1-release-gate.md`](operations-v1-release-gate.md) — Operations v1 completion and JRA pilot boundary.
- [`japan-full-month-scope-policy.md`](japan-full-month-scope-policy.md) — July completion-audit policy; full-month completeness is not an ordinary update gate.
- [`nar-a-plus-pilot-plan.md`](nar-a-plus-pilot-plan.md) — active NAR pilot state and incremental operator sequence.
- [`nar-monthly-collection-contract.md`](nar-monthly-collection-contract.md) — NAR ordinary incremental collection versus July completion-audit split.
- [`manual-nar-incremental-collection.md`](manual-nar-incremental-collection.md) — active local Schedule + Detail v2 operator, immutable batch paths, C/A+ candidate split, Coverage Observation, and manual retry runbook.
- [`manual-nar-monthly-collection.md`](manual-nar-monthly-collection.md) — legacy compatibility monthly operator runbook.
- [`banei-a-plus-full-month-plan.md`](banei-a-plus-full-month-plan.md) — queued Banei incremental plan and separate July completion audit.
- [`jra-pilot-foundation.md`](jra-pilot-foundation.md) — JRA fixture review, blocker, and no-write pilot boundary.
- [`jra-planned-program-intake.md`](jra-planned-program-intake.md) — advance-program intake and final-confirmation boundary.
- [`jra-final-confirmation-contract.md`](jra-final-confirmation-contract.md) — final-program timing, comparison, review, and candidate-generation gate.
- [`jra-final-program-intake-schema.md`](jra-final-program-intake-schema.md) — closed final-input keys, safety boundaries, and structural validation.
- [`jra-final-normalized-handoff.md`](jra-final-normalized-handoff.md) — approved-final to normalized meeting/detail review artifact.
- [`jra-final-review-package.md`](jra-final-review-package.md) — external final-fixture decision and optional normalized handoff package.
- [`local-racing-link-only-pilot.md`](local-racing-link-only-pilot.md) — historical C-level link-only boundary and authority-specific activation blockers.
- [`../runbooks/calendar-operations-status-review.md`](../runbooks/calendar-operations-status-review.md) — operator review order and escalation rules.
- [`../runbooks/calendar-operations-pause-rollback.md`](../runbooks/calendar-operations-pause-rollback.md) — canonical pause and rollback controls.
- [`../runbooks/calendar-seasonal-rollover.md`](../runbooks/calendar-seasonal-rollover.md) — seasonal fixture review and rollover.
- [`../runbooks/calendar-source-breakage-escalation.md`](../runbooks/calendar-source-breakage-escalation.md) — warning, degraded, and blocked source incidents.
- [`../specs/global-timetable-architecture.md`](../specs/global-timetable-architecture.md) — global meeting/detail/coverage architecture.
- [`../specs/authority-source-inventory-schema.md`](../specs/authority-source-inventory-schema.md) and its active addendum.
- [`../specs/timetable-data-flow-and-display-contract.md`](../specs/timetable-data-flow-and-display-contract.md).
- [`../operations/deployment-and-ci-policy.md`](../operations/deployment-and-ci-policy.md).

## Machine-readable entry points

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
data/static/timetable-candidate-v1.schema.json
data/static/timetable-source-aliases-v1.json
data/candidates/japan-jra-candidates.json
data/audits/calendar-baseline-migration-map.json
data/audits/calendar-pipeline-v1-release-gate.json
data/audits/calendar-dynamic-dates-release-gate.json
data/audits/calendar-operations-v1-release-gate.json
data/static/calendar-operations-control.json
data/static/calendar-operations-seasonal-policy.json
data/static/jra-pilot-control.json
data/static/jra-final-program-intake.schema.json
data/static/local-racing-pilot-control.json
data/static/nar-monthly-collection-policy-v1.json
data/generated/timetable/operations-status.json
data/generated/timetable/operations-review-package.json
data/generated/timetable/jra-pilot-review.json
data/generated/timetable/jra-planned-program-intake.json
data/generated/timetable/jra-planned-program-review.json
data/generated/timetable/local-racing-pilot-review.json
data/archive/timetable/candidates/japan-nar-candidates.v0.json
scripts/timetable/coverage-observation-validation.mjs
scripts/timetable/nar-incremental-core.mjs
scripts/timetable/collect-nar-incremental.mjs
scripts/timetable/run-nar-incremental-local.mjs
scripts/timetable/nar-incremental-v2-core.mjs
scripts/timetable/nar-incremental-v2-reconcile.mjs
scripts/timetable/normalize-nar-schedule-aware-month.mjs
scripts/timetable/collect-nar-incremental-v2.mjs
scripts/timetable/collect-nar-incremental-v2-reconciled.mjs
scripts/timetable/run-nar-incremental-v2-local.mjs
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
scripts/check-calendar-nar-incremental-core.mjs
scripts/check-calendar-nar-incremental.mjs
scripts/check-calendar-nar-incremental-v2-core.mjs
scripts/check-calendar-nar-incremental-v2.mjs
scripts/check-calendar-contracts.mjs
scripts/check-calendar-baseline-reconciliation.mjs
scripts/check-calendar-build-boundary.mjs
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/check-calendar-pipeline-v1-public-projection.mjs
scripts/check-japan-jra-candidate-generator.mjs
scripts/check-calendar-pipeline-v1-release-gate.mjs
scripts/check-calendar-dynamic-dates.mjs
scripts/check-calendar-dynamic-dates-rendered.mjs
scripts/check-calendar-dynamic-dates-release-gate.mjs
scripts/check-calendar-operations-status.mjs
scripts/check-calendar-operations-review-package.mjs
scripts/check-calendar-operations-v1-release-gate.mjs
scripts/check-jra-pilot-foundation.mjs
scripts/check-jra-planned-intake.mjs
scripts/check-jra-final-confirmation-contract.mjs
scripts/check-jra-final-program-intake-schema.mjs
scripts/check-jra-final-normalized-handoff.mjs
scripts/check-jra-review-package.mjs
scripts/check-local-racing-pilot-foundation.mjs
```

The readiness registry contains the 116 reviewed system/source decisions consolidated by the final 98-country audit. The baseline migration map governs how existing Calendar implementation is retained, repaired, migrated, replaced, or archived.

Coverage Observation and validation responsibility foundations are active. The NAR ordinary operator has published reviewed NAR detail through 2026-07-07 and is being advanced to the schedule-aware immutable v2 local workflow. The next operational collection target is 2026-07-08 through 2026-07-31 inclusive.

## Operating rule

Calendar work starts from reviewed source tests, authority/source records, country-page notes, and Calendar Readiness records. It must not begin from generic country assumptions.

Country-page completion, source capability, Public Ceiling, Calendar Readiness, implementation status, source health, and coverage claim remain separate states.

Ordinary updates may be partial and irregular. A completion claim is validated separately.

## Local research boundary

Detailed local captures remain outside the repository. The public repository may contain only reviewed, public-safe derived metadata and summaries. Follow `docs/governance/internal-source-handling.md`.

## Maintenance

Every Calendar PR must review `incremental-coverage-contract.md`, `validation-responsibility-contract.md`, and the applicable source-specific plan. Update the relevant roadmap, readiness registry, source record, runbook, schema, contract, or validator when its state or rule changes.
