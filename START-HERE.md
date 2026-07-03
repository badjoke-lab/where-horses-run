# Where Horses Run — current development entry point

Status: active entry point  
Last reviewed: 2026-07-03

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
10. [`docs/calendar/jra-a-plus-pilot-completion.md`](docs/calendar/jra-a-plus-pilot-completion.md)
11. [`docs/calendar/current-baseline-audit.md`](docs/calendar/current-baseline-audit.md)
12. [`docs/calendar/baseline-reconciliation-map.md`](docs/calendar/baseline-reconciliation-map.md)
13. [`docs/calendar/pipeline-v1-release-gate.md`](docs/calendar/pipeline-v1-release-gate.md)
14. [`docs/calendar/dynamic-dates-release-gate.md`](docs/calendar/dynamic-dates-release-gate.md)
15. [`docs/calendar/operations-v1-release-gate.md`](docs/calendar/operations-v1-release-gate.md)

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
scripts/check-calendar-contracts.mjs
scripts/check-calendar-baseline-reconciliation.mjs
scripts/check-calendar-pipeline-v1-release-gate.mjs
scripts/check-calendar-dynamic-dates-release-gate.mjs
scripts/check-calendar-operations-v1-release-gate.mjs
scripts/check-japan-a-plus-reconciliation-completion.mjs
scripts/check-calendar-jra-pilot-completion.mjs
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

The 98-country programme, Calendar foundations, Japan A+ reconciliation, and the JRA A+ pilot are complete. JRA operates through an operator-triggered, review-controlled local refresh path. NAR/local-government racing is the active pilot and requires authority- and racecourse-specific source architecture. Banei follows as a separate pilot. Scheduling and unattended canonical/public writes remain disabled.

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
