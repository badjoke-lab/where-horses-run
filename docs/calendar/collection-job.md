# Calendar Collection Job

Status: active machine-readable acquisition request contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

A Collection Job is the smallest schedulable Calendar acquisition request.

It answers:

```text
which system
which runner policy
which collection mode
which requested scope
which rank strategy
which reason
when requested
```

It does not duplicate source or adapter routing data from the Acquisition Registry.

## Canonical files

```text
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
scripts/timetable/collection-job-validation.mjs
scripts/check-calendar-collection-job.mjs
.github/workflows/calendar-collection-job.yml
```

## Required fields

```text
schema_version
job_id
campaign_id
system_id
runner_policy
collection_mode
requested_scope
rank_strategy
target_rank
reason
requested_at
```

`system_id` must resolve in:

```text
data/static/calendar-acquisition-registry.json
```

A Collection Job must not carry source IDs or adapter IDs.

## Runner policy

Supported runner-policy modes are:

```text
registry_primary
registry_primary_or_fallback
exact
```

### registry_primary

Uses the Registry `primary_runner`.

```text
runner: null
```

### registry_primary_or_fallback

Allows the orchestration layer to use the Registry primary runner and, when execution policy requires it, the Registry fallback runner.

```text
runner: null
```

This mode is invalid when the system profile has no fallback runner.

### exact

Requests one explicit runner class.

The runner must equal either the Registry `primary_runner` or `fallback_runner` for that system.

An exact runner value does not carry source or adapter identity.

## Collection modes

### date_window

Scope:

```text
start_date
end_date_exclusive
timezone
```

The system profile must support date windows.

When the effective inclusive date range crosses a calendar month boundary, the Registry profile must also support cross-month windows.

An end date equal to the first day of the next month does not by itself make a one-month window cross-month because the end is exclusive.

### single_date

Scope:

```text
date
timezone
```

The initial contract treats single-date acquisition as a bounded specialization of date-window capability.

### selected_meetings

Scope:

```text
meeting_ids
```

`meeting_ids` must be a non-empty unique string array.

The Registry profile must explicitly support selected meetings.

### source_visible_horizon

Scope:

```text
start_date
end_date_exclusive
timezone
```

The requested range remains bounded, but the observation may stop at the source-visible horizon.

The Registry profile must explicitly support source-visible horizon behavior.

## Rank strategy

Supported values:

```text
best_available
target_rank
```

### best_available

```text
target_rank: null
```

The source-specific acquisition path may yield any evidence-backed rank allowed by its implementation and review boundary.

### target_rank

```text
target_rank: C | B | B+ | A | A+
```

The target may not exceed Registry `technical_capability_rank`.

A target is an acquisition request, not a guarantee that the run will produce that rank.

## Reasons

Initial reasons:

```text
regular_refresh
coverage_gap
rank_upgrade_retry
source_revalidation
manual_recovery
completion_audit_support
```

`rank_upgrade_retry` requires:

```text
rank_strategy: target_rank
Registry supports_rank_upgrade_retry: true
```

`completion_audit_support` requires a date-window Collection Job.

The job only supports evidence collection for a later Completion Audit. It does not itself make an audited-complete claim.

## Scope exclusivity

A Job uses exactly one scope shape.

For example, a `date_window` Job cannot also contain `meeting_ids`.

The validator rejects mixed scope such as:

```text
collection_mode: date_window
requested_scope:
  start_date
  end_date_exclusive
  timezone
  meeting_ids
```

## Fixtures

Valid fixtures cover:

- one NAR month window;
- one JRA local window;
- one selected-meeting retry;
- one B to B+ target retry;
- one A to A+ target retry;
- source-visible-horizon observation;
- JRA reviewed-import single-date recovery;
- July completion-audit support collection.

Negative fixtures cover:

- mixed date-window and selected-meeting scope;
- unknown system;
- exact runner mismatch;
- unsupported selected meetings;
- unsupported cross-month window;
- best-available with non-null target rank;
- rank-upgrade retry without target-rank strategy;
- unsupported Banei date window;
- completion-audit support with selected meetings.

Additional programmatic negative tests reject target rank above technical capability, fallback policy without a Registry fallback, and source routing duplication inside a Job.

## Separation from Collection Plan

A Job is one independent acquisition request.

A Collection Plan groups multiple Jobs under one campaign and may contain different systems, runner policies, scopes, reasons, and target ranks.

```text
Collection Plan
-> many Collection Jobs
```

A Plan does not turn its Jobs into one review or one promotion transaction.

## Safety boundary

Collection Jobs must not contain:

- source IDs or adapter IDs;
- source bodies or raw HTML;
- participant or horse data;
- jockey or trainer data;
- betting or odds data;
- result or payout data;
- prediction or tip data;
- credentials, cookies, tokens, or bypass instructions;
- approval, promotion, publication, or deployment state.

Job validation has no acquisition, approval, promotion, publication, or deployment side effect.

## Next stage

The next control-plane stage is the Collection Plan schema.

The Plan layer will group independently valid Jobs without forcing a common date window, runner, rank target, review cohort, or promotion transaction.
