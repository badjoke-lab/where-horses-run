# Banei Retry Manual Operator Route

Status: active manual operator contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-09

## Purpose

This contract exposes the reviewed Banei rank-upgrade retry Plan as an explicit `workflow_dispatch` choice in the standard Calendar Actions multi-job workflow.

The operator path is:

```text
human chooses workflow_dispatch
-> choose banei-reviewed-retry-ops-001
-> standard Actions multi-job planner
-> one hosted Job matrix entry
-> immutable execution specification
-> standard Actions dispatcher
-> banei-schedule-detail-actions executor
-> independent status and batch artifacts
-> campaign summary
```

This route is manual and explicit.

It does not add schedule or cron execution.

## Allowed Plan

The Banei manual operator choice is:

```text
banei-reviewed-retry-ops-001
```

The Plan contains exactly one Job:

```text
job_id: banei-reviewed-retry-job-001
system_id: japan-banei-system
runner_policy: registry_primary_or_fallback
collection_mode: selected_meetings
meeting_id: banei-obihiro-racecourse-2026-07-04
rank_strategy: target_rank
target_rank: A+
reason: rank_upgrade_retry
```

The broad validation Plan:

```text
banei-actions-window-selected-001
```

is not exposed as a manual operator choice.

It remains a contract and CI fixture for multi-mode executor validation.

## Evidence basis

The allowed Plan is backed by permanent operational evidence:

```text
data/fixtures/calendar-banei-retry-ops-evidence-v1.json
```

The evidence records successful execution through:

```text
plan-actions-multi-job.mjs
-> run-calendar-actions-job.mjs
-> banei-schedule-detail-actions
```

The reviewed run produced:

```text
status: success
observed rank: A+
race rows: 12
coverage: source_window_complete
unresolved meetings: 0
source errors: 0
Result Manifest A+: 1
Review Queue: review_ready / not_ready
```

Temporary execution artifacts were hashed and removed. The repository retains the public-safe summary and artifact digests.

## Operator procedure

The operator uses the standard workflow:

```text
Calendar Actions multi-job runner
```

and selects:

```text
plan_id = banei-reviewed-retry-ops-001
```

The workflow then compiles the Plan rather than accepting arbitrary Job JSON from the operator.

The operator does not supply:

```text
arbitrary source URL
arbitrary executor path
arbitrary meeting ID
arbitrary rank target
arbitrary shell command
```

The reviewed fixture remains the execution source of truth.

## Planner boundary

The standard planner must compile exactly one hosted Job for this Plan.

The execution specification must preserve:

```text
system_id: japan-banei-system
runner_used: github_actions
executor_id: banei-schedule-detail-actions
collection_mode: selected_meetings
reason: rank_upgrade_retry
rank_strategy: target_rank
target_rank: A+
```

The deterministic batch identity remains:

```text
banei-reviewed-retry-ops-001-banei-reviewed-retry-job-001-run-001
```

## Fallback boundary

The Job Plan uses:

```text
runner_policy.mode: registry_primary_or_fallback
```

Current Registry routing is:

```text
primary: github_actions
fallback: reviewed_import
```

The standard hosted workflow executes the hosted-capable primary route.

Fallback eligibility remains represented in the Job contract and Registry policy. The workflow does not silently rewrite failure into reviewed-import success.

## Artifact boundary

The standard workflow uploads independent Job artifacts:

```text
status JSON
candidate batch
Coverage Observation
Collection Result Manifest
Review Queue
collection report
```

and a separate campaign summary.

The operator route does not commit generated execution artifacts to the repository.

Evidence capture, when explicitly required, remains a separate bounded review step.

## Scheduler boundary

The Due-job scheduler remains:

```text
artifact_only: true
execute_jobs: false
```

The presence of a manual `workflow_dispatch` choice does not create unattended execution.

There is no `schedule` trigger and no `cron` trigger in the standard Actions multi-job workflow.

Manual execution and scheduled planning remain separate.

## Review boundary

Successful acquisition does not mean automatic approval.

The Banei executor continues to emit:

```text
candidate review status: needs_review
Review Queue review_state: review_ready
Review Queue promotion_state: not_ready
```

Promotion Validation remains separate.

The route does not:

```text
automatically approve
promote canonical data
write public projection data
publish
deploy
```

## Public data boundary

The manual operator route does not expand the Calendar public-data model.

Execution artifacts and evidence summaries must not retain:

- horse names;
- jockey names;
- trainer names;
- owners or breeders;
- draw or gate positions;
- weights;
- odds;
- betting rank;
- results;
- payouts;
- predictions;
- tips;
- raw HTML;
- source bodies;
- credentials, cookies, secrets, or tokens;
- direct stream URLs.

## Completion boundary

The Banei retry manual operator route is complete when:

- `banei-reviewed-retry-ops-001` is a `workflow_dispatch` choice;
- the broad Banei validation Plan is not a `workflow_dispatch` choice;
- the allowed Plan exists and contains exactly one Job;
- the Job is Banei selected-meeting rank-upgrade retry targeting A+;
- the Job preserves registry-primary-or-fallback policy;
- standard planning compiles exactly one hosted Job;
- execution resolves to GitHub Actions and the Banei executor;
- permanent operational evidence validates successful execution;
- workflow permissions remain read-only;
- no schedule or cron trigger exists;
- scheduler `execute_jobs` remains false;
- automatic approval, promotion, publication, and deployment remain absent.

## Next handoff

After this route is formalized, the next work is operational policy rather than additional acquisition capability.

Possible later work includes:

1. reviewed operator guidance for interpreting `success`, `partial`, and `source_error` outcomes;
2. a bounded post-run Queue reconciliation command that remains separate from acquisition execution;
3. explicit approval rules before any unattended retry execution is considered;
4. continued manual operation while evidence volume is still small.
