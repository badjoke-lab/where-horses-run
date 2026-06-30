# Calendar pipeline v1 — JRA reference candidate adapter

Status: implemented foundation  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01

## Purpose

JRA is the first source path migrated to `timetable-candidate-v1`.

```text
reviewed JRA normalized data
-> candidate v1 adapter
-> needs_review candidate
-> human review
-> canonical promotion
-> separate public projection
```

The adapter generates candidates only. It does not approve, promote, schedule, or publish them.

## Inputs

```text
data/generated/timetable/jra-normalized-timetable.json
data/generated/timetable/jra-normalized-meeting-details.json
data/static/calendar-readiness-registry.json
```

The meeting and detail files must use their expected schemas, share one deterministic timestamp and refresh window, and contain matching meeting IDs.

The Calendar Readiness record supplies the canonical source/system identity, Technical Rank, racecourse scope, and confirmed field set.

## Output

```text
data/candidates/japan-jra-candidates.json
```

```text
schema_version: timetable-candidate-v1
adapter_id: jra-normalized-programme-candidate-v1
country_id: japan
authority_id: jra
source_id: jra-programme
racing_system_id: japan-jra-system
review.status: needs_review
promotion_target: null
```

The current fixture window contains Tokyo and Hanshin meetings for June 6–7, 2026.

All four candidates retain reviewed Technical Rank A+ and complete race-label/post-time rows. Optional programme fields are copied only when the matching Calendar Readiness `confirmed_fields` value is true. Other normalized values become `null` before review.

The JRA Public Ceiling remains A and is enforced by public projection, not candidate generation.

## Commands

```text
npm run generate:japan-jra-candidates
npm run generate:japan-jra-candidates -- --check
npm run validate:japan-jra-candidate-generator
```

## Validation

The dedicated checks prove:

- deterministic output;
- matching normalized meeting/detail records;
- stable IDs and canonical source identity;
- field filtering by Calendar Readiness;
- `needs_review` state;
- successful in-memory canonical promotion after test approval;
- no canonical or public output write by the adapter;
- successful runtime-boundary validation and site build.

## Operational boundary

This is a reference adapter, not an active scheduler. Live refresh, stale handling, generated update PRs, pause, and rollback remain later pilot/operations work.

## Next Pipeline v1 slice

Use the JRA adapter as the source-specific template or consolidate the grouped Pipeline v1 release gate before dynamic dates.
