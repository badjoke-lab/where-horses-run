# JRA final-program intake schema

Status: implemented foundation  
Work ID: `WHR-CAL-JAPAN-JRA`  
Implemented: 2026-07-01

## Purpose

A JRA final-program fixture must pass a closed machine-readable input contract before final confirmation, normalized handoff, or candidate generation.

The contract prevents an arbitrary JSON object or a copied official page body from entering the Calendar pipeline.

## Schema

```text
data/static/jra-final-program-intake.schema.json
```

Schema version:

```text
jra-final-program-intake-v1
```

The schema uses JSON Schema 2020-12 and rejects additional properties at the top level, meeting-record, timetable-row, source, review, and boundary levels.

## Required state

A final intake must declare:

- Work ID `WHR-CAL-JAPAN-JRA`;
- `source_stage: final_program`;
- a valid generation timestamp;
- the official confirmation cutoff inherited from the planned intake;
- `promotion_eligible: false`;
- `needs_review` or `approved` review state;
- at least one JRA meeting record;
- all safety boundaries set to false.

An approved input requires a non-empty reviewer and a valid review timestamp. A `needs_review` input requires both values to remain null.

## Meeting and timetable rules

Each record is limited to JRA identity, racecourse, date, timezone, first/last scheduled times, timetable rows, and official source metadata.

- country must be Japan;
- authority must be JRA;
- system must match JRA pilot control;
- timezone must be `Asia/Tokyo`;
- source stage remains `final_program`;
- meeting and racecourse IDs use stable lowercase IDs;
- dates and times must be real and correctly formatted;
- race labels must run continuously from `Race 1`;
- first and last meeting times must match the first and last timetable rows;
- meeting IDs must be unique;
- source host must be an allowed official JRA host;
- acquisition method must identify a reviewed final-program fixture.

## Allowed row fields

A row may contain only:

- race label;
- scheduled post time;
- race name;
- distance;
- surface;
- course label.

Optional programme fields may be null. Their later candidate and public treatment remains governed by Calendar Readiness, Technical Rank, and Public Ceiling.

## Rejected input

The validator rejects unexpected keys and prohibited participant, wagering, result, prediction, raw-source, credential, and direct-media fields. It also rejects any boundary that claims a source body, participant detail, wagering detail, result detail, generated candidate, canonical write, or public write was stored or performed.

These restrictions preserve the rule that JRA public output remains capped at A unless separately reviewed, and that list pages remain one meeting per row. The final intake is not a racecard or source archive.

## Runtime integration

`jra-final-confirmation-core.mjs` calls the final-intake validator before cutoff, freshness, comparison, and human-approval logic.

Structurally invalid input throws immediately. A structurally valid final fixture may still be blocked by confirmation timing, registry freshness, human review, or a later handoff gate.

## Validation

```text
node scripts/check-jra-final-program-intake-schema.mjs
node scripts/check-jra-final-confirmation-contract.mjs
node scripts/check-jra-final-normalized-handoff.mjs
```

The dedicated validator covers valid `needs_review` and approved fixtures plus invalid schema, Work ID, stage, timestamps, review metadata, duplicate IDs, impossible dates, discontinuous rows, time mismatches, source identity, extra keys, prohibited keys, and boundary violations.

## Current state

No actual `data/generated/timetable/jra-final-program-intake.json` file is committed. The schema foundation does not claim that the official final programme is already available or reviewed.
