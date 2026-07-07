# NAR Actions manual operator contract

Status: active source-runner contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

This contract defines the formal GitHub Actions entry point for NAR v2 ordinary acquisition.

The workflow is:

```text
.github/workflows/calendar-nar-incremental-v2-operator.yml
```

It is a collection and review-artifact workflow only.

It does not approve, promote, publish, or deploy data.

## Runner profile

```text
system_id: japan-nar-system
primary_runner: github_actions
fallback_runner: local
```

The primary and fallback paths must preserve compatible immutable batch semantics.

Runner choice does not change meeting identity, rank semantics, Coverage Observation, review requirements, retry semantics, or promotion rules.

## Supported modes

```text
date_window
selected_meetings
```

A run uses exactly one mode.

### Date window

Required inputs:

```text
batch_id
mode=date_window
start_date
end_date_exclusive
```

`meeting_ids` must be empty.

The underlying NAR v2 collector retains the ordinary maximum date-window bound of 93 days.

### Selected meetings

Required inputs:

```text
batch_id
mode=selected_meetings
meeting_ids
```

`start_date` and `end_date_exclusive` must be empty.

Meeting IDs may be separated by commas, whitespace, or newlines. They are deduplicated and sorted before collection.

## Optional checked time

`checked_at` may be supplied for a reproducible reviewed run.

When omitted, the collector uses its normal current-time behavior.

When supplied, it must parse as a valid date-time and is forwarded to the existing v2 collector.

## Input planning boundary

Workflow input planning is implemented by:

```text
scripts/timetable/nar-incremental-v2-actions-core.mjs
```

The launcher is:

```text
scripts/timetable/run-nar-incremental-v2-actions.mjs
```

The launcher passes a validated argument array directly to the existing collector without shell command construction.

The existing source-specific collector remains:

```text
scripts/timetable/collect-nar-incremental-v2.mjs
```

## Immutable outputs

For batch ID `<batch-id>`, the operator may produce only the four review-artifact paths:

```text
data/candidates/nar-incremental-batches/<batch-id>/batch.json

data/generated/timetable/nar-incremental-batches/<batch-id>/collection-report.json
data/generated/timetable/nar-incremental-batches/<batch-id>/coverage-observation.json
data/generated/timetable/nar-incremental-batches/<batch-id>/retry-targets.json
```

The workflow uploads these four files as one review artifact bundle.

The workflow does not commit or push generated collection output to the repository.

A separate reviewed process is required before any repository candidate, canonical, public, or publication change.

## Validation sequence

The formal operator runs:

```text
Actions input contract validation
-> NAR v2 collection
-> batch-specific NAR v2 validation
-> shared Coverage Observation validation
-> validation responsibility split validation
-> governance validation
-> runtime import boundary validation
-> review artifact upload
```

The operator contract checker is:

```text
scripts/check-calendar-nar-incremental-v2-actions-operator.mjs
```

Dedicated PR/push contract CI is:

```text
.github/workflows/calendar-nar-incremental-v2-actions-operator-contract.yml
```

## Security and publication boundary

The formal operator uses:

```text
permissions:
  contents: read
```

The workflow must not contain:

- repository write permissions;
- pull-request write permissions;
- `git push`;
- promotion commands;
- public projection commands;
- deployment commands;
- cron or scheduled execution.

The workflow must not publish participant, horse, jockey, trainer, betting, odds, result, payout, prediction, raw source body, or stream data.

## Human review boundary

Successful acquisition means only that a review batch was collected and validated structurally.

The safe continuation remains:

```text
immutable review artifacts
-> Batch Validation
-> Review Queue
-> human review
-> Promotion Validation
-> canonical promotion
-> public projection
-> publication QA
```

No collection success state implies approval.

## Current NAR maintenance state

Reviewed NAR schedule coverage through 2026-07-31 is published.

The July 8–31 published batch contains:

```text
schedule-confirmed meetings: 82
A+ detail records:            11
C schedule records:           71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
```

The 71 C meetings remain explicit detail-retry work. They must not be described as A+ detail-complete.

The next shared control-plane stage is the Acquisition Registry, followed by Collection Job and Collection Plan schemas.
