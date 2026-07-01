# Documentation authority

Status: active canonical governance policy  
Last reviewed: 2026-07-01

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
- `docs/calendar/implementation-roadmap.md`
- `docs/calendar/baseline-reconciliation-map.md`
- `docs/calendar/pipeline-v1-release-gate.md`
- `docs/calendar/dynamic-dates-release-gate.md`
- `docs/calendar/operations-v1-contract.md`
- `docs/calendar/operations-v1-release-gate.md`
- `docs/calendar/jra-pilot-foundation.md`
- `docs/calendar/jra-planned-program-intake.md`
- `docs/calendar/jra-final-confirmation-contract.md`
- `docs/runbooks/calendar-operations-status-review.md`
- `docs/runbooks/calendar-operations-pause-rollback.md`
- `docs/runbooks/calendar-seasonal-rollover.md`
- `docs/runbooks/calendar-source-breakage-escalation.md`
- `docs/specs/global-timetable-architecture.md` plus active addendum
- `docs/specs/authority-source-inventory-schema.md` plus active addendum

Calendar machine-readable contracts:

- `data/static/source-test-v2.schema.json`
- `data/static/calendar-readiness.schema.json`
- `data/static/calendar-readiness-registry.json`
- `data/static/authority-source-inventory.schema.json`
- `data/static/authority-source-inventory.json`
- `data/audits/calendar-baseline-migration-map.json`
- `data/audits/calendar-pipeline-v1-release-gate.json`
- `data/audits/calendar-dynamic-dates-release-gate.json`
- `data/audits/calendar-operations-v1-release-gate.json`
- `data/static/calendar-operations-control.json`
- `data/static/calendar-operations-seasonal-policy.json`
- `data/static/jra-pilot-control.json`
- `data/generated/timetable/operations-status.json`
- `data/generated/timetable/operations-review-package.json`
- `data/generated/timetable/jra-pilot-review.json`
- `data/generated/timetable/jra-planned-program-intake.json`
- `data/generated/timetable/jra-planned-program-review.json`
- `scripts/check-calendar-contracts.mjs`
- `scripts/check-calendar-baseline-reconciliation.mjs`
- `scripts/check-calendar-pipeline-v1-release-gate.mjs`
- `scripts/check-calendar-dynamic-dates-release-gate.mjs`
- `scripts/check-calendar-operations-status.mjs`
- `scripts/check-calendar-operations-review-package.mjs`
- `scripts/check-calendar-operations-v1-release-gate.mjs`
- `scripts/check-jra-pilot-foundation.mjs`
- `scripts/check-jra-planned-intake.mjs`
- `scripts/check-jra-final-confirmation-contract.mjs`
- `scripts/check-authority-source-inventory-schema.mjs`

`docs/specs/where-horses-run-v0-spec.md` is the historical product baseline. Current contracts and schemas override it where they differ.

## Required PR discipline

Before work begins:

1. assign a stable Work ID;
2. read the applicable canonical documents;
3. confirm tracker or registry state;
4. record whether Cloudflare is required.

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
