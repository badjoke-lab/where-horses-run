# Documentation authority

Status: active canonical governance policy  
Last reviewed: 2026-07-08

## Authority order

When repository documents conflict, use this order:

1. active contracts and machine-readable schemas;
2. `docs/project-roadmap.md`;
3. active programme roadmaps and adopted addenda;
4. active operations policies;
5. canonical trackers and registries;
6. accepted decision records;
7. active runbooks;
8. reviewed research notes;
9. PR plans;
10. historical or superseded specifications.

Conversation history and PR numbers do not replace canonical repository documents.

## Document classes

- **Canonical:** current source of truth.
- **Supporting:** explains canonical material without redefining it.
- **Operational:** repeatable procedures governed by contracts and policies.
- **Research:** reviewed evidence and limitations, not product permission by itself.
- **Historical:** preserves earlier intent but cannot override current contracts.
- **Superseded:** retained for traceability after a named replacement.
- **Internal-only:** private, restricted, raw, or sensitive material that must not enter the public repository.

## Canonical sets

Overall:

- `docs/project-roadmap.md`
- this policy
- `docs/operations/deployment-and-ci-policy.md`

Country pages:

- `docs/country-pages/programme-roadmap.md` plus active addendum
- `docs/country-pages/completion-contract.md` plus Calendar addendum
- `docs/country-pages/98-country-tracker.tsv`

Calendar human-readable contracts:

- `docs/calendar/source-test-v2-contract.md`
- `docs/calendar/calendar-readiness-contract.md`
- `docs/calendar/machine-readable-contracts.md`
- `docs/calendar/incremental-coverage-contract.md`
- `docs/calendar/coverage-observation-schema.md`
- `docs/calendar/validation-responsibility-contract.md`
- `docs/calendar/acquisition-control-plane-contract.md`
- `docs/calendar/acquisition-control-plane-implementation-plan.md`
- `docs/calendar/implementation-roadmap.md`
- `docs/calendar/japan-full-month-scope-policy.md`
- `docs/calendar/nar-a-plus-pilot-plan.md`
- `docs/calendar/nar-monthly-collection-contract.md`
- `docs/calendar/banei-a-plus-full-month-plan.md`
- `docs/calendar/banei-retry-reconciliation.md`
- `docs/calendar/banei-retry-queue-state-apply.md`
- `docs/calendar/banei-freshness-rollback-operating-evidence.md`
- `docs/calendar/banei-bilingual-public-display-qa.md`
- `docs/calendar/banei-handoff-decision.md`
- `docs/calendar/hkjc-pilot-reconciliation.md`
- `docs/calendar/baseline-reconciliation-map.md`
- `docs/calendar/pipeline-v1-release-gate.md`
- `docs/calendar/dynamic-dates-release-gate.md`
- `docs/calendar/operations-v1-contract.md`
- `docs/calendar/operations-v1-release-gate.md`
- `docs/calendar/jra-pilot-foundation.md`
- `docs/calendar/jra-planned-program-intake.md`
- `docs/calendar/jra-final-confirmation-contract.md`
- `docs/calendar/jra-final-program-intake-schema.md`
- `docs/calendar/jra-final-normalized-handoff.md`
- `docs/calendar/local-racing-link-only-pilot.md`
- `docs/runbooks/calendar-operations-status-review.md`
- `docs/runbooks/calendar-operations-pause-rollback.md`
- `docs/runbooks/calendar-seasonal-rollover.md`
- `docs/runbooks/calendar-source-breakage-escalation.md`
- `docs/specs/global-timetable-architecture.md`
- `docs/specs/authority-source-inventory-schema.md` plus active addendum

Calendar machine-readable contracts:

