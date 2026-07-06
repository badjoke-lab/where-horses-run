# Calendar Coverage Observation schema

Status: active machine-readable contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Last reviewed: 2026-07-06

## Purpose

This document defines the machine-readable observation record used to describe what a Calendar operator attempted, what the official source exposed during that run, and what remains unresolved.

It implements the Coverage Observation concern defined by:

```text
docs/calendar/incremental-coverage-contract.md
```

The schema is:

```text
data/static/calendar-coverage-observation.schema.json
```

The validation implementation is:

```text
scripts/timetable/coverage-observation-validation.mjs
scripts/check-calendar-coverage-observation-schema.mjs
```

## Boundary

A Coverage Observation is operational evidence. It is not:

- a candidate record;
- a canonical meeting record;
- a public timetable record;
- an automatic deletion instruction;
- an automatic rank downgrade instruction;
- proof that a requested date range is complete.

The observation record may describe a successful partial run.

## Required fields

```text
schema_version
run_id
system_id
source_id
checked_at
requested_scope
observed_scope
collection_mode
records_discovered
records_updated
unresolved_dates
unresolved_meeting_ids
source_errors
coverage_claim
completion_audit_ref
```

## Requested scope and observed scope

`requested_scope` records what the operator asked the run to inspect.

`observed_scope` records the source scope that was actually established during that run.

They may differ.

Example:

```text
requested: 2026-07-01 .. 2026-08-01
observed:  2026-07-01 .. 2026-07-15
claim:     partial
```

This is a valid successful observation when the official source currently exposes only the shorter horizon.

## Scope variants

The schema supports:

- `date_window`;
- `single_date`;
- `selected_meetings`;
- `source_visible_horizon`;
- `not_observed`.

`not_observed` is available for a run where the source state could not be established safely. It does not mean no meetings exist.

## Collection modes

```text
date_window
single_date
selected_meetings
source_visible_horizon
```

The modes allow irregular manual operation, overlapping retries, one-date checks, selected-meeting retries, and source-horizon discovery.

## Coverage claims

### `none`

The run makes no coverage conclusion.

Typical use:

- source unavailable;
- parser failure before scope could be established;
- diagnostic run without a coverage claim.

### `partial`

Some valid source coverage was observed, but the requested scope is not claimed complete.

`partial` is a normal successful state.

### `source_window_complete`

Every record exposed by the reviewed source window for that run was processed.

This is not a claim that a whole month or season is complete unless the source window itself has been separately proven to represent that declared scope.

### `audited_complete`

A separate completion audit established completeness for a defined scope.

This claim requires:

- non-null `completion_audit_ref`;
- no unresolved dates;
- no unresolved meeting IDs;
- no source errors.

The audit reference must be a repository path under `data/` or `docs/`.

## Source errors

The v1 error codes are:

```text
source_unavailable
parser_failure
rate_limited
unexpected_response
other
```

Errors are operational observations and do not imply deletion of earlier reviewed meeting data.

## Safety rules

The validation layer rejects prohibited raw or participant/betting-oriented keys, including key fragments associated with:

- raw source bodies or markup;
- horse or runner data;
- jockey or trainer data;
- odds;
- payouts;
- predictions or tips;
- credentials, cookies, or tokens;
- direct stream URLs.

Coverage observations must remain public-safe operational metadata.

## Merge relationship

Coverage Observation does not directly mutate canonical data.

The intended relationship is:

```text
operator run
-> candidate batch
-> batch validation
-> human review
-> promotion validation
-> canonical/public update

parallel from the same run:
coverage observation
-> coverage audit
-> retry targets
-> optional completion audit
```

A later observation with a shorter horizon or less detail must not automatically delete or downgrade earlier reviewed data.

## Implementation sequence

After this schema foundation:

1. integrate Coverage Observation output into the shared operator path;
2. separate shared batch, promotion, coverage, and completion validators;
3. refactor the NAR ordinary operator away from fixed July completion gating;
4. use observations to generate explicit retry targets;
5. continue NAR incremental collection and promotion;
6. apply the same contract to Banei and later systems.
