# Calendar pipeline v1 — candidate contract

Status: implemented foundation  
Work ID: `WHR-CAL-PIPELINE-V1`  
Implemented: 2026-07-01

## Purpose

This contract creates one bounded envelope between source extraction and human review. Adapters and reviewed manual import tools may produce candidates. They do not write canonical or public timetable data.

```text
official source or reviewed snapshot
-> adapter/manual import
-> timetable-candidate-v1
-> deterministic validation
-> human review
-> later promotion stage
```

## Contract files

```text
data/static/timetable-candidate-v1.schema.json
src/lib/timetable/pipelineTypes.ts
data/candidates/pipeline-v1.sample.json
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
```

The sample is a contract fixture with `needs_review` status. It is not an approved record and is not read by public pages.

## Rank-specific limits

- **C:** meeting date and racecourse only; no first/last time and no timetable rows.
- **B:** first race time only; no last time and no timetable rows.
- **B+:** first and last race times only; no timetable rows.
- **A:** race label and post time rows only.
- **A+:** A fields plus the permitted programme-summary fields: race name, distance, surface, and course label.

A/A+ candidates remain candidates. Their existence does not raise a source's reviewed Technical Rank, Public Ceiling, Calendar Readiness, or public output.

## Safety rules

The validator rejects unsupported fields and forbidden participant, betting, result, payout, prediction, raw-source, and stream fields. The safety policy requires:

```text
store_source_body: false
store_raw_markup: false
publish_without_review: false
allowed_output: meeting_and_timetable_summary_only
```

The validator also enforces:

- stable kebab-case IDs;
- candidate-window date bounds;
- envelope/record country, authority, source, and timezone consistency;
- rank-specific time and row limits;
- HTTPS official-source links;
- unique candidate and meeting/source keys;
- human-review metadata consistency;
- no approval claim without reviewer, review time, and promotion target.

## Migration rule

Existing `timetable-candidates-v0` files and generators remain transitional evidence. They are not silently re-labelled as v1. Each source generator must be migrated and validated against this contract in its own reviewed change.

## Next Pipeline v1 slice

Implement a single human-controlled promotion path that consumes approved v1 candidates, writes canonical meeting data idempotently, and never writes public JSON directly. Public projection remains a separate deterministic stage.