- `data/static/source-test-v2.schema.json`
- `data/static/calendar-readiness.schema.json`
- `data/static/calendar-readiness-registry.json`
- `data/static/calendar-coverage-observation.schema.json`
- `data/static/authority-source-inventory.schema.json`
- `data/static/authority-source-inventory.json`
- `data/static/timetable-candidate-v1.schema.json`
- `data/audits/calendar-baseline-migration-map.json`
- `data/audits/calendar-pipeline-v1-release-gate.json`
- `data/audits/calendar-dynamic-dates-release-gate.json`
- `data/audits/calendar-operations-v1-release-gate.json`
- `data/static/calendar-operations-control.json`
- `data/static/calendar-operations-seasonal-policy.json`
- `data/static/calendar-readiness-banei-detail-v1.json`
- `data/static/calendar-banei-retry-queue-apply-approval.schema.json`
- `data/static/calendar-banei-handoff-decision.schema.json`
- `data/static/calendar-banei-handoff-decision-v1.json`
- `data/audits/calendar-hkjc-pilot-reconciliation-v1.json`
- `data/static/jra-pilot-control.json`
- `data/static/jra-final-program-intake.schema.json`
- `data/static/local-racing-pilot-control.json`
- `data/generated/timetable/operations-status.json`
- `data/generated/timetable/operations-review-package.json`
- `data/generated/timetable/jra-pilot-review.json`
- `data/generated/timetable/jra-planned-program-intake.json`
- `data/generated/timetable/jra-planned-program-review.json`
- `data/generated/timetable/local-racing-pilot-review.json`
- `data/archive/timetable/candidates/japan-nar-candidates.v0.json`
- `scripts/timetable/coverage-observation-validation.mjs`
- `scripts/check-calendar-coverage-observation-schema.mjs`
- `scripts/check-calendar-contracts.mjs`
- `scripts/check-calendar-baseline-reconciliation.mjs`
- `scripts/check-calendar-pipeline-v1-release-gate.mjs`
- `scripts/check-calendar-dynamic-dates-release-gate.mjs`
- `scripts/check-calendar-operations-status.mjs`
- `scripts/check-calendar-operations-review-package.mjs`
- `scripts/check-calendar-operations-v1-release-gate.mjs`
- `scripts/check-calendar-banei-retry-queue-state-apply.mjs`
- `scripts/check-calendar-banei-freshness-rollback-operating-evidence.mjs`
- `scripts/check-calendar-banei-bilingual-public-display-qa.mjs`
- `scripts/check-calendar-banei-handoff-decision.mjs`
- `scripts/check-calendar-hkjc-pilot-reconciliation.mjs`
- `scripts/check-jra-pilot-foundation.mjs`
- `scripts/check-jra-planned-intake.mjs`
- `scripts/check-jra-final-confirmation-contract.mjs`
- `scripts/check-jra-final-program-intake-schema.mjs`
- `scripts/check-jra-final-normalized-handoff.mjs`
- `scripts/check-local-racing-pilot-foundation.mjs`
- `scripts/check-authority-source-inventory-schema.mjs`

The Acquisition Control Plane machine-readable Registry, Job, Plan, Result Manifest, Review Queue, and Rank-aware Retry Queue schemas are planned canonical artifacts. Until those schemas are implemented, `docs/calendar/acquisition-control-plane-contract.md` and its implementation plan govern their semantics and implementation order.

`docs/specs/where-horses-run-v0-spec.md` is the historical product baseline. Current contracts and schemas override it where they differ.

## Required PR discipline

Before work begins:

1. assign or confirm the stable Work ID;
2. read the applicable canonical documents;
3. for Calendar work, read `docs/calendar/incremental-coverage-contract.md`, `docs/calendar/acquisition-control-plane-contract.md`, and the applicable machine-readable contract;
4. confirm tracker or registry state;
5. record whether Cloudflare is required.

The same PR must update the relevant tracker, registry, roadmap, contract, runbook, schema, and validator when their state or rule changes.

Every substantive PR records:

```text
Work ID
Programme
Canonical documents reviewed
Tracker or registry changes
Runtime behaviour changes
Public display boundary
Calendar readiness changes
Coverage and completion-claim changes
Deployment and preview requirement
Completion conditions
Next Work ID
```

## Public repository boundary

The public repository may contain reviewed facts, schemas, code, hashes, and public-safe summaries. Raw local captures, credentials, restricted access details, private workflow notes, and prohibited participant or betting data remain outside it.

## Maintenance

- check active roadmaps after every merge;
- update trackers and registries in every relevant PR;
- review canonical links regularly;
- label historical and superseded documents clearly;
- reverify external platform facts before changing operations because of them.
