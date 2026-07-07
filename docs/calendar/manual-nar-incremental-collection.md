# Manual NAR incremental collection

Status: active operator runbook
Primary Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`
NAR maintenance context: `WHR-CAL-JAPAN-NAR-A-PLUS`
Last reviewed: 2026-07-08

## Governing contracts

Read first:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
docs/calendar/nar-monthly-collection-contract.md
```

This runbook defines the NAR v2 source-specific acquisition path.

The July full-month path remains a separate bounded Completion Audit path.

## Current and target runner model

Current implemented state:

```text
primary runner: github_actions
formal workflow_dispatch operation: active
fallback runner: local
immutable review artifact upload: active
scheduled publication: disabled
```

Temporary diagnostic Actions workflows must not be treated as the permanent operating interface.

The Actions primary path and the local fallback path must produce compatible immutable batch semantics and pass the same review, coverage, and promotion boundaries.

No scheduled automatic publication is enabled.

## Purpose

The v2 NAR adapter path supports:

- arbitrary date windows up to 93 days;
- windows that cross month boundaries;
- overlapping retry windows;
- selected-meeting retries;
- irregular operator run dates;
- Schedule Layer observation;
- Detail Layer acquisition;
- Coverage Observation output;
- explicit date and meeting retry targets;
- immutable batch-specific output paths.

Collection does not approve, promote, publish, or write canonical/public data.

## Current NAR source result behavior

The present NAR v2 source path commonly produces:

```text
Schedule-confirmed meeting without complete detail
-> C candidate

complete RaceList/DebaTable detail
-> A+ candidate
```

This is a NAR source-specific observed behavior, not a global Calendar rule.

The shared Acquisition Control Plane remains capable of:

```text
C
B
B+
A
A+
```

If a future NAR adapter or source path safely supports B, B+, or A observations, those ranks must flow through the shared five-rank contract rather than being forced to C or A+.

## Local fallback commands

The local runner remains the fallback and development operator path.

### Date window

```bash
node scripts/timetable/run-nar-incremental-v2-local.mjs \
  --batch-id=nar-window-run-001 \
  --start-date=2026-08-01 \
  --end-date-exclusive=2026-09-01
```

### Cross-month window

```bash
node scripts/timetable/run-nar-incremental-v2-local.mjs \
  --batch-id=nar-cross-month-run-001 \
  --start-date=2026-08-20 \
  --end-date-exclusive=2026-09-11
```

### Selected-meeting retry

```bash
node scripts/timetable/run-nar-incremental-v2-local.mjs \
  --batch-id=nar-selected-retry-001 \
  --meeting-id=nar-monbetsu-racecourse-2026-08-21 \
  --meeting-id=nar-oi-racecourse-2026-08-22
```

Multiple meeting IDs may also be supplied with comma-separated `--meeting-ids=`.

## Formal Actions workflow

The canonical operator entry point is `.github/workflows/calendar-nar-incremental-v2-operator.yml`. It accepts bounded operator inputs equivalent to the local v2 runner and uploads review artifacts without repository writes.

Required input concepts:

```text
batch_id
mode
start_date
end_date_exclusive
meeting_ids
```

Required behavior:

1. validate mutually exclusive scope modes;
2. run the NAR v2 acquisition path;
3. preserve immutable batch-specific outputs;
4. run batch, coverage, responsibility, and runtime-boundary validators;
5. upload review artifacts;
6. expose failure clearly;
7. perform no approval, promotion, canonical write, public write, or deployment.

The formal workflow is active under `WHR-CAL-ACQUISITION-CONTROL-PLANE`. Inputs are validated by `nar-incremental-v2-actions-core.mjs`; the workflow launcher is `run-nar-incremental-v2-actions.mjs`; the operator contract is checked by `check-calendar-nar-incremental-v2-actions-operator.mjs`.

## Batch identity rule

Every v2 run requires a unique lowercase kebab-case `batch_id`.

The batch ID is part of the output path. Once written, that batch path is immutable.

Use a new batch ID for every regular refresh or retry.

Example:

```text
nar-august-run-001
nar-august-retry-002
nar-selected-retry-003
```

This prevents a later run from overwriting evidence already pinned by a review decision.

## Scope rule

A run uses exactly one scope mode.

Current NAR v2 modes:

```text
date_window
selected_meetings
```

Do not combine a date window and selected meeting IDs in one run.

Date-window semantics are:

