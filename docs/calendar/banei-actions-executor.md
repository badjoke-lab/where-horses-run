# Banei GitHub Actions Executor Contract

Status: active source-specific runner contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-09

## Purpose

This contract connects the evidence-backed Banei schedule and detail paths to the shared GitHub Actions multi-job runner.

The path is:

```text
Collection Plan
-> Collection Job
-> Acquisition Registry runner resolution
-> runner compatibility contract
-> banei-schedule-detail-actions executor
-> schedule inventory
-> bounded detail collection
-> schedule evidence fallback plus A+ replacement
-> Coverage Observation
-> Collection Result Manifest
-> Review Queue
```

The executor supports:

```text
date_window
selected_meetings
```

It does not enable rank-upgrade retry by itself.

## Evidence basis

Runner activation is based on permanent bounded evidence that the same GitHub Actions execution environment successfully completed:

```text
2026 July full-month Banei schedule collection
one bounded date-window A+ detail collection
one bounded selected-meeting A+ detail collection
```

The selected-meeting evidence records:

```text
meeting: banei-obihiro-racecourse-2026-07-04
rank: A+
race rows: 12
coverage: source_window_complete
unresolved meetings: 0
source errors: 0
blocked meetings: 0
```

The full-month schedule evidence records 12 July meeting dates and a complete schedule scope.

## Registry runner switch

Registry runner switch is separate from parser correctness and is based on runner convergence evidence.

The active Banei profile uses:

```text
profile_status: active
primary_runner: github_actions
fallback_runner: reviewed_import
```

The fallback remains reviewed import rather than an unproven local live collector path.

The Registry enables:

```text
supports_date_window: true
supports_selected_meetings: true
```

and still disables:

```text
supports_cross_month_window: false
supports_source_visible_horizon: false
supports_rank_upgrade_retry: false
```

## Executor identity

Compatibility mapping:

```text
system_id: japan-banei-system
runner: github_actions
executor_id: banei-schedule-detail-actions
entry_point: scripts/timetable/run-banei-actions-job.mjs
output_model: banei-actions-schedule-detail-batch
supported modes: date_window, selected_meetings
```

The shared Actions dispatcher calls the Banei executor through this mapping.

## Schedule evidence fallback

The executor first establishes the reviewed schedule inventory for the execution scope.

For every targeted meeting, the schedule layer provides the best evidence-backed fallback rank:

```text
C  meeting identity
B  first race time
B+ first and last race times
```

If detail collection is blocked for one meeting, the executor preserves that schedule evidence fallback instead of deleting the meeting or inventing A/A+ detail.

This is the core partial-batch rule.

## A+ replacement

For meetings where the Banei detail adapter completes every race row, the executor performs A+ replacement of the schedule fallback record.

A complete detail record must already satisfy the Banei detail contract:

```text
continuous race numbers
post time on every row
race name on every row
RaceList distance evidence
DebaTable Dirt evidence
DebaTable straight-course evidence
RaceList/DebaTable distance agreement
```

Only a complete A+ detail record replaces the schedule fallback record.

## Partial batch accounting

A partial detail run may therefore produce a mixed rank batch.

Example selected-meeting fixture:

```text
meeting 1 -> A+ detail success
meeting 2 -> B schedule fallback

rank_counts:
C: 0
B: 1
B+: 0
A: 0
A+: 1
```

Example date-window fixture:

```text
meeting 1 -> A+ detail success
meeting 2 -> B schedule fallback
meeting 3 -> B+ schedule fallback

rank_counts:
C: 0
B: 1
B+: 1
A: 0
A+: 1
```

The rank total must equal `records_discovered`.

`records_updated` counts complete A+ detail replacements, not the number of preserved schedule records.

## date_window execution

For `date_window`, the Job supplies:

```text
start_date
end_date_exclusive
timezone
```

The executor selects only schedule meetings inside that reviewed window.

Current live runner evidence is July 2026 Banei evidence. Automatic future-window Due-job planning remains disabled until source-horizon and maintenance policy are separately activated.

The executor contract must not be interpreted as proof of cross-month or source-visible-horizon capability.

## selected_meetings execution

For `selected_meetings`, the Job supplies stable meeting IDs.

Every selected ID must exist in the reviewed Banei schedule inventory.

The detail collector then executes only those selected meetings.

Selected-meeting support is evidence-backed by the permanent runner convergence evidence artifact.

This support enables explicit bounded Collection Jobs but does not enable rank-upgrade retry automatically.

## Coverage Observation

The executor preserves the detail collector's bounded Coverage Observation after validating it against execution scope.

Coverage includes:

```text
requested scope
observed scope
records discovered
records updated
unresolved dates
unresolved meeting IDs
source errors
coverage claim
```

A mixed batch with valid A+ records plus detail blockers remains:

