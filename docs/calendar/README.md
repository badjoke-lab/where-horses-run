# Calendar programme documentation

Status: active documentation index  
Last reviewed: 2026-07-08

Use these files together:

- [`../project-roadmap.md`](../project-roadmap.md) — full product sequence and current Work ID.
- [`source-test-v2-contract.md`](source-test-v2-contract.md) — required source-research output.
- [`calendar-readiness-contract.md`](calendar-readiness-contract.md) — completion states for each racing system and source.
- [`machine-readable-contracts.md`](machine-readable-contracts.md) — schema, registry, stable-reference, validator, and control-plane implementation map.
- [`incremental-coverage-contract.md`](incremental-coverage-contract.md) — cross-system arbitrary-window, partial-success, five-rank, runner-neutral, retry, merge, and completion-audit rules.
- [`coverage-observation-schema.md`](coverage-observation-schema.md) — machine-readable requested/observed scope, partial coverage, source-error, and completion-audit claim contract.
- [`validation-responsibility-contract.md`](validation-responsibility-contract.md) — Batch / Promotion / Coverage / Completion responsibility and blocking boundaries.
- [`acquisition-control-plane-contract.md`](acquisition-control-plane-contract.md) — shared Collection Plan, Job, runner routing, five-rank classification, Review Queue, and Rank-aware Retry Queue contract.
- [`acquisition-control-plane-implementation-plan.md`](acquisition-control-plane-implementation-plan.md) — staged implementation schedule from current NAR completion through shared runners, Banei handoff, multi-system execution, review PR preparation, and scheduling.
- [`collection-result-manifest.md`](collection-result-manifest.md) — one-result-per-Job identity, runner, scope, coverage, five-rank accounting, unresolved state, source-error, and artifact-reference contract.
- [`review-queue.md`](review-queue.md) — validated-batch operator inventory, five-rank visibility, Manifest projection, and review/promotion state contract.
- [`rank-aware-retry-queue.md`](rank-aware-retry-queue.md) — rank-gap, missing-field, retry reason/scope, Registry routing, backoff, and NAR 71-target projection contract.
- [`runner-compatibility.md`](runner-compatibility.md) — Job runner-policy resolution, Registry route, executor mapping, NAR Actions/local result neutrality, JRA local normalization, and Banei handoff semantics.
- [`actions-multi-job-runner.md`](actions-multi-job-runner.md) — hosted Job filtering, executor-mode support, isolated matrix execution, per-Job artifacts/status, and campaign summary contract.
- [`local-multi-job-runner.md`](local-multi-job-runner.md) — local Job filtering, worktree-isolated JRA review-only execution, independent batches and statuses, Review Queue snapshot, and campaign summary contract.
- [`review-cohort-planner.md`](review-cohort-planner.md) — source-compatible, risk-bounded review grouping, public-display risk, promotion dependency, source-failure isolation, and human-review proposal contract.
- [`review-pr-preparation.md`](review-pr-preparation.md) — deterministic candidate diff, Coverage, retry, checklist, PR metadata, and pending-human-review package boundary.
- [`due-job-planner.md`](due-job-planner.md) — freshness, proximity, horizon, season, coverage, retry, source-health policy, explicit Job generation, and artifact-only daily scheduling contract.
- [`implementation-roadmap.md`](implementation-roadmap.md) — reconciliation, pipeline activation, NAR completion, control-plane foundation, pilots, release, expansion, and operations.
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
- [`operations-v1-contract.md`](operations-v1-contract.md) — completed review-only status/report layer; later control-plane Operations v2 is additive.
- [`operations-v1-release-gate.md`](operations-v1-release-gate.md) — Operations v1 completion and JRA pilot boundary.
- [`japan-full-month-scope-policy.md`](japan-full-month-scope-policy.md) — July completion-audit policy; full-month completeness is not an ordinary update gate.
- [`nar-a-plus-pilot-plan.md`](nar-a-plus-pilot-plan.md) — active NAR pilot state and incremental operator sequence.
- [`nar-monthly-collection-contract.md`](nar-monthly-collection-contract.md) — NAR ordinary incremental collection versus July completion-audit split.
- [`manual-nar-incremental-collection.md`](manual-nar-incremental-collection.md) — NAR v2 operation, immutable batch paths, current local command support, target Actions-primary/local-fallback transition, coverage, and retry runbook.
- [`manual-nar-monthly-collection.md`](manual-nar-monthly-collection.md) — legacy compatibility monthly operator runbook.
- [`banei-a-plus-full-month-plan.md`](banei-a-plus-full-month-plan.md) — queued Banei incremental plan and separate July completion audit.
- [`banei-retry-reconciliation.md`](banei-retry-reconciliation.md) — proposal-only post-run Retry Queue reconciliation boundary.
- [`banei-retry-queue-state-apply.md`](banei-retry-queue-state-apply.md) — reviewed approval, SHA-256 stale-write guards, atomic Queue replacement, and explicit rollback contract.
- [`banei-freshness-rollback-operating-evidence.md`](banei-freshness-rollback-operating-evidence.md) — reviewed successful Job freshness states and rollback rehearsal evidence.
- [`banei-bilingual-public-display-qa.md`](banei-bilingual-public-display-qa.md) — separate detail-source Readiness, list/detail boundary, A/A+ switch, and rendered English/Japanese QA.
- [`banei-handoff-decision.md`](banei-handoff-decision.md) — accepted manual reviewed steady-state handoff decision, no-full-month-claim boundary, and next Work ID.
- [`hkjc-pilot-reconciliation.md`](hkjc-pilot-reconciliation.md) — HKJC shared-control-plane versus legacy rolling-refresh reconciliation and direct-write quarantine.
- [`hkjc-live-fixture-artifact-bridge.md`](hkjc-live-fixture-artifact-bridge.md) — HKJC-PILOT-02 official fixture-window Rank C artifact bridge, partial/error semantics, manual live Actions route, and no-write boundary.
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

