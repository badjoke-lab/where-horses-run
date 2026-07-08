# Calendar Due-job Planner and Scheduling contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

ACP-14 generates explicit Collection Jobs from policy and current operational state before any acquisition execution occurs.

The core rule is:

```text
planning is not execution
```

The scheduled planner may inspect bounded operational state, decide that work is due, and emit one validated Collection Plan artifact. It does not execute the Jobs it creates.

The planner replaces operator memory with explicit policy while preserving conservative source load and human review boundaries.

## Canonical artifacts

```text
data/static/calendar-due-job-policy-v1.json
data/static/calendar-due-job-plan.schema.json
data/fixtures/calendar-due-job-planner-fixtures-v1.json
data/fixtures/calendar-due-job-planner-invalid-cases-v1.json
scripts/timetable/due-job-planner.mjs
scripts/timetable/plan-calendar-due-jobs.mjs
scripts/check-calendar-due-job-planner.mjs
.github/workflows/calendar-due-job-planner.yml
```

## Planning inputs

The initial planner explicitly models:

```text
source freshness thresholds
meeting proximity
source publication horizon
season state
rank gaps
retry backoff
coverage gaps
source health
```

The planner also consumes:

```text
Acquisition Registry
Rank-aware Retry Queue
system operational state
policy version
planning timestamp
```

The Acquisition Registry remains the source of truth for supported collection modes, runner profiles, retry capability, technical capability rank, and fallback availability.

## Policy model

The policy contains:

```text
scheduler cadence
maximum Jobs per plan
artifact retention
system enable/disable state
regular refresh thresholds
meeting proximity thresholds
planning window size
source horizon buffer
coverage-gap window limit
source revalidation cooldown
retry batch size
retry attempt limit
```

The initial scheduler boundary is:

```text
cadence_hours: 24
artifact_only: true
execute_jobs: false
automatic_approval: false
automatic_promotion: false
automatic_publication: false
automatic_deployment: false
```

The daily planning cadence is intentionally conservative. Planning more frequently would not authorize more source requests because this stage does not execute acquisition Jobs.

## Decision order

The planner evaluates each enabled active system in this order:

```text
1. source health
2. coverage gaps
3. due rank retries
4. source horizon
5. regular refresh
```

This ordering prevents unhealthy sources from receiving redundant normal refresh load.

### Source health

When source health is `degraded` or `unavailable`, regular refresh is suppressed.

A bounded `source_revalidation` Job is generated only when:

```text
revalidation policy is enabled
minimum revalidation interval has elapsed
Registry supports the required bounded scope
```

Otherwise the planner records a `not_due` source-health decision.

### Coverage gaps

Explicit date-window coverage gaps generate `coverage_gap` Jobs.

Large gaps are split into bounded windows according to the per-system policy limit.

The planner does not infer audited completeness from absence of errors and does not hide the original coverage dependency.

### Rank gaps and retry backoff

The planner consumes the Rank-aware Retry Queue.

A retry target is eligible only when:

```text
next_eligible_retry_at is null or due
attempt_count is below policy max
system policy enables retry
Registry supports rank-upgrade retry
Registry supports selected-meeting collection
```

Eligible meeting IDs are grouped into bounded selected-meeting Jobs.

`best_available` retry targets resolve to Registry technical capability rank because the Collection Job contract requires rank-upgrade retries to use an explicit `target_rank` strategy.

Deferred retries remain deferred and do not enter the generated Job.

### Source publication horizon

For systems that support `source_visible_horizon`, the planner compares the known source horizon with the policy lookahead plus horizon buffer.

When the horizon is too short, the planner may create an explicit `source_visible_horizon` Collection Job.

Systems without Registry support for this mode do not receive such Jobs.

### Freshness and meeting proximity

A regular refresh may become due because:

```text
last successful collection exceeds freshness threshold
or
next meeting falls inside the proximity window and collection age exceeds proximity minimum
```

The planner creates a bounded date-window Job only when Registry supports date-window collection.

If a source-horizon Job already covers the same maintenance need, the planner avoids adding a redundant normal refresh Job.

## Season state

Initial season states are:

```text
active
offseason
unknown
```

Only `active` systems generate regular due work under the initial policy.

Offseason or unknown state produces an explicit non-due decision rather than an acquisition request.

## Registry capability examples

### JRA

JRA supports bounded date-window collection but not selected-meeting rank retry or source-visible-horizon mode.

The due planner may create:

```text
regular_refresh
coverage_gap
source_revalidation
```

within JRA's supported date-window boundary.

