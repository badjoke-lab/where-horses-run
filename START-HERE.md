# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-07-08

## Required reading

```text
docs/governance/document-authority.md
docs/project-roadmap.md
docs/operations/deployment-and-ci-policy.md
docs/calendar/README.md
docs/calendar/source-test-v2-contract.md
docs/calendar/calendar-readiness-contract.md
docs/calendar/machine-readable-contracts.md
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
docs/calendar/implementation-roadmap.md
docs/calendar/japan-a-plus-reconciliation-plan.md
docs/calendar/japan-full-month-scope-policy.md
docs/calendar/jra-a-plus-pilot-completion.md
docs/calendar/nar-a-plus-pilot-plan.md
docs/calendar/nar-a-plus-source-architecture.md
docs/calendar/nar-fixture-probe.md
docs/calendar/nar-candidate-adapter.md
docs/calendar/nar-14-racecourse-compatibility-audit.md
docs/calendar/manual-nar-fixture-collection.md
docs/calendar/nar-monthly-collection-contract.md
docs/calendar/manual-nar-incremental-collection.md
docs/calendar/manual-nar-monthly-collection.md
docs/calendar/banei-a-plus-full-month-plan.md
docs/calendar/current-baseline-audit.md
docs/calendar/baseline-reconciliation-map.md
docs/calendar/pipeline-v1-release-gate.md
docs/calendar/dynamic-dates-release-gate.md
docs/calendar/operations-v1-release-gate.md
```

## Active Calendar model

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

Validation roles:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

Operational flow:

```text
Collection Plan
-> independent Collection Jobs
-> runner routing
-> source-specific adapters
-> field observation
-> C/B/B+/A/A+ classification
-> Batch Validation
-> Coverage Observation
-> Review Queue
-> Rank-aware Retry Queue
-> human review
-> Promotion Validation
-> canonical promotion
-> public projection
```

Rules:

- operator runs may be irregular;
- windows may vary, overlap, cross month boundaries, or target selected meetings;
- one campaign may contain multiple systems with different date ranges;
- shorter source horizons and valid partial batches are allowed;
- meetings may enter at C, B, B+, A, or A+ according to reviewed evidence;
- direct promotion may skip intermediate ranks when evidence supports a higher rank;
- B and B+ are first-class operational states;
- absence from one run is not deletion or cancellation;
- normal promotion rejects rank regression;
- corrective downgrade is a separate explicit reviewed path;
- runner choice does not change batch, rank, coverage, review, or promotion semantics;
- month or season completeness belongs only to explicit Completion Audit;
- unattended publication remains disabled unless separately approved.

## Runner model

Runner routing is system/source/adapter specific, not country-only.

Initial operating direction:

```text
JRA
primary runner: local

NAR
current: local runner available + bounded Actions success evidence
target after formal workflow activation:
  primary runner: github_actions
  fallback runner: local
```

Do not manage future systems by operator memory. The Acquisition Registry will become the routing source of truth.

## Shared implemented machine-readable references

```text
data/static/authority-source-inventory.json
data/static/authority-source-inventory-japan-v2.json
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-readiness-japan-v2.json
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
data/static/timetable-candidate-v1.schema.json
data/static/japan-a-plus-policy.json
data/static/japan-a-plus-runtime-control.json
data/static/local-racing-pilot-control-v2.json
data/static/banei-pilot-control.json
data/audits/calendar-baseline-migration-map.json
data/audits/calendar-pipeline-v1-release-gate.json
data/audits/calendar-dynamic-dates-release-gate.json
data/audits/calendar-operations-v1-release-gate.json
data/audits/japan-a-plus-reconciliation-completion.json
data/audits/calendar-jra-a-plus-pilot-completion.json
data/static/calendar-operations-control.json
data/static/calendar-operations-seasonal-policy.json
data/generated/timetable/operations-status.json
data/generated/timetable/operations-review-package.json
scripts/timetable/coverage-observation-validation.mjs
scripts/timetable/pipeline-v1/promotion-core.mjs
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
scripts/check-calendar-contracts.mjs
scripts/check-calendar-baseline-reconciliation.mjs
scripts/check-calendar-pipeline-v1-release-gate.mjs
scripts/check-calendar-dynamic-dates-release-gate.mjs
scripts/check-calendar-operations-v1-release-gate.mjs
scripts/check-japan-a-plus-reconciliation-completion.mjs
scripts/check-calendar-jra-pilot-completion.mjs
scripts/check-project-governance-docs.mjs
```

## Planned control-plane machine-readable references

Implementation must create canonical schemas/validators for:

```text
Acquisition Registry
Collection Job
Collection Plan
Collection Result Manifest
Review Queue
Rank-aware Retry Queue
five-rank classifier contract
runner compatibility
control-plane release gate
```

Do not create parallel ad hoc job/queue formats outside the control-plane contract.

## NAR ordinary operator references

