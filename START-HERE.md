# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-07-06

## Required reading

1. `docs/governance/document-authority.md`
2. `docs/project-roadmap.md`
3. `docs/operations/deployment-and-ci-policy.md`

Country-page programme:

```text
docs/country-pages/programme-roadmap.md
docs/country-pages/completion-contract.md
docs/country-pages/98-country-tracker.tsv
docs/runbooks/final-country-calendar-audit-98.md
```

Calendar work:

```text
docs/calendar/README.md
docs/calendar/source-test-v2-contract.md
docs/calendar/calendar-readiness-contract.md
docs/calendar/machine-readable-contracts.md
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
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
```

Validation roles:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

Rules:

- operator runs may be irregular;
- windows may vary, overlap, cross month boundaries, or target selected meetings;
- shorter source horizons and valid partial batches are allowed;
- meetings may enter at C, B, B+, A, or A+ according to reviewed evidence;
- absence from one run is not deletion or cancellation;
- later lower-detail observation does not automatically regress higher reviewed rank;
- normal promotion rejects rank regression;
- corrective downgrade is a separate explicit reviewed path;
- month/season completeness belongs only to explicit Completion Audit.

## Core machine-readable Calendar files

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

## NAR references

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

Current Work ID:

```text
WHR-CAL-JAPAN-NAR-A-PLUS
```

Next Work ID:

```text
WHR-CAL-JAPAN-BANEI-A-PLUS
```

Completed NAR/shared prerequisite work:

- NAR source architecture and bounded probe;
- candidate adapter and 14-racecourse compatibility;
- 14/14 complete fixture set;
- first reviewed A+ promotion through 2026-07-04;
- July bounded completion-audit tooling;
- incremental coverage contract;
- Coverage Observation schema and validator;
- Batch / Promotion / Coverage / Completion responsibility split;
- normal promotion rank-regression guard;
- explicit corrective-downgrade boundary.

Active sequence:

1. refactor NAR ordinary collection away from fixed July completion gating;
2. support arbitrary and overlapping windows plus selected-meeting retries;
3. emit Coverage Observation and explicit retry targets;
4. collect, review, and promote the next source-visible NAR batch;
5. run July Completion Audit only when claiming July coverage complete;
6. complete freshness, rollback, public projection, and bilingual QA;
7. hand off to Banei under the same common contract with Banei-specific parsing.

## Historical transition markers

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
> Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`

- `WHR-CAL-JAPAN-NAR`
- `WHR-CAL-JAPAN-BANEI`
