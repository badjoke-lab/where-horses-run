# Calendar programme documentation

Status: active documentation index  
Last reviewed: 2026-09-11

Current 2026-09-11 operating pointer:

- [`acquisition-completion-contract.md`](acquisition-completion-contract.md) — valid `C/B/B+/A` evidence is not acquisition completion by itself; lower-rank cycles require explicit higher-detail disposition.
- [`field-publication-and-diagnostics-contract.md`](field-publication-and-diagnostics-contract.md) — verified richer fields are preserved/published independently of rank when policy permits; `?diag=calendar` is operator-only.
- [`implementation-roadmap-2026-09-11-addendum.md`](implementation-roadmap-2026-09-11-addendum.md) — current Calendar implementation addendum. Where older roadmap/index wording conflicts with the 2026-09-11 contracts, this addendum and those contracts control.

Use these files together:

- [`../project-roadmap.md`](../project-roadmap.md) — full product sequence and current Work ID.
- [`source-test-v2-contract.md`](source-test-v2-contract.md) — required source-research output.
- [`calendar-readiness-contract.md`](calendar-readiness-contract.md) — source/system operational readiness; it does not determine an individual meeting's observed rank or acquisition completion.
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
- [`implementation-roadmap.md`](implementation-roadmap.md) — historical/current programme roadmap read together with the 2026-09-11 addendum.
- [`current-baseline-audit.md`](current-baseline-audit.md) — reconciled repository capabilities and gaps.
- [`baseline-reconciliation-map.md`](baseline-reconciliation-map.md) — reviewed retain/repair/migrate/replace/archive decisions and execution order.
- [`pipeline-v1-build-boundary.md`](pipeline-v1-build-boundary.md) — static-build read boundary and explicit generation separation.
- [`pipeline-v1-candidate-contract.md`](pipeline-v1-candidate-contract.md) — bounded candidate envelope, rank limits, and human-review rules.
- [`pipeline-v1-promotion.md`](pipeline-v1-promotion.md) — approved-candidate registry gates, monotonic normal promotion, and explicit corrective downgrade boundary.
- [`pipeline-v1-public-projection.md`](pipeline-v1-public-projection.md) — deterministic Public Ceiling and field-policy projection; current richer-field visibility is further governed by the field-publication contract above.
- [`pipeline-v1-jra-reference-adapter.md`](pipeline-v1-jra-reference-adapter.md) — first source adapter migrated to the candidate v1 boundary.
- [`pipeline-v1-release-gate.md`](pipeline-v1-release-gate.md) — grouped Pipeline v1 completion and remaining-work boundary.
- [`dynamic-dates-contract.md`](dynamic-dates-contract.md) — explicit reference date, timezone, Today/Tomorrow, rolling window, and stale-state rules.
- [`dynamic-dates-release-gate.md`](dynamic-dates-release-gate.md) — Dynamic Dates completion and Operations v1 boundary.
- [`public-v1-surface-audit.md`](public-v1-surface-audit.md) — Calendar Public v1 Calendar/Today/Tomorrow shared-surface audit, validator reconciliation, bilingual parity, one-meeting-per-row boundary, and rendered fixture matrix.
- [`public-v1-pilot-record-reconciliation.md`](public-v1-pilot-record-reconciliation.md) — deterministic reviewed-coverage and additional-detail states across JRA, NAR, Banei, HKJC, and UAE public meeting rows.
- [`public-v1-operations-presentation.md`](public-v1-operations-presentation.md) — bilingual current/stale/empty/source-failure and reviewed retry-ownership presentation without internal Queue publication.
- [`public-v1-navigation-qa.md`](public-v1-navigation-qa.md) — rendered bilingual route parity, canonical/hreflang, language switching, meeting back links, and internal-link integrity.
- [`public-v1-release-decision.md`](public-v1-release-decision.md) — accepted `WHR-CAL-PUBLIC-V1` reviewed static release decision and transition to `WHR-RACECOURSE-PAGES-V1`.
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
- [`hkjc-shared-actions-live-evidence.md`](hkjc-shared-actions-live-evidence.md) — HKJC-PILOT-03 shared Actions integration, reviewed parser-failure live evidence, provisional Registry decision, and PILOT-04 handoff.
- [`hkjc-pilot-04-live-evidence.md`](hkjc-pilot-04-live-evidence.md) — HKJC-PILOT-04 fail-closed empty-window semantics, successful repeated shared-Actions evidence, evidence-backed schedule-path decision, provisional full-profile boundary, and PILOT-05 handoff.
- [`hkjc-detail-artifact-core.md`](hkjc-detail-artifact-core.md) — HKJC-PILOT-05 public-safe five-rank detail core, external review-artifact collector, output guard, and Registry non-activation boundary.
- [`hkjc-pilot-05-detail-route-evidence.md`](hkjc-pilot-05-detail-route-evidence.md) — hosted detail live evidence, route/session shell probes, accepted core/collector decision, blocked Registry detail activation, and PILOT-06 runner/source-route handoff.
- [`hkjc-detail-runner-source-route-reconciliation.md`](hkjc-detail-runner-source-route-reconciliation.md) — PILOT-06 runner correction, external reviewed-import contract, two-stage review semantics, and Registry non-activation boundary.
- [`hkjc-pilot-06-reviewed-import-evidence.md`](hkjc-pilot-06-reviewed-import-evidence.md) — evidence-backed reviewed-import detail operator path, rank-B bounded evidence, pending system-level fallback decision, and PILOT-06B handoff.
- [`hkjc-route-specific-runner-policy.md`](hkjc-route-specific-runner-policy.md) — PILOT-06B schedule/detail route split, operator-only detail isolation, backward-compatible Registry semantics, and Operations supplement.
- [`hkjc-handoff-decision.md`](hkjc-handoff-decision.md) — accepted bounded manual reviewed steady-state HKJC handoff, explicit non-claims, and next Work ID `WHR-CAL-UAE-ERA`.
- [`uae-era-handoff-decision.md`](uae-era-handoff-decision.md) — accepted bounded manual reviewed steady-state UAE ERA handoff, provisional C-only boundaries, and next Work ID `WHR-CAL-PUBLIC-V1`.
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
