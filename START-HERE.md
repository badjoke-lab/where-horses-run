# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-07-14

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
docs/calendar/collection-result-manifest.md
docs/calendar/review-queue.md
docs/calendar/rank-aware-retry-queue.md
docs/calendar/runner-compatibility.md
docs/calendar/actions-multi-job-runner.md
docs/calendar/local-multi-job-runner.md
docs/calendar/review-cohort-planner.md
docs/calendar/review-pr-preparation.md
docs/calendar/due-job-planner.md
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
docs/calendar/public-v1-release-decision.md
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
primary runner: github_actions
fallback runner: local
formal workflow_dispatch operator: active
scheduled publication: disabled
```

Do not manage future systems by operator memory. The Acquisition Registry is the routing source of truth, and the runner compatibility foundation validates that supported runner paths converge on common Coverage Observation and Result Manifest semantics. The required first Runner Gate is complete across NAR Actions semantics, NAR local fallback semantics, and the JRA shared local Job path.

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
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
data/static/timetable-candidate-v1.schema.json
data/static/japan-a-plus-policy.json
data/static/japan-a-plus-runtime-control.json
data/static/local-racing-pilot-control-v2.json
data/static/banei-pilot-control.json
data/audits/calendar-baseline-migration-map.json
data/audits/calendar-pipeline-v1-release-gate.json
data/audits/calendar-dynamic-dates-release-gate.json
data/audits/calendar-operations-v1-release-gate.json
data/audits/calendar-public-v1-surface-audit-v1.json
data/audits/calendar-public-v1-pilot-record-reconciliation-v1.json
data/audits/calendar-public-v1-operations-presentation-v1.json
data/audits/calendar-public-v1-navigation-qa-v1.json
data/audits/calendar-public-v1-release-decision-v1.json
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
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
scripts/timetable/collection-job-validation.mjs
scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-collection-job.yml
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
scripts/timetable/collection-plan-validation.mjs
scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-collection-plan.yml
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
data/fixtures/calendar-due-job-planner-fixtures-v1.json
data/fixtures/calendar-due-job-planner-invalid-cases-v1.json
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
.github/workflows/calendar-five-rank-classifier.yml
.github/workflows/calendar-collection-result-manifest.yml
.github/workflows/calendar-review-queue.yml
.github/workflows/calendar-rank-aware-retry-queue.yml
.github/workflows/calendar-runner-compatibility.yml
scripts/check-calendar-contracts.mjs
scripts/check-calendar-baseline-reconciliation.mjs
scripts/check-calendar-pipeline-v1-release-gate.mjs
scripts/check-calendar-dynamic-dates-release-gate.mjs
scripts/check-calendar-operations-v1-release-gate.mjs
scripts/check-calendar-public-v1-surface-audit.mjs
scripts/check-calendar-public-v1-pilot-record-reconciliation.mjs
scripts/check-calendar-public-v1-operations-presentation.mjs
scripts/check-calendar-public-v1-navigation-qa.mjs
scripts/check-calendar-public-v1-release-decision.mjs
scripts/check-japan-a-plus-reconciliation-completion.mjs
scripts/check-calendar-jra-pilot-completion.mjs
scripts/check-project-governance-docs.mjs
```

## Planned control-plane machine-readable references

Implementation must create canonical schemas/validators for:

```text
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
scripts/timetable/nar-incremental-v2-actions-core.mjs
scripts/timetable/run-nar-incremental-v2-actions.mjs
scripts/check-calendar-nar-incremental-v2-core.mjs
scripts/check-calendar-nar-incremental-v2.mjs
scripts/check-calendar-nar-incremental-v2-actions-operator.mjs
.github/workflows/calendar-nar-incremental-v2-operator.yml
```

Future ordinary NAR collection uses v2 immutable batch paths. The old fixed-path v1 incremental artifacts remain historical evidence for the reviewed July 5–7 batch and must not be overwritten.

The formal NAR Actions workflow-dispatch path is active as the primary operator entry point. The local v2 runner remains the fallback and development path. Temporary diagnostic workflows are closed and are not part of normal operation.

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

Completed Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
Completed Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
Completed Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`
Completed Work ID: `WHR-CAL-HONG-KONG-HKJC`
Completed Work ID: `WHR-CAL-UAE-ERA`
Completed Work ID: `WHR-CAL-PUBLIC-V1`
Current Work ID: `WHR-RACECOURSE-PAGES-V1`
Completed implementation unit: `RACECOURSE-PAGE-IDENTITY-RECONCILIATION-01`
Current implementation unit: `RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01`

Current NAR status:

```text
published schedule coverage through 2026-07-31
July 8–31 reviewed batch: published
schedule-confirmed: 82
A+: 11
C: 71
schedule errors: 0
coverage: source_window_complete
pending detail retries: 71
primary runner: github_actions
fallback runner: local
```

The 71 C meetings are published schedule identities, not A+ detail-complete meetings. They remain explicit retry work.

## Active sequence

```text
1. connect reviewed today and upcoming meeting state without inventing absent detail
2. add official source, freshness, course, and distance profiles with explicit unknown states
3. complete country, racing-type, glossary, Calendar, racecourse, and meeting page-link architecture
4. validate bilingual responsive racecourse pages and internal-link integrity
```

The Acquisition Control Plane foundation, Actions/local multi-job runners, Review Queue, Rank-aware Retry Queue, review cohort planning, review PR package preparation, Due-job planning, artifact-only scheduled planning, and Operations v2 are already implemented. Scheduled acquisition execution and unattended publication remain disabled.

## Completed Public v1 transition

> Current Work ID: `WHR-CAL-PUBLIC-V1`  
> Next Work ID: `WHR-RACECOURSE-PAGES-V1`

Completed implementation unit: `PUBLIC-V1-RELEASE-DECISION-01`

## Historical compatibility markers

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
> Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`
> Next Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`

Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`

- `WHR-CAL-JAPAN-NAR`
- `WHR-CAL-JAPAN-BANEI`
