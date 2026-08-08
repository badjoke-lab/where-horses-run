# Calendar daily acquisition review operation

Status: active reviewed operation  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Last reviewed: 2026-08-08

## Canonical reading order

Use these documents together:

1. [`daily-acquisition-contract.md`](daily-acquisition-contract.md) — binding behavior and prohibition contract;
2. [`daily-acquisition-implementation-schedule.md`](daily-acquisition-implementation-schedule.md) — staged implementation and acceptance schedule;
3. this document — ordinary operator behavior;
4. [`due-job-planner.md`](due-job-planner.md) — policy-based planning semantics;
5. [`actions-multi-job-runner.md`](actions-multi-job-runner.md) — independent hosted execution semantics;
6. [`pipeline-v1-promotion.md`](pipeline-v1-promotion.md) and [`pipeline-v1-public-projection.md`](pipeline-v1-public-projection.md) — human-reviewed publication continuation.

## Purpose

At 03:17 UTC / 12:17 JST each day the operation:

1. derives planner state from the committed public horizon and reviewed season windows;
2. creates a planning-only Due-job Plan;
3. compiles only GitHub Actions-compatible Jobs;
4. authorizes exact hosted Jobs against the separate execution policy;
5. executes authorized Jobs independently with `fail-fast: false`;
6. preserves source errors and partial outcomes;
7. writes an activation-status record even when planning fails, execution fails, or no hosted Job exists;
8. pushes review-safe evidence to the stable branch behind Draft PR #559;
9. records whether the committed public 30-day horizon itself is complete.

The last item is essential: successful acquisition is not equivalent to successful publication maintenance.

## Publication boundary

The daily operation does not:

- approve candidates;
- promote candidates into Canonical timetable data;
- write the public meeting list or meeting details;
- create or merge its own pull request;
- deploy Cloudflare Pages.

Human review remains mandatory before Canonical promotion and public projection.

## Runner and source-specific boundary

The scheduled operation executes only Jobs that pass the Due-job policy, reviewed season state, Acquisition Registry, runner compatibility contract, and daily execution allow-list.

Current practical effect:

- **NAR:** hosted date-window, source-horizon, source-revalidation, and reviewed Retry Queue acquisition where planned;
- **HKJC:** hosted bounded fixture acquisition during active reviewed windows, plus a future-season wake-up Job when an approved `active` window begins inside the current 30-day horizon;
- **Banei:** ordinary regular refresh, coverage-gap, and source-revalidation execution remain disabled; only explicitly reviewed selected-meeting rank retry is normally eligible;
- **JRA:** due work may be planned, but hosted execution remains excluded; reviewed local acquisition/import is responsible;
- **UAE:** outside the daily Due-job policy; reviewed season windows remain explicit so the operator knows when a future wake-up decision becomes due.

Executor capability alone never activates an otherwise prohibited source path.

## Season-state handling

`data/static/calendar-system-season-state-v1.json` may contain multiple non-overlapping reviewed windows for one system.

The planner requires exactly one reviewed window covering the planning date. Missing, overlapping, or expired state fails closed.

If the current window is `offseason`, ordinary collection is suppressed. If a later reviewed `active` window starts inside the same 30-day planning horizon, the planner may create a coverage gap only for that future active interval.

Example reviewed on 2026-08-08:

```text
HKJC current state: offseason through 2026-09-05
HKJC future active start: 2026-09-06
planned acquisition interval: 2026-09-06..2026-09-07 only
```

This prevents both failure modes:

- treating offseason dates as missing meetings;
- suppressing a known season restart merely because the planning date itself is offseason.

## Stable review branch and Draft PR

```text
branch: automation/calendar-daily-acquisition-review
Draft PR: #559
```

The unattended workflow does not request `pull-requests: write` and does not create, close, ready, merge, or delete pull requests.

Each activation pushes review-safe evidence to the existing branch. Draft PR #559 is an operating queue and must not be merged merely because automation updated it.

## Activation status

Every activation writes:

```text
data/generated/timetable/daily-acquisition-status/latest.json
data/generated/timetable/daily-acquisition-status/runs/<github-run-id>.json
```

In addition to run identity, plan result, execution result, Job count, plan identity, and publication-side-effect flags, status now includes:

```text
publication_freshness.public_horizon_end_date
publication_freshness.required_horizon_end_date
publication_freshness.publication_review_required
```

For a 30-day Calendar, `required_horizon_end_date` is the activation date plus 29 days.

Interpretation:

- `publication_review_required=false`: the committed public data reaches the required rolling horizon;
- `publication_review_required=true`: acquisition may be healthy, but reviewed publication has fallen behind and an operator must continue the review/promotion/publication path.

The August 8 recovery added this signal because acquisition had continued successfully while production remained on the July 19 projection ending August 17.

## Result delivery

When planning succeeds, Draft PR #559 receives the retained planner state, Due-job Plan, Actions Plan, campaign summary, and activation status.

When hosted Jobs produce artifacts, it may also receive:

- independent Job status records;
- NAR schedule/detail candidate batches;
- Coverage Observation and Result Manifest artifacts;
- source-error and partial-result evidence;
- other explicitly permitted source-specific review artifacts.

No hosted Jobs means status and plan evidence still update; no candidate data is fabricated.

## Operator continuation

The operator must review Draft PR #559 after every material acquisition change and whenever `publication_review_required=true`.

Required continuation:

1. inspect activation status and exact plan identity;
2. inspect every Job outcome and source error;
3. compare `public_horizon_end_date` with `required_horizon_end_date`;
4. inspect requested versus observed source coverage;
5. confirm rank classification and missing fields;
6. separate valid partial batches from blocked batches;
7. approve an exact candidate envelope only after source review;
8. run Promotion Validation;
9. generate Canonical and public projection separately from the daily workflow;
10. run bilingual rendered QA;
11. merge through the normal reviewed publication path;
12. confirm production freshness once after deployment.

A green acquisition run with `publication_review_required=true` is **not** a complete maintenance cycle.

## Failure behavior

- Missing, invalid, overlapping, or expired season state stops planning.
- Planning or authorization failure prevents source execution.
- One hosted Job failure does not cancel independent Jobs.
- Source errors remain explicit status artifacts.
- Execution failure remains visible in Draft PR #559.
- A zero-Job activation is an auditable result, not a silent no-op.
- A review-branch push failure fails the workflow and never authorizes publication.
- No failure path writes Canonical or public timetable data.

## Current August 8 recovery

Daily acquisition continued after the July 19 publication, but human publication review did not. As a result, production stayed at an August 17 public horizon while the review queue continued accumulating evidence.

The current recovery PR restores the reviewed window through 2026-09-06 with 96 new Rank C meeting identities:

```text
JRA: 18
NAR: 69
Banei: 8
HKJC: 1
```

The recovery does not change the permanent publication boundary: Rank C exposes meeting date and racecourse only, and the daily workflow still has no authority to approve or publish these records automatically.