```text
scripts/timetable/nar-incremental-core.mjs
scripts/timetable/collect-nar-incremental.mjs
scripts/timetable/run-nar-incremental-local.mjs
scripts/check-calendar-nar-incremental-core.mjs
scripts/check-calendar-nar-incremental.mjs

scripts/timetable/nar-incremental-v2-core.mjs
scripts/timetable/nar-incremental-v2-reconcile.mjs
scripts/timetable/normalize-nar-schedule-aware-month.mjs
scripts/timetable/collect-nar-incremental-v2.mjs
scripts/timetable/collect-nar-incremental-v2-reconciled.mjs
scripts/timetable/run-nar-incremental-v2-local.mjs
scripts/check-calendar-nar-incremental-v2-core.mjs
scripts/check-calendar-nar-incremental-v2.mjs
```

Future ordinary NAR collection uses v2 immutable batch paths. The old fixed-path v1 incremental artifacts remain historical evidence for the reviewed July 5–7 batch and must not be overwritten.

The formal NAR Actions workflow-dispatch path is a scheduled implementation step. Temporary diagnostic workflows are not the canonical normal operation.

## NAR compatibility and audit references

```text
data/static/nar-source-route-architecture-v1.json
data/static/nar-venue-code-research-seed-v1.json
data/static/nar-flat-racecourse-compatibility-v1.json
data/static/nar-monthly-collection-policy-v1.json
data/fixtures/timetable/nar/route-probe-v1.json
data/fixtures/timetable/nar/complete-meetings/
data/candidates/nar-route-probe-candidates.json
data/candidates/nar-monthly-meeting-candidates.json
data/candidates/nar-monthly-2026-07-full-month-candidates.json
data/generated/timetable/nar-monthly-collection-report.json
data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json
data/audits/nar-legacy-pr281-migration.json
data/audits/nar-fixture-probe-v1.json
data/audits/nar-candidate-adapter-v1.json
data/audits/nar-14-racecourse-compatibility-v1.json
collect-nar-fixtures-manual
collect-nar-monthly-manual
collect-nar-full-month-manual
scripts/timetable/build-nar-route-probe-candidates.mjs
scripts/timetable/build-nar-monthly-schedule-plan.mjs
scripts/timetable/collect-nar-complete-fixtures.mjs
scripts/timetable/collect-nar-complete-fixtures-v2.mjs
scripts/timetable/collect-nar-monthly-candidates.mjs
scripts/timetable/parse-nar-monthly-schedule-grid.mjs
scripts/timetable/normalize-nar-full-month-schedule-fetch.mjs
scripts/timetable/manual-collect-nar-fixtures.mjs
scripts/timetable/manual-collect-nar-monthly.mjs
scripts/timetable/manual-collect-nar-full-month.mjs
scripts/check-calendar-nar-source-architecture.mjs
scripts/check-calendar-nar-fixture-probe.mjs
scripts/check-calendar-nar-candidate-adapter.mjs
scripts/check-calendar-nar-14-racecourse-compatibility.mjs
scripts/check-calendar-nar-monthly-collection-policy.mjs
scripts/check-calendar-nar-complete-fixture-set.mjs
scripts/check-calendar-nar-fixture-operator.mjs
scripts/check-calendar-nar-monthly-candidate-set.mjs
scripts/check-calendar-nar-monthly-operator.mjs
scripts/check-calendar-nar-full-month-parser.mjs
scripts/check-calendar-nar-full-month-candidate-set.mjs
```

The July full-month NAR path is a bounded Completion Audit, not the ordinary update contract.

## Current work

Completed implementation Work IDs:

```text
WHR-CAL-PIPELINE-V1
WHR-CAL-DYNAMIC-DATES
WHR-CAL-OPS-V1
WHR-CAL-JAPAN-JRA
WHR-CAL-JAPAN-A-PLUS-RECONCILE
WHR-CAL-JAPAN-JRA-A-PLUS
```

Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Next Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Subsequent Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

Current NAR status:

```text
published through 2026-07-07
July 8–31 review batch committed
schedule-confirmed: 82
A+: 11
C: 71
schedule errors: 0
coverage: source_window_complete
pending detail retries: 71
promotion/publication of this batch: pending
```

## Active sequence

```text
1. merge control-plane documentation alignment
2. finish NAR 82-meeting review/promotion/publication
3. close temporary diagnostic PRs #430 and #435 without merge
4. formalize NAR Actions manual dispatch
5. add Acquisition Registry
6. add Collection Job schema
7. add Collection Plan schema
8. add five-rank classifier contract tests
9. add Collection Result Manifest
10. add Review Queue
11. add Rank-aware Retry Queue
12. connect Actions and local runners to shared job semantics
13. begin Banei on the shared foundation
14. add Actions multi-job execution
15. add local multi-job execution
16. add review cohort planner
17. add automatic review PR preparation
18. add due-job planning and scheduled bounded retries
19. add Operations v2 operator view
```

## Historical compatibility markers

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
> Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`

- `WHR-CAL-JAPAN-NAR`
- `WHR-CAL-JAPAN-BANEI`
