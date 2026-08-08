# Calendar Collection Plan

Status: active multi-job acquisition campaign contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-08-08

## Purpose

A Collection Plan groups independently valid Collection Jobs under one campaign. It may contain zero Jobs when planning succeeds and no acquisition work is due.

```text
Collection Plan
-> zero Jobs: explicit steady-state no-op
or
-> Job A
-> Job B
-> Job C
```

Jobs may use different:

- systems;
- runner policies;
- collection modes;
- date windows;
- selected-meeting scopes;
- rank strategies;
- target ranks;
- reasons.

A Plan must not force one common source, runner, date window, target rank, review cohort, or promotion transaction.

## Canonical files

```text
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
scripts/timetable/collection-plan-validation.mjs
scripts/check-calendar-collection-plan.mjs
.github/workflows/calendar-collection-plan.yml
```

## Required fields

```text
schema_version
plan_id
campaign_id
created_at
jobs
```

`jobs` must be an array. An empty array is valid when the planner finds no due acquisition work.

A zero-job Plan means:

- planning succeeded;
- no source execution is required;
- the Actions matrix is empty;
- execution is skipped;
- activation status and retained Plan evidence still update;
- no Candidate is fabricated;
- no approval or publication side effect occurs.

This is distinct from planning failure.

Every present Job must use:

```text
schema_version: calendar-collection-job-v1
```

Every present Job `campaign_id` must equal the Plan `campaign_id`.

`job_id` values must be unique within the Plan.

## Independent Job validation

The validation core exposes:

```text
validateCollectionPlanV1
partitionCollectionPlanJobsV1
summarizeCollectionPlanOutcomesV1
```

`validateCollectionPlanV1` validates the whole request contract, including a valid zero-job steady-state Plan.

`partitionCollectionPlanJobsV1` preserves independent Job diagnostics. One invalid Job does not erase a valid sibling Job from the validation partition.

This partition does not authorize partial publication. It only preserves request-level diagnostic independence.

## Execution outcome isolation

Plan execution outcomes remain Job-scoped.

Supported internal outcome statuses for Plan isolation checks are:

```text
success
partial
source_error
not_run
```

A source error in one Job does not rewrite another Job outcome.

Example:

```text
JRA Job -> source_error
NAR Job -> success
```

The Plan summary must preserve both facts.

For a zero-job Plan, the result list and outcome counts are both empty. The absence of Jobs is itself the auditable planning result.

## Required valid examples

### Zero-job steady state

```text
jobs: []
```

This is valid only as the result of successful planning when no work is due. It is not a shortcut around due work.

### JRA local + NAR Actions

One Plan contains:

```text
JRA exact local Job
NAR exact github_actions Job
```

The two Jobs keep independent scopes and runner policies.

### NAR Actions + HKJC Actions with different windows

One Plan contains:

```text
NAR github_actions date window
HKJC github_actions bounded-generator date window
```

The windows are deliberately different.

The HKJC Registry profile remains provisional. It represents the existing safe dry-run candidate generator and approved active-window bundle path. It does not imply unrestricted source parsing or automatic publication.

### Regular refresh + selected-meeting retry

One Plan contains:

```text
NAR regular date-window refresh
NAR selected-meeting rank-upgrade retry
```

The retry does not change the scope or reason of the regular refresh Job.

## Rank isolation

A lower target rank in one Job must not downgrade another Job.

Fixture:

```text
NAR Job:
  rank_strategy: target_rank
  target_rank: C

JRA Job:
  rank_strategy: best_available
  target_rank: null
```

Plan validation must preserve both Job contracts without mutation.

## Invalid Plan examples

The negative fixture set rejects:

- system/runner mismatch;
- mixed date-window and selected-meeting scope inside one Job;
- duplicate Job IDs;
- Job campaign mismatch;
- `jobs` values that are not arrays.

An empty Jobs array is no longer an invalid Plan; it is the explicit zero-job steady-state result.

Job-level invalidity is still enforced by the Collection Job validator.

## HKJC provisional profile boundary

The Collection Plan stage uses the Acquisition Registry profile for `hong-kong-hkjc-system`. Its schedule path may use bounded GitHub Actions date-window acquisition under the separate reviewed execution policy. Detail/retry capability remains separately controlled and must not be inferred from schedule capability.

## Separation from review and promotion

A Plan is not:

- a review cohort;
- an approval batch;
- a promotion transaction;
- a publication batch;
- a deployment unit.

A zero-job Plan also does not assert that the **public** horizon is fresh. Publication freshness is reported separately by the daily activation status.

## Safety boundary

Collection Plans must not contain:

- source IDs or adapter IDs at Plan level;
- source bodies or raw HTML;
- participant, horse, jockey, trainer, betting, odds, result, payout, prediction, or tip data;
- credentials, cookies, tokens, restricted-access details, or bypass instructions;
- approval, promotion, publication, or deployment state.
