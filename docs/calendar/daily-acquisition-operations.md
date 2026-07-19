# Calendar daily acquisition review operation

Status: proposed active reviewed-acquisition operation  
Work ID: `WHR-CAL-DAILY-ACQUISITION`

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

## Runner boundary

The scheduled operation executes only Jobs that resolve to `github_actions` through the Acquisition Registry and runner compatibility contract.

Current practical effect:

- NAR: hosted date-window, source-horizon, and selected-meeting acquisition where planned;
- Banei: hosted date-window and selected-meeting acquisition where planned;
- HKJC: hosted bounded fixture-window acquisition;
- JRA: planned but excluded because the primary runner remains local and reviewed import is the fallback.

The draft PR body must state that excluded JRA work still requires the reviewed local operator path.

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
