# Calendar pipeline v1 — canonical promotion

Status: implemented foundation with incremental rank guard  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01  
Rank guard reviewed: 2026-07-06

## Purpose

This stage is the normal Pipeline v1 path from an approved `timetable-candidate-v1` file into canonical timetable data.

```text
approved candidate
-> authority/source and Calendar Readiness checks
-> rank and confirmed-field checks
-> identity and provenance checks
-> normal rank-regression guard
-> idempotent canonical meeting/detail merge
```

It does not write public JSON. Public projection remains a separate deterministic stage.

Validation responsibility is governed by:

```text
docs/calendar/validation-responsibility-contract.md
data/static/calendar-validation-responsibilities-v1.json
```

## Ordinary command

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

The ordinary CLI accepts candidate files only from `data/candidates/` and writes only:

```text
data/generated/timetable/canonical/meetings.json
data/generated/timetable/canonical/meeting-details.json
```

The ordinary CLI is normal-mode only. It does not expose corrective downgrade mode.

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

## Normal promotion rank rule

Normal promotion is monotonic with respect to reviewed meeting rank.

Allowed examples:

```text
C -> B
B -> B+
B+ -> A
A -> A+
A+ -> A+
```

Rejected in normal promotion:

```text
A+ -> A
A+ -> C
A -> B+
B+ -> B
```

A later lower-detail source observation is not an instruction to discard previously reviewed detail.

The ordinary CLI cannot request downgrade mode.

## Corrective downgrade rule

A downgrade is permitted only through explicit core mode:

```text
corrective_downgrade
```

and one allowed reviewed reason:

```text
official_correction
discovered_data_error
source_invalidation
publication_policy_change
rollback
```

Corrective mode requires at least one actual rank regression. It remains canonical-only and does not write public projection data.

The ordinary promotion CLI does not expose this mode. A future corrective operator must be separately controlled and reviewed rather than inferred from an ordinary lower-rank candidate.

## Idempotency and identity

The canonical key is `meeting_id`.

Applying the same approved candidate repeatedly produces byte-equivalent canonical objects. Existing meetings may be updated only when country, authority, racecourse, date, and timezone identity remain unchanged.

In normal mode, lower-rank replacement is rejected before canonical output is produced.

In explicit corrective mode, a downgrade below A removes the stale A/A+ meeting-detail record and reports both the downgraded meeting ID and removed detail ID.

## Provenance

Promoted canonical records preserve:

- source ID and official URL;
- source status from the Authority/Source inventory;
- extraction-method mapping;
- candidate input path;
- source checked time;
- reviewer and review time in freshness notes;
- candidate notes.

The canonical dataset `generated_at` value is the human review timestamp, not wall-clock execution time. This keeps repeated promotion deterministic.

## Public boundary

The promotion core is pure and performs no file writes. The ordinary CLI performs atomic replacement of the two canonical files only.

The validator proves that:

- public meeting-list and meeting-detail JSON hashes do not change;
- the ordinary CLI contains no public output path;
- the ordinary CLI does not expose corrective downgrade mode;
- the core contains no filesystem write operation;
- forbidden or unconfirmed fields are rejected before canonical output;
- normal rank regression is rejected;
- corrective downgrade requires explicit mode and an allowed reason.

## Transitional code

`scripts/promote-timetable-candidates.mjs` remains a legacy v0 overlay tool. It is not the Pipeline v1 canonical writer and must not be used as a substitute for this stage.

Source-specific v0 candidate generators must be migrated to `timetable-candidate-v1` before using this promotion path.

## Current follow-up

The next shared Calendar implementation step is NAR ordinary-operator refactoring under the four validation responsibilities:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

The NAR July full-month validator remains a completion-audit path and must not become an ordinary partial-promotion gate.
