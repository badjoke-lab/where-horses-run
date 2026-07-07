# Manual NAR incremental collection

Status: active operator runbook  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Last reviewed: 2026-07-07

## Governing contracts

Read first:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/nar-monthly-collection-contract.md
```

This runbook defines the ordinary NAR local update path. The July full-month path remains a separate bounded Completion Audit path.

## Purpose

The v2 operator supports:

- arbitrary date windows up to 93 days;
- windows that cross month boundaries;
- overlapping retry windows;
- selected-meeting retries;
- irregular operator run dates;
- Schedule Layer observation and C candidate creation;
- Detail Layer acquisition and direct A+ candidate creation;
- Coverage Observation output;
- explicit date and meeting retry targets;
- immutable batch-specific output paths.

Collection does not approve, promote, publish, schedule later retries, or write canonical/public data.

## Normal operating location

Ordinary collection is run manually on the operator's local checkout.

GitHub Actions is not the normal acquisition environment. A temporary Actions harness may be used only as a bounded diagnostic or migration aid when the current execution environment cannot reach the official source. Such a harness must not be merged into the normal production workflow.

No scheduled automatic collection or retry is enabled.

## Local commands

### July 8–31 window

```bash
node scripts/timetable/run-nar-incremental-v2-local.mjs \
  --batch-id=july-2026-08-through-31-run-001 \
  --start-date=2026-07-08 \
  --end-date-exclusive=2026-08-01
```

### Cross-month window

```bash
node scripts/timetable/run-nar-incremental-v2-local.mjs \
  --batch-id=july-august-overlap-run-001 \
  --start-date=2026-07-20 \
  --end-date-exclusive=2026-08-10
```

### Selected-meeting retry

```bash
node scripts/timetable/run-nar-incremental-v2-local.mjs \
  --batch-id=selected-retry-run-001 \
  --meeting-id=nar-monbetsu-racecourse-2026-07-21 \
  --meeting-id=nar-oi-racecourse-2026-07-22
```

Multiple meeting IDs may also be supplied with comma-separated `--meeting-ids=`.

## Batch identity rule

Every v2 run requires a unique lowercase kebab-case `--batch-id`.

The batch ID is part of the output path. Once written, that batch path is immutable: the operator must create a new batch ID for another run or retry.

This prevents a later local collection from overwriting evidence already pinned by a review decision.

## Scope rule

A run uses exactly one mode:

```text
date_window
or
selected_meetings
```

Do not combine a date window and selected meeting IDs in one run.

Date-window semantics are:

```text
start_date <= meeting.date < end_date_exclusive
```

The ordinary date-window path is bounded to at most 93 days per run.

## One local run, two source responsibilities

The v2 operator combines the two logical source layers without flattening them:

```text
requested scope
    ↓
Monthly Schedule Layer
    ↓
known racecourse/date meeting identities
    │
    ├─ Detail available and A+ complete
    │      ↓
    │   A+ detail candidate
    │
    └─ Detail not yet safely available
           ↓
        C schedule candidate
        + pending/retry state
```

The Schedule Layer uses the monthly schedule grid, including schedule marker cells. It is not limited to meetings that already expose a usable RaceList detail link.

The Detail Layer uses the NAR RaceList and DebaTable acquisition path and emits A+ only when all six approved timetable fields are complete.

A meeting must not appear simultaneously as both an A+ detail candidate and a C schedule candidate in the same date-window batch.

## Schedule candidate states

Schedule-confirmed meetings without usable A+ detail use rank C and one of these states:

```text
scheduled_pending_details
detail_retry_required
```

`scheduled_pending_details` is used when a meeting is in the future relative to the run's Asia/Tokyo checked date. Future detail absence is not itself a source error.

`detail_retry_required` is used for a past/current schedule-confirmed meeting whose detail acquisition did not complete safely. The corresponding blocker/error remains explicit.

## Detail candidate rule

A+ detail candidates require all approved fields for every race row:

```text
label
post_time_local
race_name
distance_m
surface
course_label
```

An incomplete meeting is not silently promoted as A+.

## Immutable v2 outputs

For batch ID `<batch-id>`:

```text
data/candidates/nar-incremental-batches/<batch-id>/batch.json