## Implemented machine-readable entry points

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
data/static/calendar-five-rank-classifier-contract-v1.json
data/fixtures/calendar-five-rank-classifier-fixtures-v1.json
data/static/calendar-collection-result-manifest.schema.json
data/fixtures/calendar-collection-result-manifests-v1.json
data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json
data/static/calendar-review-queue.schema.json
data/fixtures/calendar-review-queue-v1.json
data/fixtures/calendar-review-queue-invalid-cases-v1.json
data/static/calendar-rank-aware-retry-queue.schema.json
data/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json
data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json
data/static/calendar-runner-compatibility-contract-v1.json
data/fixtures/calendar-runner-compatibility-fixtures-v1.json
data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json
data/fixtures/calendar-local-multi-job-fixtures-v1.json
data/static/calendar-review-cohort-plan.schema.json
data/fixtures/calendar-review-cohort-planner-fixtures-v1.json
data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json
data/static/calendar-review-pr-package.schema.json
data/fixtures/calendar-review-pr-preparation-fixtures-v1.json
data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json
data/static/calendar-due-job-policy-v1.json
data/static/calendar-due-job-plan.schema.json
data/static/calendar-readiness-banei-detail-v1.json
data/static/calendar-banei-retry-queue-apply-approval.schema.json
data/static/calendar-banei-handoff-decision.schema.json
data/static/calendar-banei-handoff-decision-v1.json
data/audits/calendar-hkjc-pilot-reconciliation-v1.json
data/fixtures/calendar-hkjc-fixture-artifact-bridge-fixtures-v1.json
data/fixtures/calendar-due-job-planner-fixtures-v1.json
data/fixtures/calendar-due-job-planner-invalid-cases-v1.json
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
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
scripts/timetable/collection-job-validation.mjs
scripts/check-calendar-collection-job.mjs
scripts/timetable/collection-plan-validation.mjs
scripts/check-calendar-collection-plan.mjs
scripts/timetable/five-rank-classifier.mjs
scripts/check-calendar-five-rank-classifier.mjs
scripts/timetable/collection-result-manifest-validation.mjs
scripts/check-calendar-collection-result-manifest.mjs
scripts/timetable/review-queue-validation.mjs
scripts/check-calendar-review-queue.mjs
scripts/timetable/rank-aware-retry-queue-validation.mjs
scripts/check-calendar-rank-aware-retry-queue.mjs
scripts/timetable/runner-compatibility.mjs
scripts/check-calendar-runner-compatibility.mjs
scripts/timetable/hkjc-fixture-artifact-bridge-core.mjs
scripts/timetable/collect-hkjc-fixture-artifacts.mjs
scripts/check-calendar-hkjc-fixture-artifact-bridge.mjs
scripts/timetable/actions-multi-job-core.mjs
scripts/timetable/plan-actions-multi-job.mjs
scripts/timetable/run-calendar-actions-job.mjs
scripts/timetable/run-hkjc-bounded-generator-job.mjs
scripts/timetable/summarize-actions-multi-job.mjs
scripts/check-calendar-actions-multi-job.mjs
scripts/timetable/local-multi-job-core.mjs
scripts/timetable/run-jra-local-review-job.mjs
scripts/timetable/run-calendar-local-plan.mjs
scripts/check-calendar-local-multi-job.mjs
scripts/timetable/review-cohort-planner.mjs
scripts/check-calendar-review-cohort-planner.mjs
scripts/timetable/review-pr-preparation.mjs
scripts/timetable/prepare-calendar-review-pr-packages.mjs
scripts/check-calendar-review-pr-preparation.mjs
scripts/timetable/due-job-planner.mjs
scripts/timetable/plan-calendar-due-jobs.mjs
scripts/check-calendar-due-job-planner.mjs
.github/workflows/calendar-actions-multi-job.yml
.github/workflows/calendar-local-multi-job.yml
.github/workflows/calendar-review-cohort-planner.yml
.github/workflows/calendar-review-pr-preparation.yml
.github/workflows/calendar-due-job-planner.yml
.github/workflows/calendar-acquisition-registry.yml
.github/workflows/calendar-collection-job.yml
.github/workflows/calendar-collection-plan.yml
.github/workflows/calendar-five-rank-classifier.yml
.github/workflows/calendar-collection-result-manifest.yml
.github/workflows/calendar-review-queue.yml
.github/workflows/calendar-rank-aware-retry-queue.yml
.github/workflows/calendar-runner-compatibility.yml
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

