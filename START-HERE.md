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
14. [`docs/calendar/nar-14-racecourse-compatibility-audit.md`](docs/calendar/nar-14-racecourse-compatibility-audit.md)
15. [`docs/calendar/nar-monthly-collection-contract.md`](docs/calendar/nar-monthly-collection-contract.md)
16. [`docs/calendar/manual-nar-monthly-collection.md`](docs/calendar/manual-nar-monthly-collection.md)
17. [`docs/calendar/banei-a-plus-full-month-plan.md`](docs/calendar/banei-a-plus-full-month-plan.md)
18. [`docs/calendar/current-baseline-audit.md`](docs/calendar/current-baseline-audit.md)
19. [`docs/calendar/pipeline-v1-release-gate.md`](docs/calendar/pipeline-v1-release-gate.md)
20. [`docs/calendar/dynamic-dates-release-gate.md`](docs/calendar/dynamic-dates-release-gate.md)
21. [`docs/calendar/operations-v1-release-gate.md`](docs/calendar/operations-v1-release-gate.md)

Machine-readable Calendar files include:

```text
data/static/authority-source-inventory.json
data/static/authority-source-inventory-japan-v2.json
data/static/calendar-readiness-registry.json
data/static/calendar-readiness-japan-v2.json
data/static/japan-a-plus-policy.json
data/static/japan-a-plus-runtime-control.json
data/static/local-racing-pilot-control-v2.json
data/static/banei-pilot-control.json
data/static/nar-flat-racecourse-compatibility-v1.json
data/static/nar-monthly-collection-policy-v1.json
data/candidates/nar-monthly-meeting-candidates.json
data/candidates/nar-monthly-2026-07-full-month-candidates.json
data/generated/timetable/nar-monthly-collection-report.json
data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json
collect-nar-monthly-manual
collect-nar-full-month-manual
scripts/timetable/parse-nar-monthly-schedule-grid.mjs
scripts/timetable/normalize-nar-full-month-schedule-fetch.mjs
scripts/timetable/manual-collect-nar-full-month.mjs
scripts/check-calendar-nar-full-month-candidate-set.mjs
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

The reviewed NAR A+ promotion through 2026-07-04 is valid partial data, not NAR monthly completion. The active NAR phase now requires full July coverage from 2026-07-01 through 2026-07-31. The full-month collector uses the official monthly schedule grid to preserve every scheduled racecourse/date, while RaceList and DebaTable add A+ detail when available. Future scheduled meetings remain explicit pending-detail records rather than being omitted or misclassified as no-meeting venues.

After NAR month-wide completion, Banei uses the same full July boundary under its separate parser and Work ID. Scheduling and unattended candidate/canonical/public writes remain disabled.
