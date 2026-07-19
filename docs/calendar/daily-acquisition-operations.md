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

1. derives a bounded planner state from the committed public meeting horizon and reviewed season states;
2. creates a validated planning-only Due-job Plan;
3. compiles only GitHub Actions-compatible Jobs;
4. authorizes exact hosted Jobs against the separate daily execution policy;
5. executes authorized Jobs independently with `fail-fast: false`;
6. preserves source errors and partial outcomes instead of rewriting them as success;
7. writes one activation-status record even when planning fails, execution fails, or no hosted Job exists;
8. pushes the status, plans, summaries, and available acquisition artifacts to the stable review branch backing Draft PR #559.

## Publication boundary

The operation does not:

- approve candidates;
- promote candidates into Canonical timetable data;
- write the public meeting list or meeting details;
- create or merge its own pull request;
- deploy Cloudflare Pages.

Human review remains mandatory before Canonical promotion and public projection.

## Runner and policy boundary

The scheduled operation executes only Jobs that:

1. are planned by the current Due-job policy;
2. are allowed by reviewed system season state;
3. resolve to `github_actions` through the Acquisition Registry and runner compatibility contract; and
4. pass the daily execution policy's exact system, reason, mode, runner, and executor allow-list.

Current practical effect:

- NAR: hosted date-window, source-horizon, and reviewed Retry Queue acquisition where planned;
- HKJC: hosted bounded schedule-window acquisition only while reviewed state is active;
- Banei: regular refresh, coverage-gap, and source-revalidation planning remain disabled; only explicitly reviewed selected-meeting rank retry may execute;
- JRA: due work may be planned but is excluded from hosted execution because the primary runner remains local and reviewed import is the fallback;
- UAE ERA: not present in the daily Due-job policy and season-suppressed until a separate reviewed wake-up decision.

The workflow must not broaden a source-specific policy merely because an Actions executor exists.

## State derivation

`scripts/timetable/build-calendar-live-planner-state.mjs` derives conservative operational state from:

- the committed public meeting list;
- `data/static/calendar-system-season-state-v1.json`;
- the latest reviewed `last_checked_date` evidence;
- the Acquisition Registry and Due-job policy;
- an explicit reviewed Retry Queue when supplied.

It uses each active system's latest public meeting date as the visible horizon and proposes only a tail coverage gap. An offseason system receives no coverage gap. Absence on one date is never treated as cancellation or an internal data hole.

Missing or expired reviewed season state stops planning.

## Stable review branch and Draft PR

The review branch is:

```text
automation/calendar-daily-acquisition-review
```

The stable human-review pull request is Draft PR #559.

The branch and Draft PR are bootstrapped once by an explicit operator action. The unattended workflow does not request `pull-requests: write` and does not create, close, reopen, ready, merge, or delete pull requests.

Each activation pushes review-safe evidence to the existing branch. This avoids relying on repository settings that may prevent GitHub Actions from creating pull requests and avoids opening one PR per day.

## Activation status

Every main-branch activation, scheduled run, or manual dispatch writes:

```text
data/generated/timetable/daily-acquisition-status/latest.json
data/generated/timetable/daily-acquisition-status/runs/<github-run-id>.json
```

The schema is:

```text
data/static/calendar-daily-acquisition-activation-status.schema.json
```

The status records:

- source commit and ref;
- GitHub run identity and attempt;
- planning result;
- execution result;
- hosted Job count when planning succeeded;
- plan identity when planning succeeded;
- the fixed review branch;
- explicit false values for approval, Canonical write, public projection, automatic merge, and deployment.

## Result delivery

When planning succeeds, the review branch also receives the exact retained planner state, Due-job Plan, Actions Plan, and campaign summary.

When hosted Jobs produce artifacts, the branch may also receive:

- independent Job status records;
- NAR schedule/detail candidate batches;
- Coverage Observation and Result Manifest artifacts;
- source-error and partial-result evidence;
- other explicitly permitted source-specific review artifacts.

No hosted Jobs means the activation status and retained plans still update, but no candidate artifact is fabricated.

## Failure behavior

- Missing, invalid, or expired reviewed season state stops planning and is recorded as `plan_result: failure`.
- Planning or authorization failure prevents source execution.
- One Job failure does not cancel independent Jobs.
- Source errors remain explicit status artifacts.
- Execution failure is recorded on the stable review branch.
- No hosted Jobs is an auditable zero-Job activation, not a silent no-op.
- A branch-push failure fails the workflow and requires corrective operation; it does not authorize publication.
- No failure path writes Canonical or public timetable data.

## Operator continuation

When Draft PR #559 contains new evidence, the operator must:

1. inspect activation status and exact plan identity;
2. inspect every Job outcome and source error;
3. confirm requested versus observed coverage;
4. confirm rank classification and missing fields;
5. separate valid partial batches from blocked batches;
6. approve an exact candidate envelope only after source review;
7. use the existing Promotion Validation and public-projection path;
8. run rendered bilingual QA before any publication merge.

The daily workflow never performs these steps on behalf of the reviewer. Draft PR #559 is an operating queue and must not be merged merely because it changed.
