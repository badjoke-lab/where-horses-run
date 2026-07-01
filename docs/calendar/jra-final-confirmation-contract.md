# JRA final-program confirmation contract

Status: implemented foundation  
Work ID: `WHR-CAL-JAPAN-JRA`  
Implemented: 2026-07-01

## Purpose

The JRA planned-program intake cannot generate a Pipeline v1 candidate. Candidate generation becomes possible only after a separate final-program fixture is reviewed after the official confirmation window.

```text
planned-program intake
+ final-program intake
+ JRA pilot control
+ Authority/Source and Calendar Readiness
-> deterministic final confirmation review
-> human approval
-> candidate generation permission
```

This contract does not fetch a final programme and does not claim that one is available before the official publication window.

## Final intake contract

A final fixture must use:

```text
schema_version: jra-final-program-intake-v1
source_stage: final_program
```

It must retain the canonical JRA source and system identity, use an allowed official JRA host, contain valid meeting and timetable rows, remain within reviewed racecourse scope, and have a source check date on or after the canonical registry minimum.

The final fixture timestamp must be on or after the planned intake's `final_confirmation_after` value.

## Human review

Final source timing and structural validity do not approve the fixture.

Candidate generation requires:

```text
review.status: approved
review.reviewer: non-empty human reviewer
review.reviewed_at: on or after final fixture generation
```

A final fixture with `needs_review` remains blocked by `human_review_required`.

## Planned/final comparison

The confirmation review compares:

- meeting IDs added or removed;
- country, authority, system, racecourse, date, and timezone identity;
- first and last race times;
- each timetable-row label and post time;
- optional programme fields when present.

A reviewed difference is not automatically an error. It is recorded so the human reviewer can confirm the final programme before candidate generation.

## Blockers

The core may return:

- `source_stage_not_final`;
- `final_confirmation_too_early`;
- `source_fixture_predates_registry`;
- `final_program_structure_invalid`;
- `human_review_required`;
- `review_predates_final_fixture`.

Candidate generation is permitted only when the blocker list is empty.

## Boundary

The confirmation core is pure. It does not:

- fetch JRA pages;
- store source bodies;
- generate or approve candidates;
- write canonical meetings or details;
- write public projection files;
- activate scheduling;
- publish.

The output is a review decision object only.

## Validation

```text
node scripts/check-jra-final-confirmation-contract.mjs
```

The validator covers planned-stage input, pre-cutoff final input, final input awaiting review, approved final input, reviewed time changes, invalid host/system scope, stale source checks, and review timestamps earlier than the final fixture.

All fixtures are created in memory. No fabricated final JRA source file is committed.

## Next action

After the official final programme is available, create a reviewed `jra-final-program-intake-v1` artifact, run this confirmation contract, and generate a Pipeline v1 candidate only when the blocker list is empty.
