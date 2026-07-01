# Calendar Operations v1 contract

Status: active foundation  
Work ID: `WHR-CAL-OPS-V1`  
Started: 2026-07-01

## Purpose

Operations v1 produces an operator-facing maintenance report from reviewed repository state. The first layer reads Authority/Source records, Calendar Readiness records, the JRA reference candidate, and committed public projection data.

It does not fetch sources or change candidate, canonical, or public timetable data.

The second layer adds a deterministic review package and canonical pause/rollback controls. The package prepares human review only; it does not create an update pull request.

## Command

```text
node scripts/timetable/build-operations-status.mjs --reference-date YYYY-MM-DD
```

Committed output:

```text
data/generated/timetable/operations-status.json
```

The report contains source age, review thresholds, revalidation actions, blocked and unavailable states, JRA candidate freshness, public projection age, current-window counts, and stable operator actions.

## Review package

`scripts/timetable/build-operations-review-package.mjs` writes `data/generated/timetable/operations-review-package.json`.

The package adds stable action priority, six SHA-256 input digests, required human checks, and pause/rollback instructions. It proposes no changed files and records `public_release_expected: false`.

## Operations control

`data/static/calendar-operations-control.json` is the canonical control. Current mode is `paused_review_only`; scheduled refresh, live fetch in the canonical review workflow, automatic approval, canonical/public writes, and unattended publication remain disabled.

## Review thresholds

```text
daily: 2 days
near_meeting: 2 days
weekly: 8 days
monthly: 35 days
seasonal: 190 days
event_driven: 90 days
manual: 120 days
none: no age-based action
```

The shortest applicable threshold controls when a record requires review. A due action does not change readiness or publication state.

## Actions

```text
source_revalidation_due
manual_revalidation_due
link_revalidation_due
blocked_review
source_unavailable_review
refresh_before_promotion
human_review_required
```

## Manual workflow

`.github/workflows/calendar-operations-review.yml` is read-only. It generates status and review-package artifacts for an optional reference date and has `contents: read` permission only.

It does not commit, open update pull requests, run live source fetches, promote candidates, or publish.

## Boundary

The report does not contain source bodies, source snippets, participants, betting data, results, predictions, credentials, or direct media links.

The legacy timetable schedule remains paused. Operations v1 adds no cron trigger.

## Validation

```text
node scripts/timetable/build-operations-status.mjs --reference-date 2026-07-01 --check
node scripts/check-calendar-operations-status.mjs
node scripts/timetable/build-operations-review-package.mjs --check
node scripts/check-calendar-operations-review-package.mjs
```

## Remaining Operations v1 work

- stale and source-health runbook;
- seasonal rollover;
- source-breakage escalation;
- grouped Operations v1 release gate.

The first live pilot remains `WHR-CAL-JAPAN-JRA` after Operations v1 completion.