data/generated/timetable/nar-incremental-batches/<batch-id>/collection-report.json
data/generated/timetable/nar-incremental-batches/<batch-id>/coverage-observation.json
data/generated/timetable/nar-incremental-batches/<batch-id>/retry-targets.json
```

The old fixed-path v1 artifacts remain historical evidence for the already reviewed July 5–7 batch. Future ordinary runs must use v2 immutable batch paths rather than overwrite the v1 files.

## Candidate boundary

Every v2 batch remains review-only:

```text
review.status: needs_review
review.promotion_eligible: false
review.canonical_write: disabled
review.public_write: disabled
review.raw_source_storage: disabled
```

A successful collection run is not approval and is not publication.

## Coverage Observation

The batch records requested and observed scope separately.

When the schedule source is successfully observed for the requested date window, schedule coverage may be:

```text
coverage_claim: source_window_complete
```

while individual meetings still remain in `unresolved_meeting_ids` because their timetable details are pending.

This distinction is intentional:

```text
Schedule coverage complete
≠
Detail coverage complete
```

A source or parser failure may instead produce:

```text
coverage_claim: partial
unresolved_dates: [...]
unresolved_meeting_ids: [...]
source_errors: [...]
```

Valid A+ candidates elsewhere in the batch are not invalidated by unrelated unresolved detail.

## Retry targets

The retry artifact mirrors unresolved coverage state:

```text
date_targets
meeting_targets
reason_counts
```

Retry execution remains manual and irregular:

```text
scheduled_retry: disabled
canonical_write: disabled
public_write: disabled
```

Selected-meeting retry directly targets known stable meeting IDs. When current schedule observation does not reconfirm a selected meeting and detail fetch also fails, the reconciliation layer keeps that ID and date in retry targets rather than dropping it.

## Overlap and merge rule

Overlapping windows are allowed.

Within one batch, stable meeting identities must be unique. Exact duplicate evidence collapses deterministically; conflicting duplicate content must fail.

Across batches, promotion remains monotonic:

```text
existing C + reviewed A+ detail -> promote to A+
existing A+ + later C observation -> keep A+
```

Absence in a later run is not deletion, cancellation, or rank downgrade.

## Validation

The local v2 operator runs:

```text
scripts/check-calendar-nar-incremental-core.mjs
scripts/check-calendar-nar-incremental-v2.mjs
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
scripts/check-calendar-runtime-import-boundary.mjs
```

Dedicated CI also validates:

```text
scripts/check-calendar-nar-incremental-v2-core.mjs
```

This fixes synthetic cases for:

- immutable batch paths;
- Schedule-to-C candidate flow;
- available Detail-to-A+ flow;
- future detail pending;
- past detail retry;
- selected-meeting retry preservation.

## Publication boundary

Ordinary collection must not write:

```text
data/generated/timetable/canonical/**
data/generated/timetable/public/**
src/**
```

It must not perform promotion, public projection, Cloudflare deployment, scheduled retry, or unattended publication.

The safe flow remains:

```text
local Schedule + Detail collection
-> immutable review batch
-> Batch Validation
-> human review
-> Promotion Validation
-> canonical update
-> public projection

parallel:
Coverage Observation
-> Coverage Audit
-> retry targets

separate only when claimed:
Completion Audit
```

## Relationship to v1, legacy monthly, and July completion audit

The old fixed-path v1 incremental artifacts are historical evidence for the reviewed July 5–7 collection and must not be overwritten.

`manual-nar-monthly-collection.md` documents the legacy monthly compatibility path.

The July full-month collector and validator remain available only for the explicit July Completion Audit claim. They are not ordinary batch gates and must not block unrelated valid partial promotion.
