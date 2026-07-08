# Calendar Review Queue contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The Review Queue is the shared operator-facing inventory of validated Collection Job result batches and their human review and promotion progress.

The Queue is a projection layer. It does not replace Collection Result Manifest, candidate, Coverage Observation, review decision, promotion validation, canonical data, or public projection artifacts.

One queue entry represents one immutable batch identity.

## Canonical artifacts

```text
data/static/calendar-review-queue.schema.json
data/fixtures/calendar-review-queue-v1.json
data/fixtures/calendar-review-queue-invalid-cases-v1.json
scripts/timetable/review-queue-validation.mjs
scripts/check-calendar-review-queue.mjs
.github/workflows/calendar-review-queue.yml
```

## Entry fields

Each entry contains:

```text
campaign_id
job_id
batch_id
system_id
runner_used
requested_scope
coverage_claim
rank_counts.C
rank_counts.B
rank_counts.B+
rank_counts.A
rank_counts.A+
unresolved_dates_count
unresolved_meeting_ids_count
source_error_count
review_state
promotion_state
manifest_ref
```

Identity, runner, scope, coverage claim, rank counts, and unresolved/source-error counts must match the referenced Collection Result Manifest.

The Queue adds only bounded operator workflow state.

## Five-rank visibility

Every queue entry preserves all five rank counts:

```text
C
B
B+
A
A+
```

A C-heavy batch, a B/B+-heavy batch, and an A/A+-heavy batch must be distinguishable without opening candidate files.

Source-specific current behavior does not narrow the shared Queue model. NAR may currently produce C and A+ in one source path while JRA or later systems may produce other supported rank distributions.

## Review state

Initial review states are:

```text
review_ready
reviewing
approved
rejected
```

`review_ready` means the batch and summary artifacts are validated and ready for a human decision. It does not mean approved.

`reviewing` means human review is in progress.

`approved` means the human review decision permits the batch to proceed to the applicable promotion validation path. It does not itself perform promotion.

`rejected` means the batch is not promotion-ready.

## Promotion state

Initial promotion states are:

```text
not_ready
promotion_ready
promoted
published
```

State invariants:

- `review_ready`, `reviewing`, and `rejected` require `promotion_state=not_ready`;
- `promotion_ready`, `promoted`, and `published` require `review_state=approved`;
- `approved + not_ready` is valid when review is complete but promotion validation or another explicit gate remains pending.

Queue state records progress. It does not approve, promote, publish, or deploy anything.

## Manifest projection rule

The queue builder derives these fields from one validated Collection Result Manifest:

```text
campaign/job/batch/system identity
runner_used
requested_scope
coverage_claim
five-rank counts
unresolved date count
unresolved meeting count
source error count
```

The validator cross-checks the projection against the matching Manifest.

The Queue must not silently rewrite:

- runner identity;
- requested scope;
- coverage claim;
- rank distribution;
- unresolved counts;
- source error count.

## Queue independence

A Collection Plan may produce independent queue entries such as:

```text
JRA local batch        -> review_ready
NAR Actions batch      -> reviewing
NAR fallback retry     -> approved / promotion_ready
HKJC bounded batch     -> rejected / not_ready
```

One failed or rejected batch must not erase or downgrade unrelated queue entries.

Batch IDs and manifest references are unique within one queue snapshot.

## Operator views

The Queue supports operator filtering and summarization by:

```text
system
campaign
runner
rank distribution
coverage claim
unresolved count
source error count
review state
promotion state
```

The validation core also emits a deterministic aggregate summary over review state, promotion state, system counts, rank counts, unresolved counts, and source errors.

## Safety boundary

Review Queue files contain summary and workflow-state metadata only.

They must not contain:

- raw source bodies or HTML;
- credentials, cookies, tokens, or secrets;
- participant, horse, jockey, trainer, betting, odds, payout, prediction, or tip data;
- direct stream URLs.

The Queue is not a publication system and must not create approval, promotion, canonical write, public write, deployment, or scheduler side effects.

## Next handoff

The Review Queue provides the operator-facing validated-batch inventory required before Rank-aware Retry Queue foundation and runner-neutral multi-job execution are connected.

Retry state remains separate. A Queue entry may report unresolved counts, but retry target identity, rank gaps, missing fields, backoff, and attempt history belong to the Rank-aware Retry Queue contract.