```text
start_date <= meeting.date < end_date_exclusive
```

The ordinary date-window path is bounded to at most 93 days per run.

## One run, two source responsibilities

The NAR v2 operator combines two logical source layers without flattening them:

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

The Detail Layer uses the NAR RaceList and DebaTable acquisition path and emits A+ only when all required approved timetable fields are complete.

A meeting must not appear simultaneously as both an A+ detail candidate and a C schedule candidate in the same date-window batch.

## Schedule candidate states

Schedule-confirmed meetings without usable A+ detail use rank C and one of these current NAR states:

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

The old fixed-path v1 artifacts remain historical evidence for the reviewed July 5–7 batch. Future ordinary runs must use v2 immutable batch paths rather than overwrite the v1 files.

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

When the Schedule source is successfully observed for the requested date window, schedule coverage may be:

```text
coverage_claim: source_window_complete
```

while individual meetings remain in `unresolved_meeting_ids` because timetable detail is pending.

```text
Schedule coverage complete
!=
Detail coverage complete
```

A source or parser failure may instead produce:

```text
coverage_claim: partial
unresolved_dates: [...]
unresolved_meeting_ids: [...]
source_errors: [...]
```

Valid higher-rank candidates elsewhere in the batch are not invalidated by unrelated unresolved detail.

## Retry targets and future rank-aware queue

The current NAR v2 retry artifact mirrors unresolved coverage state:

```text
date_targets
meeting_targets
reason_counts
```

Current retry execution is operator-triggered and irregular.

```text
scheduled_retry: disabled
canonical_write: disabled
public_write: disabled
```

Selected-meeting retry directly targets known stable meeting IDs. When current Schedule observation does not reconfirm a selected meeting and detail fetch also fails, the reconciliation layer keeps that ID and date in retry targets rather than dropping it.

The future shared Rank-aware Retry Queue will add:

```text
current_reviewed_rank
latest_observed_rank
collection_target_rank
missing_fields
retry_reason
runner/adapter profile
backoff metadata
attempt history
```

NAR must integrate with that shared queue rather than maintain a permanently separate retry model.

## Overlap and merge rule

Overlapping windows are allowed.

Within one batch, stable meeting identities must be unique. Exact duplicate evidence collapses deterministically; conflicting duplicate content must fail.

Across batches, promotion remains monotonic.

Examples:

```text
existing C + reviewed A+ detail -> promote to A+
existing A+ + later C observation -> keep A+
```

The shared model also permits B/B+/A transitions where future NAR evidence supports them.

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
scripts/check-calendar-nar-incremental-v2-actions-operator.mjs
```

Current synthetic cases cover:

- immutable batch paths;
- Schedule-to-C candidate flow;
- available Detail-to-A+ flow;
- future detail pending;
- past detail retry;
- selected-meeting retry preservation.

The shared control-plane programme will add common five-rank classifier tests outside the source-specific NAR validator.

## Publication boundary

Ordinary collection must not write:

```text
data/generated/timetable/canonical/**
data/generated/timetable/public/**
src/**
```

It must not perform approval, promotion, public projection, Cloudflare deployment, or unattended publication.

The safe flow is:

```text
NAR collection
-> immutable review batch
-> Batch Validation
-> Review Queue
-> human review
-> Promotion Validation
-> canonical update
-> public projection

parallel:
Coverage Observation
-> Coverage Audit
-> Rank-aware Retry Queue

separate only when claimed:
Completion Audit
```

## Current repository position

Reviewed NAR schedule coverage through 2026-07-31 is promoted and projected. The July 8–31 published batch contains:

```text
schedule-confirmed meetings: 82
A+ detail candidates:         11
C schedule candidates:        71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
```

The 11 A+ meetings are detail-complete. The 71 C meetings are published schedule identities and remain explicit detail-retry targets.

Current handoff:

```text
primary hosted runner active
-> local fallback retained
-> Acquisition Registry current
-> Job / Plan / Review Queue / Retry Queue integration next
```

## Relationship to v1, legacy monthly, and July Completion Audit

The old fixed-path v1 incremental artifacts are historical evidence for the reviewed July 5–7 collection and must not be overwritten.

`manual-nar-monthly-collection.md` documents the legacy monthly compatibility path.

The July full-month collector and validator remain available only for the explicit July Completion Audit claim. They are not ordinary batch gates and must not block unrelated valid partial promotion.