## Planned control-plane machine-readable entry points

The exact paths will be fixed by implementation PRs, but the required artifact classes are:

```text
control-plane release gate
```

Do not invent parallel ad hoc schemas outside the control-plane contract.

## Current programme state

The readiness registry contains the 116 reviewed system/source decisions consolidated by the final 98-country audit. The baseline migration map governs how existing Calendar implementation is retained, repaired, migrated, replaced, or archived.

NAR schedule coverage through 2026-07-31 is published. The July 8–31 batch contains 82 schedule-confirmed meetings: 11 A+ and 71 C, with zero schedule errors and 71 pending detail retries. Temporary diagnostic PRs are closed, and formal Actions manual dispatch is active with local fallback.

The immediate sequence is:

```text
Operations v2 operator view (current)
+ Banei source-specific implementation may proceed on the satisfied minimum handoff gate
```

## Operating rule

Calendar work starts from reviewed source tests, authority/source records, country-page notes, Calendar Readiness records, and the Acquisition Control Plane contracts. It must not begin from generic country assumptions or operator memory.

Country-page completion, source capability, Collection Target Rank, Public Ceiling, Calendar Readiness, runner profile, implementation status, source health, coverage claim, review state, promotion state, and publication state remain separate facts.

Ordinary updates may be partial and irregular. A completion claim is validated separately.

## Local research boundary

Detailed local captures remain outside the repository. The public repository may contain only reviewed, public-safe derived metadata and summaries. Follow `docs/governance/internal-source-handling.md`.

## Maintenance

Every Calendar PR must review `incremental-coverage-contract.md`, `validation-responsibility-contract.md`, `acquisition-control-plane-contract.md`, `acquisition-control-plane-implementation-plan.md`, and the applicable source-specific plan. Update the relevant roadmap, readiness registry, acquisition registry, source record, runbook, schema, contract, queue contract, or validator when its state or rule changes.