### NAR

NAR supports:

```text
date window
cross-month window
selected meetings
source-visible horizon
rank-upgrade retry
```

The fixture proves that one planning cycle may produce independent NAR Jobs for:

```text
coverage gap
rank retry
source horizon
```

without flattening their scopes.

### HKJC

The current provisional HKJC profile supports bounded date-window planning but not source-visible-horizon mode or rank retry.

A degraded-source revalidation request therefore uses an explicit bounded date window.

### Banei

The current Banei Registry profile remains provisional and the initial due-job policy is disabled.

ACP-14 must not fabricate unsupported date-window or retry capability for Banei.

## Generated plan

The output is one `calendar-due-job-plan-v1` document containing:

```text
policy version
planning timestamp
planning date
validated Collection Plan
decision records
scheduler boundary
```

Every generated Job must have one corresponding `job_planned` decision.

Every planned decision must reference a real generated Job.

Non-planned decisions must use `job_id=null`.

## Initial integration fixture

At `2026-07-08T18:00:00Z`, the fixture produces five explicit Jobs:

```text
JRA  regular refresh
NAR  coverage gap
NAR  rank-upgrade retry
NAR  source-horizon refresh
HKJC source revalidation
```

Banei is explicitly excluded by policy.

The NAR Retry Queue contains:

```text
2 due targets
1 deferred target
```

Only the two due meeting IDs enter the generated selected-meeting retry Job.

The resulting retry target rank is A+ because Registry technical capability is A+ and the Queue includes `best_available` work.

## Maximum Job cap

The scheduler policy sets a maximum number of Jobs per plan.

If generated work exceeds that cap, the planner fails closed rather than silently dropping arbitrary Jobs.

This makes overload visible to the operator and preserves deterministic planning.

## Scheduled workflow boundary

The formal workflow runs on:

```text
workflow_dispatch
daily cron at 03:17 UTC
```

The scheduled workflow only:

```text
checks planner syntax
validates policy and fixtures
plans explicit due Collection Jobs
uploads the due-job plan artifact
```

It does not call:

```text
run-calendar-actions-job
run-calendar-local-plan
promotion commands
deployment commands
```

It uses:

```text
permissions:
  contents: read
```

The scheduler therefore schedules planning, not collection execution.

## CLI model

Fixture mode:

```text
node scripts/timetable/plan-calendar-due-jobs.mjs \
  --fixture=data/fixtures/calendar-due-job-planner-fixtures-v1.json \
  --output=.calendar-due-job-plan.json
```

Explicit state mode:

```text
node scripts/timetable/plan-calendar-due-jobs.mjs \
  --policy=data/static/calendar-due-job-policy-v1.json \
  --state=<state.json> \
  --output=<due-plan.json>
```

## Invalid combinations rejected

Validation rejects at least:

- artifact-only disabled;
- jobs-executed enabled;
- automatic publication enabled;
- decision referencing unknown Job;
- generated Job without planned decision;
- source route injected into Collection Job;
- policy enabling Job execution;
- policy enabling automatic approval;
- rank retry enabled where Registry lacks support;
- zero maximum Job limit;
- generated work exceeding maximum Job cap.

## Public and safety boundary

The due-job plan contains scheduling metadata and Collection Job scopes only.

It must not contain:

- source bodies or raw HTML;
- credentials, cookies, tokens, or secrets;
- horse names;
- jockey names;
- trainer names;
- odds;
- results;
- payouts;
- predictions;
- tips;
- direct stream URLs.

Planning does not change the public timetable display boundary. C/B/B+/A/A+ remain acquisition and review capability states governed by the existing public display rules.

## ACP-14 completion boundary

ACP-14 is complete when:

- source freshness thresholds can generate explicit Jobs;
- meeting proximity can influence refresh due state;
- source publication horizon can create explicit horizon Jobs only where supported;
- season state can suppress work;
- rank gaps and retry backoff create bounded selected-meeting Jobs;
- coverage gaps create bounded date-window Jobs;
- source health can suppress regular load and create bounded revalidation Jobs;
- every output is a valid Collection Plan before execution;
- maximum Job cap fails closed;
- the daily scheduler produces artifacts only;
- acquisition execution, approval, promotion, publication, and deployment remain disabled.

## Next handoff

After ACP-14, ACP-15 Operations v2 operator view becomes current.

Operations v2 will summarize planned, queued, running, successful, partial, and failed acquisition work alongside Review Queue, Retry Queue, rank distributions, source health, freshness, promotion state, and publication state.
