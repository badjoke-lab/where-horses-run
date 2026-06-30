# Calendar pipeline v1 — JRA reference candidate adapter

Status: implemented foundation  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01

## Purpose

JRA is the first source path migrated to the shared `timetable-candidate-v1` boundary.

The adapter does not fetch live pages itself and does not write canonical or public timetable data. It converts the reviewed normalized JRA programme outputs into a bounded candidate file for human review.

```text
reviewed JRA official-programme snapshot/parser
-> normalized JRA meeting and detail JSON
-> JRA candidate v1 adapter
-> needs_review candidate file
-> human review
-> canonical promotion
-> separate public projection
```

## Inputs

```text
data/generated/timetable/jra-normalized-timetable.json
data/generated/timetable/jra-normalized-meeting-details.json
```

Both inputs must:

- use their expected JRA normalized schemas;
- share the same deterministic `generated_at` value;
- share the same refresh window;
- contain one matching detail record for every meeting;
- contain at least one timetable row for every A/A+ meeting.

The adapter does not read legacy `data/generated/timetables.json`, canonical data, public JSON, candidates from another source, or raw source bodies.

## Output

```text
data/candidates/japan-jra-candidates.json
```

The output uses:

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

The current fixture window contains four reviewed normalized meetings:

- Tokyo — 2026-06-06;
- Hanshin — 2026-06-06;
- Tokyo — 2026-06-07;
- Hanshin — 2026-06-07.

All four are A+ technical candidates containing race labels, post times, race names, distance, surface, and course labels. Candidate rank does not raise public output. The current JRA Public Ceiling remains A and is enforced only by the deterministic public-projection stage.

## Command

Generate:

```text
npm run generate:japan-jra-candidates
```

Verify committed output:

```text
npm run generate:japan-jra-candidates -- --check
npm run validate:japan-jra-candidate-generator
```

## Safety and ownership

The adapter writes one candidate file only. It does not:

- approve candidates;
- write canonical meetings or meeting details;
- write public meeting-list or meeting-detail JSON;
- change Authority/Source or Calendar Readiness records;
- change Technical Rank or Public Ceiling;
- schedule itself;
- publish directly.

The candidate envelope and each record remain `needs_review` until an explicit human review records reviewer, review timestamp, and canonical promotion target.

## Validation

The dedicated validator proves:

- deterministic output matches the normalized inputs;
- every meeting/detail pair is complete and uniquely keyed;
- source, authority, system, timezone, dates, first/last times, and row counts agree;
- candidate output uses the canonical JRA source identity;
- the generator has no legacy, canonical, or public data dependency;
- an in-memory approved copy passes the shared canonical promotion gates;
- no public JSON changes during generation or validation;
- the production runtime remains public-projection-only.

## Operational boundary

This adapter is a reference implementation, not an active scheduler. The existing normalized JRA inputs remain reviewed fixture/state data. Live source refresh, stale handling, generated update PRs, pause, and rollback belong to `WHR-CAL-OPS-V1` and the later JRA pilot activation.

## Next Pipeline v1 slice

Use this adapter as the template for another reviewed source path or consolidate the shared adapter/generator validation into the grouped Pipeline v1 release gate before moving to dynamic dates.
