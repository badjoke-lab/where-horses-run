# Banei Retry Queue Reconciliation

Status: completed proposal stage; guarded state apply is defined separately  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-09

## Purpose

This contract defines the operator-side post-run reconciliation step for Banei rank-upgrade retry Jobs.

The reconciliation path is:

```text
existing Retry Queue
+ immutable execution specification
+ candidate batch
+ Collection Result Manifest
+ Review Queue batch state
+ Acquisition Registry
-> validate identities and review boundary
-> calculate success removal
-> calculate failure retention
-> update attempt count and next eligible time in memory
-> preserve unrelated deferred entries
-> emit proposal-only reconciliation artifact
-> emit proposed Retry Queue artifact
-> operator review
```

The input Queue is immutable during reconciliation.

There is no automatic Queue write.

## Proposal-only mode

The reconciliation output uses:

```text
mode: proposal_only
```

The command may write:

```text
reconciliation-proposal.json
proposed-retry-queue.json
```

under an explicit output directory.

It never replaces the input Queue path.

A proposal is not canonical state.

## Required inputs

The operator command requires:

```text
--queue
--execution
--batch-root
--as-of
```

Optional bounded backoff arguments are:

```text
--base-backoff-hours
--max-backoff-hours
```

The default evidence-backed values are:

```text
base: 6 hours
maximum: 48 hours
```

The command also supports:

```text
--check-only
```

Check-only mode validates and summarizes the proposal without writing output files.

## Execution boundary

Reconciliation accepts only a Banei retry execution matching:

```text
schema: calendar-runner-execution-v1
system: japan-banei-system
runner: github_actions
executor: banei-schedule-detail-actions
collection mode: selected_meetings
reason: rank_upgrade_retry
rank strategy: target_rank
```

The selected meeting IDs must exist exactly once in the input Retry Queue.

## Queue and Registry cross-check

Before reconciliation, every Queue entry is structurally validated.

Selected Banei retry entries must match current Registry routing:

```text
primary_runner: github_actions
fallback_runner: reviewed_import
adapter_id: banei-nar-race-list-detail-v1
supports_selected_meetings: true
supports_rank_upgrade_retry: true
```

Runner or adapter drift is rejected.

## Result artifact checks

The reconciliation command requires:

```text
candidates.json
result-manifest.json
review-queue.json
```

The candidate batch must remain:

```text
review.status: needs_review
```

The Result Manifest must match execution identity:

```text
system
Job
batch
runner
selected meeting scope
```

The Review Queue must contain exactly one batch entry and remain:

```text
review_state: review_ready
promotion_state: not_ready
```

An already approved or otherwise drifted batch is rejected by this operator proposal step.

## Success removal

A selected Queue entry qualifies for success removal when:

1. the Result Manifest does not list the meeting as unresolved; and
2. the candidate rank reaches the Queue target rank.

For example:

```text
Queue target: A+
result candidate: A+
unresolved: false
-> remove entry from proposed Queue
```

Success removal affects only the proposed Queue.

It does not approve or promote candidate data.

## Failure retention

A selected meeting remains in the proposed Queue when the batch result leaves it unresolved or fails to reach the target.

The proposed entry records:

```text
latest observed rank
attempt count + 1
last attempt time
next eligible retry time
```

This is failure retention.

A valid B or B+ schedule fallback remains valid evidence while detail work remains queued.

## Attempt count and backoff

For a failed retry:

```text
new attempt count = old attempt count + 1
last_attempt_at = as-of time
```

The next eligible time is derived from bounded exponential backoff:

```text
min(max_hours, base_hours * 2^old_attempt_count)
```

The merged proof validates:

```text
first failure: 6 hours
second failure: 12 hours
```

The reconciliation proposal records the concrete next eligible timestamp.

## Unselected entry isolation

Entries outside the execution selected-meeting scope are copied unchanged into the proposed Queue.

A deferred entry keeps its:

```text
current reviewed rank
latest observed rank
target rank
missing fields
retry reason
scope
runner routing
adapter
next eligible time
attempt count
last attempt time
```

The proposal checker requires semantic equality for the deferred fixture entry.

## Operator review boundary

The output is intentionally a proposal.

Operator review must confirm:

1. execution identity is the expected reviewed Job;
2. success removals correspond to target-reaching results;
3. retained failures correspond to unresolved or below-target results;
4. attempt count increments are correct;
5. next eligible timestamps follow policy;
6. unrelated Queue entries are unchanged;
7. Result Manifest and Review Queue state remain valid.

Only a separate explicit state-update step may replace authoritative Queue state.

This contract does not define automatic application.

## CLI behavior

The operator CLI is:

```text
scripts/timetable/reconcile-banei-retry-queue.mjs
```

Example check-only shape:

```text
node scripts/timetable/reconcile-banei-retry-queue.mjs \
  --queue=<queue.json> \
  --execution=<execution.json> \
  --batch-root=<batch-directory> \
  --as-of=<ISO-date-time> \
  --base-backoff-hours=6 \
  --max-backoff-hours=48 \
  --check-only
```

Check-only output reports:

```text
removed successes count
retained failures count
untouched meetings count
before Queue count
after Queue count
input Queue write performed: false
canonical write performed: false
```

## Side-effect boundary

The proposal records:

```text
input_queue_write_performed: false
canonical_write_performed: false
automatic_approval: false
promotion_performed: false
public_write_performed: false
publication_performed: false
deployment_performed: false
```

The reconciliation command performs no acquisition network fetch.

It consumes already generated local artifacts.

## Public data boundary

Reconciliation artifacts are control-plane state only.

They must not contain:

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

The reconciliation operator stage is complete when:

- input Queue structural validation passes;
- Queue entries cross-check Registry routing;
- execution identity is Banei selected-meeting rank retry;
- candidate batch remains needs_review;
- Result Manifest validates and matches execution identity;
- Review Queue validates and remains review_ready / not_ready;
- selected meetings exist exactly once in input Queue;
- success removal is calculated correctly;
- failure retention is calculated correctly;
- attempt count increments correctly;
- next eligible time follows bounded backoff;
- unselected deferred entries remain unchanged;
- proposal Queue validates structurally and against Registry;
- check-only mode leaves input Queue unchanged;
- no automatic Queue write occurs;
- no approval, promotion, publication, or deployment side effect occurs.

## Next handoff

The guarded explicit Queue state-update command is implemented in `docs/calendar/banei-retry-queue-state-apply.md`.

It requires:

1. a reviewed reconciliation proposal;
2. a reviewed approval artifact bound to exact source Queue, proposal, and target Queue SHA-256 digests;
3. exact stale-write guards;
4. explicit operator `--apply` action;
5. durable same-directory atomic replacement semantics;
6. backup and rollback evidence written before replacement;
7. explicit operator `--restore` action with a stale rollback guard;
8. no coupling to automatic acquisition execution, approval, promotion, publication, or deployment.

Reconciliation itself remains proposal-only. Banei now moves to freshness and rollback operating evidence, bilingual QA, and remaining public-display review.
