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

This runbook defines the ordinary NAR update path. The July full-month path remains a separate bounded Completion Audit path.

## Purpose

The operator supports:

- arbitrary date windows up to 93 days;
- windows that cross month boundaries;
- overlapping retry windows;
- selected-meeting retries;
- irregular operator run dates;
- partial source-visible horizons;
- Coverage Observation output;
- explicit date and meeting retry targets.

Collection does not approve, promote, publish, or schedule later retries.

## Local command

Date-window collection:

```bash
node scripts/timetable/run-nar-incremental-local.mjs \
  --start-date=2026-07-01 \
  --end-date-exclusive=2026-08-01
```

Cross-month window:

```bash
node scripts/timetable/run-nar-incremental-local.mjs \
  --start-date=2026-07-20 \
  --end-date-exclusive=2026-08-10
```

Selected-meeting retry:

```bash
node scripts/timetable/run-nar-incremental-local.mjs \
  --meeting-id=nar-monbetsu-racecourse-2026-07-21 \
  --meeting-id=nar-oi-racecourse-2026-07-22
```

Multiple selected meeting IDs may also be supplied as a comma-separated `--meeting-ids=` value.

## Scope rule

A run must use exactly one mode:

```text
date_window
or
selected_meetings
```

Do not combine a date window with selected meeting IDs in one run.

Date-window semantics use an inclusive start and exclusive end:

```text
start_date <= meeting.date < end_date_exclusive
```

The ordinary date-window path is bounded to at most 93 days per run. Wider maintenance should be split into reviewable overlapping windows.

## Existing monthly collector reuse

The implementation reuses the existing monthly NAR source collector as an internal scratch acquisition layer.

For every required month:

```text
requested incremental scope
-> monthly scratch source fetch
-> in-scope filter
-> cross-month aggregation
-> stable meeting identity deduplication
-> incremental candidate/report output
-> Coverage Observation
-> retry targets
```

The legacy monthly candidate/report files are snapshotted before scratch collection and restored after scratch collection, including failure cleanup.

Ordinary incremental operation therefore has four intended output files:

```text
data/candidates/nar-incremental-meeting-candidates.json
data/generated/timetable/nar-incremental-collection-report.json
data/generated/timetable/nar-coverage-observation.json
data/generated/timetable/nar-retry-targets.json
```

## Candidate boundary

Every candidate remains review-only:

```text
review.status: needs_review
review.promotion_eligible: false
review.canonical_write: disabled
review.public_write: disabled
review.raw_source_storage: disabled
```

A successful collector run is not approval and is not publication.

## Coverage Observation

The operator records requested and observed scope separately.

For a date-window run, observed scope may be shorter than requested scope when only a shorter official source horizon was observed.

A partial run may therefore succeed with:

```text
coverage_claim: partial
unresolved_dates: [...]
unresolved_meeting_ids: [...]
source_errors: [...]
```

`partial` is a normal successful coverage state. It does not invalidate complete candidates inside the observed scope.

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

Selected-meeting retry is intended for known stable NAR meeting IDs. Unknown or non-matrix meeting IDs must fail before collection.

## Overlap rule

Overlapping runs are allowed.

Aggregation is deterministic by stable meeting identity. Exact duplicates collapse to one candidate. Conflicting duplicate candidate content must fail rather than silently overwrite reviewed information.

Absence from a later run is not deletion, cancellation, or rank downgrade.

## Validation

The operator runs:

```text
scripts/check-calendar-nar-incremental-core.mjs
scripts/check-calendar-nar-incremental.mjs
scripts/check-calendar-runtime-import-boundary.mjs
```

CI also validates:

```text
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
```

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
ordinary incremental collection
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

## Relationship to legacy monthly and July full-month paths

`manual-nar-monthly-collection.md` documents the transitional legacy monthly path.

The July full-month collector and validator remain available only for the explicit July Completion Audit claim. They are not ordinary batch gates and must not block unrelated valid partial promotion.
