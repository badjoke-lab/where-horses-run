# Calendar Operations v2 operator view

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

Operations v2 provides one read-only operator view over the Calendar Acquisition Control Plane.

It is an additive v2 layer. It does not replace Operations v1.

Operations v1 remains the lightweight source-readiness and publication-freshness view. Operations v2 adds control-plane visibility over:

```text
planned jobs
queued jobs
running jobs
success / partial / failure
Review Queue
Retry Queue
rank distributions
source health
freshness
promotion state
publication state
```

The operator view summarizes existing machine-readable state. It does not execute work or change data.

## Canonical artifacts

```text
data/static/calendar-operations-v2.schema.json
data/fixtures/calendar-operations-v2-fixtures-v1.json
data/fixtures/calendar-operations-v2-invalid-cases-v1.json
scripts/timetable/operations-v2.mjs
scripts/timetable/build-calendar-operations-v2.mjs
scripts/check-calendar-operations-v2.mjs
.github/workflows/calendar-operations-v2.yml
```

## Additive relationship with Operations v1

Every Operations v2 document carries:

```text
operations_v1_ref: data/generated/timetable/operations-status.json
```

Operations v2 does not redefine the existing Operations v1 source-readiness or public projection status model.

The v2 layer adds cross-control-plane aggregation while keeping the v1 artifact independently readable.

## Inputs

The initial Operations v2 builder consumes:

```text
validated Due-job Plan
runtime Job status records
validated Review Queue
validated Rank-aware Retry Queue
validated Review Cohort Plan
Acquisition Registry
source health/freshness state
publication snapshot
```

All inputs are local repository or workflow artifacts.

Operations v2 performs no network fetch.

## Acquisition state accounting

Initial Job status classes are:

```text
planned
queued
running
success
partial
failure
not_run
```

A Job from the current Due-job Plan without a runtime status remains `planned`.

When a runtime status exists, the Job moves into that status bucket and is not counted twice as planned.

Recent runtime statuses not belonging to the current Due Plan remain visible as recent operational history.

The acquisition summary contains:

```text
job status counts
due plan Job count
recent result count
```

Recent result count closes over:

```text
success + partial + failure
```

## Review Queue summary

The view aggregates Review Queue entries by:

```text
review_ready
reviewing
approved
rejected
```

and promotion state:

```text
not_ready
promotion_ready
promoted
published
```

The view does not change Queue state.

## Retry Queue summary

The view aggregates:

```text
Retry Queue entry count
due-now retry count
deferred retry count
counts by retry reason
```

Due state is calculated against the Operations v2 generation timestamp.

The view does not execute retries and does not enable scheduled retry execution.

## Rank distribution

Operations v2 preserves the aggregate five-rank distribution from Review Queue:

```text
C
B
B+
A
A+
```

Rank counts are also shown per system.

These are observed/review workflow states and do not override the public display boundary.

A+ remains a lightweight programme summary boundary, not a full racecard.

## Promotion summary

The promotion summary contains:

```text
promotion state counts
human-review-required cohort count
Public Ceiling projection required count
```

The human-review count is derived from validated Review Cohorts.

The Public Ceiling dependency count identifies cohorts where technical observation exceeds the active public ceiling and projection review is required before publication.

Operations v2 does not run Promotion Validation.

## Publication summary

The publication summary exposes:

```text
current / stale / unknown state
publication generated timestamp
meeting count
detail count
current-window staleness flag
```

Per-system publication state may differ from the global publication snapshot.

The view does not publish or rebuild public projection data.

## System rows

Every Acquisition Registry system receives exactly one row.

A system row contains:

```text
system identity
authority identity
primary runner
source health
freshness age hours
due Job count
Job status counts
review-ready count
retry-due count
five-rank distribution
promotion state counts
publication state
operator attention markers
```

Operations v2 fails validation if a Registry system is missing from the view.

## Source health and freshness

Initial source health states are:

```text
healthy
degraded
unavailable
unknown
```

Freshness is expressed as integer age hours from the last successful collection timestamp.

When no successful timestamp is known, freshness age is null and the system receives a freshness attention marker.

The view does not infer that an old source is unavailable. Source health and freshness remain separate signals.

## Operator attention markers

Initial markers are:

```text
source_health
freshness
queued_work
running_work
recent_failure
partial_result
review_queue
retry_due
promotion_ready
publication_stale
none
```

`none` is exclusive. It cannot be mixed with another marker.

Markers summarize existing state only. They are not automatic actions.

## Integration fixture

The initial fixture combines:

```text
5 Due-plan Jobs
7 runtime status records
10 Review Queue entries
3 Retry Queue entries
4 Registry systems
source health/freshness state
promotion state
publication state
```

The fixture proves simultaneous visibility of:

```text
planned work
queued work
running work
successful results
partial results
failures
not-run work
review-ready work
promotion-ready work
due retries
deferred retries
source degradation
freshness lag
stale publication
```

The global five-rank fixture distribution is:

```text
C:  40
B:   1
B+:  1
A:   2
A+: 50
```

## Read-only boundary

Every Operations v2 document records:

```text
network_fetch_performed: false
job_execution_performed: false
approval_performed: false
promotion_performed: false
canonical_write_performed: false
public_write_performed: false
publication_performed: false
deployment_performed: false
```

The builder must remain read-only.

## Workflow boundary

The formal workflow validates and builds an Operations v2 JSON artifact.

It uses:

```text
permissions:
  contents: read
```

It may upload the generated status JSON as a workflow artifact.

It must not call:

```text
Actions acquisition runner
local acquisition runner
Promotion Validation
canonical promotion
public projection write
deployment
```

## CLI model

Fixture-backed integration build:

```text
node scripts/timetable/build-calendar-operations-v2.mjs \
  --fixture=data/fixtures/calendar-operations-v2-fixtures-v1.json \
  --output=.calendar-operations-v2.json
```

The CLI builds the required Due Plan and Review Cohort Plan from their validated fixtures, then aggregates the Operations v2 view.

## Invalid combinations rejected

Validation rejects at least:

- network fetch boundary enabled;
- Job execution boundary enabled;
- recent result count drift;
- unsafe Operations v1 reference;
- system authority drift from Registry;
- primary runner drift from Registry;
- unsupported source health state;
- missing Registry system row;
- `none` attention mixed with another marker;
- invalid publication state.

## Public data boundary

Operations v2 contains system and batch-level operational metadata only.

It must not contain:

- raw source bodies or HTML;
- credentials, cookies, tokens, or secrets;
- horse names;
- jockey names;
- trainer names;
- draw or gate positions;
- weights;
- odds;
- betting rank;
- results;
- payouts;
- predictions;
- tips;
- direct stream URLs.

## ACP-15 completion boundary

ACP-15 is complete when the operator view simultaneously shows:

```text
planned work
queued work
running work
success / partial / failure
Review Queue
Retry Queue
five-rank distribution
source health
freshness
promotion state
publication state
per-system attention markers
```

and remains fully read-only.

Operations v2 completes the initial Acquisition Control Plane implementation sequence. Further work may extend real-state ingestion, public-safe operator UI presentation, additional system pilots, and richer maintenance automation without weakening review or publication boundaries.
