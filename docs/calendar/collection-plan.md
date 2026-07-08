# Calendar Collection Plan

Status: active multi-job acquisition campaign contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

A Collection Plan groups independently valid Collection Jobs under one campaign.

```text
Collection Plan
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

Every Job must use:

```text
schema_version: calendar-collection-job-v1
```

Every Job `campaign_id` must equal the Plan `campaign_id`.

`job_id` values must be unique within the Plan.

## Independent Job validation

The validation core exposes:

```text
validateCollectionPlanV1
partitionCollectionPlanJobsV1
summarizeCollectionPlanOutcomesV1
```

`validateCollectionPlanV1` validates the whole request contract.

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

This is not yet the Collection Result Manifest schema. Result Manifest remains a later control-plane stage.

## Required valid examples

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

The HKJC Registry profile remains provisional. It represents the existing safe dry-run candidate generator and approved active-window bundle path. It does not claim live fetch, arbitrary source parsing, or implemented detail acquisition.

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
- empty Jobs array.

Job-level invalidity is still enforced by the Collection Job validator.

## HKJC provisional profile boundary

The Collection Plan stage extends the Acquisition Registry with:

```text
system_id: hong-kong-hkjc-system
profile_status: provisional
primary_runner: github_actions
fallback_runner: local
schedule_source_id: hkjc-fixture-list
schedule_adapter_id: hong-kong-hkjc-dry-run-adapter
supports_date_window: true
```

Pending fields remain:

```text
detail_source_id
detail_adapter_id
```

The profile is grounded in:

- reviewed HKJC Readiness A+ technical capability / A public ceiling;
- Authority/Source inventory record `hkjc-fixture-list`;
- merged dry-run candidate generator;
- merged approved active-window bundle;
- local validation command path;
- top-level check integration suitable for GitHub Actions execution.

No live acquisition path is claimed.

## Separation from review and promotion

A Plan is not:

- a review cohort;
- an approval batch;
- a promotion transaction;
- a publication batch;
- a deployment unit.

Later stages may derive review cohorts from Result Manifests and policy, but Plan membership alone must not force Jobs into one review or promotion unit.

## Safety boundary

Collection Plans must not contain:

- source IDs or adapter IDs at Plan level;
- source bodies or raw HTML;
- participant or horse data;
- jockey or trainer data;
- betting or odds data;
- result or payout data;
- prediction or tip data;
- credentials, cookies, tokens, or bypass instructions;
- approval, promotion, publication, or deployment state.

Plan validation has no acquisition, approval, promotion, publication, or deployment side effect.

## Next stage

The next control-plane stage is the shared five-rank classifier contract.

It must validate:

```text
C
B
B+
A
A+
```

without forcing a C-only intermediate state and without allowing later lower-detail observations to silently downgrade a higher reviewed rank.
