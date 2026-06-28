# Documentation authority

Status: active canonical governance policy  
Work ID: `WHR-GOV-ROADMAP-01`  
Last reviewed: 2026-06-28

## Authority order

When repository documents conflict, use this order:

1. active contracts and machine-readable schemas;
2. `docs/project-roadmap.md`;
3. active programme roadmaps;
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

- `docs/country-pages/programme-roadmap.md`
- `docs/country-pages/completion-contract.md`
- `docs/country-pages/98-country-tracker.tsv`

Calendar:

- `docs/calendar/source-test-v2-contract.md`
- `docs/calendar/calendar-readiness-contract.md`
- `docs/calendar/implementation-roadmap.md`
- `docs/specs/global-timetable-architecture.md`
- adopted machine-readable timetable and readiness schemas

`docs/specs/where-horses-run-v0-spec.md` is the historical product baseline. Current contracts and schemas override it where they differ.

## Required PR discipline

Before work begins:

1. assign a stable Work ID;
2. read the applicable canonical documents;
3. confirm tracker or registry state;
4. record whether Cloudflare is required.

The same PR must update the relevant tracker, registry, roadmap, contract, runbook, and validator when their state or rule changes.

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

The public repository may contain reviewed facts, schemas, code, hashes, and public-safe summaries. Raw local captures, credentials, restricted access details, private workflow notes, and prohibited race participant or betting data remain outside it.

## Maintenance

- check active roadmaps after every merge;
- update trackers and registries in every relevant PR;
- review canonical links regularly;
- label historical and superseded documents clearly;
- reverify external platform facts before changing operations because of them.