```text
coverage_claim: partial
```

Valid schedule fallback records remain in the candidate batch while unresolved meeting IDs and source errors remain explicit.

## Result Manifest

Every executor batch emits one shared Collection Result Manifest.

It contains:

```text
campaign ID
Job ID
batch ID
system ID
runner used
requested scope
observed scope
coverage claim
records discovered
records updated
C/B/B+/A/A+ rank counts
unresolved dates
unresolved meeting IDs
source errors
artifact references
```

The Result Manifest is validated structurally and cross-checked against Coverage Observation.

The Manifest does not approve or promote candidate records.

## Review Queue

Every validated executor batch emits one Review Queue entry:

```text
review_state: review_ready
promotion_state: not_ready
```

The Review Queue entry is built from the Result Manifest and cross-checked for identity, scope, coverage, rank counts, unresolved counts, source error count, and Manifest reference.

A partial batch may still be review-ready because valid records and blockers remain explicitly separated.

## Shared Actions dispatcher

The shared Actions dispatcher recognizes:

```text
banei-schedule-detail-actions
```

and calls:

```text
scripts/timetable/run-banei-actions-job.mjs
```

The dispatcher then reads the shared Coverage artifact and derives one bounded Actions status:

```text
success
partial
source_error
```

One Banei Job outcome does not rewrite another Job outcome in the same campaign.

## Actions multi-job Plan

The permanent Collection Plan fixtures include one Banei Actions Plan containing two independent Jobs:

```text
one date_window Job
one selected_meetings Job
```

Both resolve to:

```text
runner_used: github_actions
executor_id: banei-schedule-detail-actions
```

They retain independent batch IDs and scopes.

## Check-only fixture mode

The runtime executor supports a network-free fixture mode for permanent CI.

The fixture mode passes the same normalization core used after live acquisition and validates:

```text
mixed rank accounting
Coverage validation
Result Manifest validation
Review Queue validation
partial fallback preservation
scope isolation
side-effect boundaries
```

`--check-only` must not create final batch output directories.

## Live runtime isolation

In live execution the executor:

1. runs the Banei full-month schedule collector;
2. copies the resulting schedule inventory into a temporary directory;
3. restores or cleans the collector's default generated paths;
4. runs the bounded detail collector for the Job scope;
5. normalizes schedule fallback and A+ replacement records;
6. writes only the final batch artifacts under the shared Actions multi-job batch directory;
7. removes temporary execution files.

Raw source bodies are not stored.

## Rank-upgrade retry boundary

Rank-upgrade retry remains disabled.

Selected-meeting execution evidence is necessary but not sufficient for retry activation.

Retry activation still requires explicit proof for:

```text
retry backoff
attempt accounting
retry reason mapping
failure isolation across retry attempts
Retry Queue update behavior
retry-specific Due-job policy
```

The executor therefore supports selected Collection Jobs without claiming automatic retry policy.

## Due-job policy boundary

The Banei Due-job Planner rule remains disabled.

The runner may execute an explicit reviewed Collection Plan, but the daily planner does not yet generate Banei Jobs automatically.

This keeps schedule maintenance policy separate from runner capability.

## Public and safety boundary

The executor artifacts must not retain or publish:

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

A+ remains the bounded programme summary layer.

## Side-effect boundary

The executor does not perform:

```text
candidate approval
Promotion Validation
canonical promotion
public projection write
publication
deployment
```

Candidates remain `needs_review`.

Review Queue entries begin `review_ready / not_ready`.

## Completion boundary

This executor stage is complete when:

- the compatibility contract contains the Banei GitHub Actions mapping;
- Registry resolves Banei primary routing to GitHub Actions;
- reviewed import remains fallback;
- date_window Jobs compile and execute through the Banei executor;
- selected_meetings Jobs compile and execute through the same executor;
- schedule evidence fallback is preserved for detail blockers;
- complete detail records perform A+ replacement;
- rank counts close against records discovered;
- Coverage Observation validates;
- Result Manifest validates and cross-checks Coverage;
- Review Queue validates and cross-checks Manifest;
- shared Actions dispatcher recognizes the executor;
- Actions multi-job planning assigns independent Banei batch IDs;
- rank-upgrade retry remains disabled;
- Banei Due-job policy remains disabled;
- no approval, promotion, public write, publication, or deployment side effect occurs.

## Next handoff

After the Actions executor is validated, the next source-specific Banei stage is retry execution proof.

That proof should cover:

1. one explicit Retry Queue entry;
2. due versus deferred backoff behavior;
3. attempt count increment;
4. selected-meeting Job generation from retry state;
5. one successful retry and one failure-isolated case;
6. Result Manifest and Review Queue behavior after retry;
7. only then, Registry `supports_rank_upgrade_retry` and Banei Due-job retry policy activation.
