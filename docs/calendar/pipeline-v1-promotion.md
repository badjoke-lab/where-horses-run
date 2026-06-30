# Calendar pipeline v1 — canonical promotion

Status: implemented foundation  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01

## Purpose

This stage is the only Pipeline v1 path from an approved `timetable-candidate-v1` file into canonical timetable data.

```text
approved candidate
-> authority/source and Calendar Readiness checks
-> rank and confirmed-field checks
-> identity and provenance checks
-> idempotent canonical meeting merge
-> idempotent canonical detail merge/removal
```

It does not write public JSON. Public projection remains a separate deterministic stage.

## Command

```text
npm run promote:timetable -- --input data/candidates/<approved-file>.json
```

Review without writing:

```text
npm run promote:timetable -- --input data/candidates/<approved-file>.json --dry-run
```

Verify that committed canonical output already matches an approved candidate:

```text
npm run promote:timetable -- --input data/candidates/<approved-file>.json --check
```

The command accepts candidate files only from `data/candidates/` and writes only:

```text
data/generated/timetable/canonical/meetings.json
data/generated/timetable/canonical/meeting-details.json
```

## Approval gate

Promotion requires all of the following:

- envelope status is `approved`;
- every record status is `approved`;
- reviewer is non-empty;
- review timestamp is valid and not earlier than generation/source checks;
- promotion target is exactly `canonical-timetable-v0`;
- at least one candidate record exists.

`needs_review`, `rejected`, mixed-review, incomplete approval metadata, and other promotion targets are rejected.

## Canonical registry gate

The candidate envelope must match exactly one record in each canonical registry:

```text
data/static/authority-source-inventory.json
data/static/calendar-readiness-registry.json
```

The writer verifies:

- country, authority, and official source identity;
- racing system identity;
- official-source hostname;
- reviewed racecourse scope when explicit racecourse IDs exist;
- non-blocked Authority/Source candidate status;
- readiness is `ready`, `prototype_ready`, or `manual_ready`;
- automation is not blocked, link-only, or not-applicable;
- source status is not unavailable or unverified;
- candidate source check is not older than the reviewed registry state.

## Rank and field gate

Candidate rank must not exceed either the Authority/Source capability rank or Calendar Readiness Technical Rank.

The writer also checks reviewed field availability:

- C requires confirmed meeting date and racecourse;
- B additionally requires confirmed first race time;
- B+ additionally requires confirmed last race time;
- A/A+ additionally require confirmed per-race post times;
- optional A+ race name, distance, surface, and course values are accepted only when the matching `confirmed_fields` flag is true.

Public Ceiling is not raised here. It remains enforced by the later public-projection stage.

## Idempotency and identity

The canonical key is `meeting_id`.

Applying the same approved candidate repeatedly produces byte-equivalent canonical objects. Existing meetings may be replaced only when country, authority, racecourse, date, and timezone identity remain unchanged.

A reviewed lower-rank replacement removes a stale A/A+ meeting-detail record when the new canonical meeting no longer contains per-race rows.

## Provenance

Promoted canonical records preserve:

- source ID and official URL;
- source status from the Authority/Source inventory;
- extraction-method mapping;
- candidate input path;
- source checked time;
- reviewer and review time in freshness notes;
- candidate notes.

The canonical dataset `generated_at` value is the human review timestamp, not the wall-clock execution time. This keeps repeated promotion deterministic.

## Public boundary

The promotion core is pure and performs no file writes. The CLI performs atomic replacement of the two canonical files only.

The validator proves that:

- public meeting-list and meeting-detail JSON hashes do not change;
- the CLI contains no public output path;
- the core contains no filesystem write operation;
- forbidden or unconfirmed fields are rejected before canonical output.

## Transitional code

`scripts/promote-timetable-candidates.mjs` remains a legacy v0 overlay tool. It is not the Pipeline v1 canonical writer and must not be used as a substitute for this stage.

Source-specific v0 candidate generators must be migrated to `timetable-candidate-v1` before using this promotion path.

## Next Pipeline v1 slice

Implement deterministic public projection from canonical meeting/detail datasets plus publication policy. That stage must enforce Public Ceiling and must not read candidates or source snapshots directly.
