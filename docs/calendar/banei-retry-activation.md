# Banei Rank-upgrade Retry Activation

Status: active source-specific activation contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-09

## Purpose

This activation consumes the merged Banei retry execution proof and enables only the proven rank-upgrade retry capability.

The activation path is:

```text
bounded retry proof fixture
-> due versus deferred classification
-> selected-meeting Job planning
-> GitHub Actions Banei executor normalization
-> one A+ success and one unresolved B fallback
-> Result Manifest validation
-> Review Queue validation
-> success removal
-> failure retention
-> attempt accounting
-> exponential backoff
-> max-attempt suppression
-> Registry retry capability activation
-> bounded Due-job rank-retry planning activation
```

## Evidence basis

The merged proof contract is:

```text
docs/calendar/banei-retry-execution-proof.md
```

The proof validates:

```text
2 due retry entries
1 deferred retry entry
1 selected-meeting Job
1 A+ success
1 unresolved B fallback failure
1 success removal from Retry Queue
1 failure retained in Retry Queue
attempt count 0 -> 1
first failure backoff 6 hours
second failure attempt count 1 -> 2
second failure backoff 12 hours
max-attempt suppression at 3
Result Manifest / Coverage cross-check
Review Queue / Manifest cross-check
```

The activation does not infer capability beyond that evidence.

## Acquisition Registry activation

The Banei profile remains:

```text
profile_status: active
primary_runner: github_actions
fallback_runner: reviewed_import
supports_date_window: true
supports_selected_meetings: true
supports_cross_month_window: false
supports_source_visible_horizon: false
```

This activation changes:

```text
supports_rank_upgrade_retry: true
```

The Banei detail adapter remains:

```text
banei-nar-race-list-detail-v1
```

Rank-oriented retry entries must use the registered detail adapter.

## Due-job policy activation

The Banei Due-job system rule is enabled only so the Planner can emit proven rank-retry Jobs.

Enabled path:

```text
system rule: enabled
rank_retry: enabled
max selected meetings per Job: 2
max attempt count: 3
```

The bounds come directly from the reviewed proof fixture.

## Automation that remains disabled

Activation is intentionally narrow.

Banei regular refresh remains disabled.

Banei coverage-gap planning remains disabled.

Banei source revalidation remains disabled.

Cross-month support remains disabled.

Source-visible-horizon support remains disabled.

Automatic execution remains disabled.

Automatic approval, promotion, publication, and deployment remain disabled.

## Scheduler boundary

The shared Due-job scheduler remains artifact-only.

Canonical scheduler policy remains:

```text
artifact_only: true
execute_jobs: false
automatic_approval: false
automatic_promotion: false
automatic_publication: false
automatic_deployment: false
```

The daily scheduler may produce a reviewed Collection Plan artifact containing a Banei selected-meeting retry Job.

It does not execute the Job.

Execution remains a separate operator or approved workflow action.

## Due-job planning semantics

For Banei retry entries, the shared Planner applies:

```text
entry system matches japan-banei-system
attempt_count < 3
next_eligible_retry_at is null or due
```

Eligible entries are chunked at:

```text
max selected meetings per Job: 2
```

The planned Job uses:

```text
collection_mode: selected_meetings
reason: rank_upgrade_retry
rank_strategy: target_rank
target_rank: highest eligible target in the chunk
runner_policy: registry_primary_or_fallback
```

For the permanent Due-job fixture, two Banei retry entries produce one selected-meeting Job targeting A+.

## Runner and fallback semantics

Primary execution route:

```text
github_actions
```

Fallback eligibility:

```text
reviewed_import
```

The Due-job Planner expresses fallback eligibility in Job policy.

The Planner itself does not execute primary or fallback runners.

## Retry Queue semantics after activation

A Banei rank-oriented retry entry must cross-check against Registry:

```text
system_id: japan-banei-system
primary_runner: github_actions
fallback_runner: reviewed_import
adapter_id: banei-nar-race-list-detail-v1
selected-meeting scope supported
rank-upgrade retry supported
```

Queue validation still enforces monotonic rank-gap rules.

Retry activation does not permit rank downgrade.

## Success handling

The proof establishes the Queue transition rule:

```text
selected retry result reaches target
and meeting is not unresolved
-> remove successful entry from Retry Queue
```

Removing a retry entry does not automatically promote canonical meeting data.

Candidate review and Promotion Validation remain separate.

## Failure handling

The proof establishes:

```text
selected retry remains unresolved
-> retain entry
-> increment attempt_count
-> set last_attempt_at
-> compute next_eligible_retry_at
```

The failure retains the best valid schedule evidence such as B or B+.

The failure does not erase successful results from the same partial batch.

## Backoff policy evidence

The proof validates:

```text
base backoff: 6 hours
first failure: 6 hours
second failure: 12 hours
maximum proof bound: 48 hours
```

The canonical Due-job policy stores attempt and batch limits, while Queue state stores each concrete next eligible time.

This activation does not add autonomous retry execution.

## Max-attempt boundary

The activated Planner limit is:

```text
max attempt count: 3
```

An entry with:

```text
attempt_count >= 3
```

is excluded from newly planned rank-retry Jobs.

It remains reviewable operational state; the Planner does not delete it automatically.

## Result Manifest and Review Queue boundary

Banei retry execution continues to use the existing Actions executor path.

Every retry batch must continue to emit and validate:

```text
Coverage Observation
Collection Result Manifest
Review Queue entry
```

A partial batch can contain:

```text
A+ success records
B or B+ schedule fallback records
explicit unresolved meeting IDs
explicit bounded source errors
```

The Review Queue remains:

```text
review_state: review_ready
promotion_state: not_ready
```

## Bridge state

The Banei schedule bridge now reports:

```text
retry_activation.state: enabled_evidence_backed
```

The bridge still records:

```text
automatic_retry_queue_write: false
```

This distinction is intentional.

Registry and Planner capability are enabled, but the schedule bridge does not silently mutate Retry Queue state.

## Public and safety boundary

Retry activation affects control-plane planning only.

It does not expand public display fields.

Control-plane artifacts must not contain:

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

## Side-effect boundary

The activation enables planning eligibility, not autonomous execution.

The following remain false:

```text
scheduler Job execution
automatic approval
automatic promotion
automatic canonical write
automatic public write
automatic publication
automatic deployment
```

## Activation completion boundary

Banei retry activation is complete when:

- merged proof remains reproducible from its fixture;
- Registry `supports_rank_upgrade_retry` is true;
- Banei Due-job system rule is enabled;
- only Banei `rank_retry` planning is enabled;
- max selected meetings per Job is 2;
- max attempt count is 3;
- regular refresh remains disabled;
- coverage-gap planning remains disabled;
- source revalidation remains disabled;
- scheduler remains artifact-only;
- automatic execution remains disabled;
- permanent Due-job fixture plans exactly one Banei selected-meeting retry Job;
- Job targets A+ for the two fixture entries;
- fallback eligibility remains represented;
- bridge reports `enabled_evidence_backed`;
- bridge automatic Retry Queue write remains false;
- Retry Queue, Due-job Planner, Banei executor, Actions multi-job, Manifest, Review Queue, Operations, pipeline, and release gates pass.

## Next handoff

After conservative retry activation, the next Banei work is operational integration rather than broader capability expansion.

The next steps are:

1. connect reviewed retry Queue state to the normal operator control-plane view;
2. surface due/deferred/attempt/backoff status in Operations v2 without exposing raw source data;
3. run an explicit reviewed Banei retry Job through the normal Actions multi-job path;
4. record real operational success/failure evidence;
5. keep automatic Job execution disabled until a separate unattended-execution policy decision exists.
