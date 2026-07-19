# Calendar daily acquisition review operation

Status: implementation candidate; operating evidence pending  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Last reviewed: 2026-07-19

## Canonical reading order

Use these documents together:

1. [`daily-acquisition-contract.md`](daily-acquisition-contract.md) — binding behavior and prohibition contract;
2. [`daily-acquisition-implementation-schedule.md`](daily-acquisition-implementation-schedule.md) — staged implementation and acceptance schedule;
3. this document — ordinary operator behavior;
4. [`due-job-planner.md`](due-job-planner.md) — policy-based planning semantics;
5. [`actions-multi-job-runner.md`](actions-multi-job-runner.md) — independent hosted execution semantics;
6. [`pipeline-v1-promotion.md`](pipeline-v1-promotion.md) and [`pipeline-v1-public-projection.md`](pipeline-v1-public-projection.md) — later human-reviewed publication continuation.

The implementation is not accepted as steady-state merely because the workflow file exists. The schedule's operating-evidence gates must pass first.

## Purpose

The daily operation closes the gap between the artifact-only Due-job Planner and the existing GitHub Actions acquisition executors.

At 03:17 UTC each day it:

1. derives a bounded planner state from the committed public meeting horizon;
2. creates a validated Due-job Plan;
3. compiles only GitHub Actions-compatible Jobs;
4. executes those Jobs independently with `fail-fast: false`;
5. preserves source errors and partial outcomes instead of rewriting them as success;
6. creates or updates one draft review pull request containing the generated acquisition artifacts.

## Publication boundary

The operation does not:

- approve candidates;
- promote candidates into Canonical timetable data;
- write the public meeting list or meeting details;
- merge its own draft pull request;
- deploy Cloudflare Pages.

Human review remains mandatory before Canonical promotion and public projection.

## Runner and policy boundary

The scheduled operation executes only Jobs that both:

1. are enabled by the current Due-job policy; and
2. resolve to `github_actions` through the Acquisition Registry and runner compatibility contract.

Current practical effect:

- NAR: hosted date-window, source-horizon, and reviewed Retry Queue acquisition where planned;
- HKJC: hosted bounded schedule-window acquisition where planned;
- Banei: regular refresh, coverage-gap, and source-revalidation planning remain disabled; only explicitly reviewed rank-retry work may enter the daily plan;
- JRA: due work may be planned but is excluded from hosted execution because the primary runner remains local and reviewed import is the fallback;
- UAE ERA: not yet present in the daily Due-job policy; DA-00 must record its seasonal disposition until a separate wake-up policy is adopted.

The workflow must not broaden a source-specific policy merely because an Actions executor exists. The draft PR body must state that excluded JRA work still requires the reviewed local operator path and that omitted seasonal systems require an explicit operator disposition.

## State derivation

`scripts/timetable/build-calendar-live-planner-state.mjs` derives conservative operational state from the committed public meeting list.

It uses:

- each configured system's latest public meeting date as the visible horizon;
- the latest reviewed `last_checked_date` as collection freshness evidence;
- the next public meeting date for proximity planning;
- a tail-only coverage gap when the committed horizon does not cover the next 30 days;
- an empty Retry Queue unless an explicit reviewed Queue path is supplied.

Absence of a meeting on an individual date is never treated as a cancellation or a missing meeting. Only the unrepresented tail after the latest known meeting is proposed as a bounded coverage gap.

## Draft PR behavior

The scheduled workflow uses a stable automation branch:

```text
automation/calendar-daily-acquisition-review
```

A new run updates the existing draft PR when one is already open. This prevents one unattended PR per day while allowing newly collected batches and status evidence to accumulate for human review.

## Failure behavior

- One Job failure does not cancel independent Jobs.
- Source errors remain explicit status artifacts.
- No hosted Jobs means no draft PR mutation.
- A planning or validation failure stops acquisition.
- No failure path writes Canonical or public timetable data.

## Operator continuation

When the draft PR contains reviewable data, the operator must:

1. inspect every Job outcome and source error;
2. confirm requested versus observed coverage;
3. confirm rank classification and missing fields;
4. separate valid partial batches from blocked batches;
5. approve an exact candidate envelope only after source review;
6. use the existing Promotion Validation and public-projection path;
7. run rendered bilingual QA before merge.

The daily workflow never performs these steps on behalf of the reviewer.
