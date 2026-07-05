# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-07-05

Read documents in this order:

1. [`docs/governance/document-authority.md`](docs/governance/document-authority.md)
2. [`docs/project-roadmap.md`](docs/project-roadmap.md)
3. [`docs/operations/deployment-and-ci-policy.md`](docs/operations/deployment-and-ci-policy.md)

Country-page programme:

4. [`docs/country-pages/programme-roadmap.md`](docs/country-pages/programme-roadmap.md)
5. [`docs/country-pages/completion-contract.md`](docs/country-pages/completion-contract.md)
6. [`docs/country-pages/98-country-tracker.tsv`](docs/country-pages/98-country-tracker.tsv)
7. [`docs/runbooks/final-country-calendar-audit-98.md`](docs/runbooks/final-country-calendar-audit-98.md)

Calendar work:

4. [`docs/calendar/README.md`](docs/calendar/README.md)
5. [`docs/calendar/source-test-v2-contract.md`](docs/calendar/source-test-v2-contract.md)
6. [`docs/calendar/calendar-readiness-contract.md`](docs/calendar/calendar-readiness-contract.md)
7. [`docs/calendar/machine-readable-contracts.md`](docs/calendar/machine-readable-contracts.md)
8. [`docs/calendar/implementation-roadmap.md`](docs/calendar/implementation-roadmap.md)
9. [`docs/calendar/japan-a-plus-reconciliation-plan.md`](docs/calendar/japan-a-plus-reconciliation-plan.md)
10. [`docs/calendar/japan-full-month-scope-policy.md`](docs/calendar/japan-full-month-scope-policy.md)
11. [`docs/calendar/jra-a-plus-pilot-completion.md`](docs/calendar/jra-a-plus-pilot-completion.md)
12. [`docs/calendar/nar-a-plus-pilot-plan.md`](docs/calendar/nar-a-plus-pilot-plan.md)
13. [`docs/calendar/nar-a-plus-source-architecture.md`](docs/calendar/nar-a-plus-source-architecture.md)
14. [`docs/calendar/nar-fixture-probe.md`](docs/calendar/nar-fixture-probe.md)
15. [`docs/calendar/nar-candidate-adapter.md`](docs/calendar/nar-candidate-adapter.md)
16. [`docs/calendar/nar-14-racecourse-compatibility-audit.md`](docs/calendar/nar-14-racecourse-compatibility-audit.md)
17. [`docs/calendar/manual-nar-fixture-collection.md`](docs/calendar/manual-nar-fixture-collection.md)
18. [`docs/calendar/nar-monthly-collection-contract.md`](docs/calendar/nar-monthly-collection-contract.md)
19. [`docs/calendar/manual-nar-monthly-collection.md`](docs/calendar/manual-nar-monthly-collection.md)
20. [`docs/calendar/banei-a-plus-full-month-plan.md`](docs/calendar/banei-a-plus-full-month-plan.md)
21. [`docs/calendar/current-baseline-audit.md`](docs/calendar/current-baseline-audit.md)
22. [`docs/calendar/baseline-reconciliation-map.md`](docs/calendar/baseline-reconciliation-map.md)
23. [`docs/calendar/pipeline-v1-release-gate.md`](docs/calendar/pipeline-v1-release-gate.md)
24. [`docs/calendar/dynamic-dates-release-gate.md`](docs/calendar/dynamic-dates-release-gate.md)
25. [`docs/calendar/operations-v1-release-gate.md`](docs/calendar/operations-v1-release-gate.md)

Machine-readable Calendar files:

```text
data/static/authority-source-inventory.json
data/static/authority-source-inventory-japan-v2.json
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-readiness-japan-v2.json
data/static/japan-a-plus-policy.json
data/static/japan-a-plus-runtime-control.json
data/static/local-racing-pilot-control-v2.json
data/static/banei-pilot-control.json
data/static/nar-source-route-architecture-v1.json
data/static/nar-venue-code-research-seed-v1.json
data/static/nar-flat-racecourse-compatibility-v1.json
data/static/nar-monthly-collection-policy-v1.json
data/fixtures/timetable/nar/route-probe-v1.json
data/fixtures/timetable/nar/complete-meetings/
data/candidates/nar-route-probe-candidates.json
data/candidates/nar-monthly-meeting-candidates.json
data/candidates/nar-monthly-2026-07-full-month-candidates.json
data/audits/calendar-baseline-migration-map.json
data/audits/calendar-pipeline-v1-release-gate.json
data/audits/calendar-dynamic-dates-release-gate.json
data/audits/calendar-operations-v1-release-gate.json
data/audits/japan-a-plus-reconciliation-completion.json
data/audits/calendar-jra-a-plus-pilot-completion.json
data/audits/nar-legacy-pr281-migration.json
data/audits/nar-fixture-probe-v1.json
data/audits/nar-candidate-adapter-v1.json
data/audits/nar-14-racecourse-compatibility-v1.json
data/static/calendar-operations-control.json
data/static/calendar-operations-seasonal-policy.json
data/generated/timetable/operations-status.json
data/generated/timetable/operations-review-package.json
data/generated/timetable/nar-monthly-collection-report.json
data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json
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
scripts/check-calendar-contracts.mjs
scripts/check-calendar-baseline-reconciliation.mjs
scripts/check-calendar-pipeline-v1-release-gate.mjs
scripts/check-calendar-dynamic-dates-release-gate.mjs
scripts/check-calendar-operations-v1-release-gate.mjs
scripts/check-japan-a-plus-reconciliation-completion.mjs
scripts/check-calendar-jra-pilot-completion.mjs
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
scripts/check-project-governance-docs.mjs
```

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

The 98-country programme, Calendar foundations, Japan A+ reconciliation, and the JRA A+ pilot are complete. NAR/local-government racing is the active pilot. Source architecture, bounded probe, candidate adapter, all-fourteen compatibility review, fixture operator, complete fixture set, and the first reviewed A+ promotion through 2026-07-04 are complete.

The 2026-07-04 promotion is valid partial A+ data, not NAR monthly completion. The active NAR phase requires full July coverage from 2026-07-01 through 2026-07-31. The full-month collector uses the official monthly schedule grid to retain every scheduled racecourse/date and RaceList/DebaTable routes to add A+ detail when available. Future scheduled meetings remain explicit pending-detail records rather than omissions or no-meeting classifications. Scheduling and unattended candidate/canonical/public writes remain disabled.

After NAR month-wide completion, Banei uses the same full July boundary under its separate parser and Work ID.

## Completed transition records

> Current Work ID: `WHR-CAL-JAPAN-A-PLUS-RECONCILE`  
> Next Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`

> Current Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
> Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

## Superseded transition record

The following labels record the state closed when the earlier local-racing C pilot was superseded. They are historical compatibility markers, not the active Current or Next Work IDs.

Previous completed implementation Work ID: `WHR-CAL-JAPAN-JRA`

- `WHR-CAL-JAPAN-NAR`
- `WHR-CAL-JAPAN-BANEI`
