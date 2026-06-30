# Calendar programme documentation

Status: active documentation index  
Last reviewed: 2026-07-01

Use these files together:

- [`../project-roadmap.md`](../project-roadmap.md) — full product sequence and current Work ID.
- [`source-test-v2-contract.md`](source-test-v2-contract.md) — required source-research output.
- [`calendar-readiness-contract.md`](calendar-readiness-contract.md) — completion states for each racing system and source.
- [`machine-readable-contracts.md`](machine-readable-contracts.md) — schema, registry, stable-reference, and validator map.
- [`implementation-roadmap.md`](implementation-roadmap.md) — reconciliation, pipeline activation, pilots, release, expansion, and operations.
- [`current-baseline-audit.md`](current-baseline-audit.md) — reconciled repository capabilities and gaps.
- [`baseline-reconciliation-map.md`](baseline-reconciliation-map.md) — reviewed retain/repair/migrate/replace/archive decisions and execution order.
- [`pipeline-v1-build-boundary.md`](pipeline-v1-build-boundary.md) — static-build read boundary and explicit generation separation.
- [`pipeline-v1-candidate-contract.md`](pipeline-v1-candidate-contract.md) — bounded candidate envelope, rank limits, and human-review rules.
- [`pipeline-v1-promotion.md`](pipeline-v1-promotion.md) — approved-candidate registry gates and idempotent canonical promotion.
- [`pipeline-v1-public-projection.md`](pipeline-v1-public-projection.md) — deterministic Public Ceiling and field-policy projection.
- [`pipeline-v1-jra-reference-adapter.md`](pipeline-v1-jra-reference-adapter.md) — first source adapter migrated to the candidate v1 boundary.
- [`pipeline-v1-release-gate.md`](pipeline-v1-release-gate.md) — grouped Pipeline v1 completion and remaining-work boundary.
- [`../specs/global-timetable-architecture.md`](../specs/global-timetable-architecture.md) and its active addendum.
- [`../specs/authority-source-inventory-schema.md`](../specs/authority-source-inventory-schema.md) and its active addendum.
- [`../specs/timetable-data-flow-and-display-contract.md`](../specs/timetable-data-flow-and-display-contract.md).
- [`../operations/deployment-and-ci-policy.md`](../operations/deployment-and-ci-policy.md).

## Machine-readable entry points

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/timetable-candidate-v1.schema.json
data/static/timetable-source-aliases-v1.json
data/candidates/japan-jra-candidates.json
data/audits/calendar-baseline-migration-map.json
data/audits/calendar-pipeline-v1-release-gate.json
scripts/check-calendar-contracts.mjs
scripts/check-calendar-baseline-reconciliation.mjs
scripts/check-calendar-build-boundary.mjs
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/check-calendar-pipeline-v1-public-projection.mjs
scripts/check-japan-jra-candidate-generator.mjs
scripts/check-calendar-pipeline-v1-release-gate.mjs
```

The readiness registry contains the 116 reviewed system/source decisions consolidated by the final 98-country audit. The baseline migration map governs how existing Calendar implementation is retained, repaired, migrated, replaced, or archived.

## Operating rule

Calendar work starts from reviewed source tests, authority/source records, country-page notes, and Calendar Readiness records. It must not begin from generic country assumptions.

Country-page completion, source capability, Public Ceiling, Calendar Readiness, and implementation status share stable identifiers but remain separate states.

## Local research boundary

Detailed local captures remain outside the repository. The public repository may contain only reviewed, public-safe derived metadata and summaries. Follow `docs/governance/internal-source-handling.md`.

## Maintenance

Every Calendar PR must update the applicable roadmap, readiness registry, source record, runbook, schema, contract, or validator when its state or rule changes.
