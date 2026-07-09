# Banei Retry Execution Proof

Status: active proof contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Shared Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-09

## Purpose

This proof validates Banei rank-upgrade retry execution semantics before activating canonical Registry retry capability or canonical Banei Due-job policy.

The proof path is:

```text
canonical Registry and Due-job policy remain conservative
-> proof clone only enables retry capability in memory
-> Retry Queue contains due and deferred entries
-> Due-job Planner evaluates backoff and attempt limits
-> one selected-meeting Job is planned
-> GitHub Actions Banei executor normalization runs
-> one meeting succeeds to A+
-> one meeting retains B fallback and remains unresolved
-> Result Manifest and Review Queue validate
-> Retry Queue result transition is applied
-> success removal
-> failure retention
-> attempt accounting
-> exponential backoff
-> deferred entry remains unchanged
```

The proof does not mutate canonical policy files.

## Canonical precondition

Before this proof is accepted:

```text
Acquisition Registry:
  japan-banei-system.supports_rank_upgrade_retry = false

Due-job policy:
  japan-banei-system.enabled = false
  japan-banei-system.rank_retry.enabled = false
```

These values remain unchanged by this proof PR.

The canonical Registry remains disabled for rank-upgrade retry until proof evidence is reviewed separately.

## Proof clone only

The proof builds two in-memory candidate clones.

### Registry proof clone

The clone keeps the active Banei runner profile:

```text
primary_runner: github_actions
fallback_runner: reviewed_import
supports_selected_meetings: true
```

and changes only:

```text
supports_rank_upgrade_retry: true
```

### Due-job policy proof clone

The clone enables only the Banei rank-retry planning path:

```text
system enabled: true
regular refresh: false
coverage gap: false
source revalidation: false
rank retry: true
max selected meetings per Job: 2
max attempt count: 3
```

The repository's canonical policy remains unchanged.

## Retry Queue fixture

The proof fixture contains three Banei retry entries.

### Due success candidate

```text
meeting: banei-obihiro-racecourse-2026-07-04
current reviewed rank: B
latest observed rank: B
target: A+
next eligible: null
attempt count: 0
```

### Due failure candidate

```text
meeting: banei-obihiro-racecourse-2026-07-05
current reviewed rank: B
latest observed rank: B
target: A+
next eligible: 2026-07-09T05:00:00Z
attempt count: 0
```

### Deferred candidate

```text
meeting: banei-obihiro-racecourse-2026-07-06
current reviewed rank: B+
latest observed rank: B+
target: A+
next eligible: 2026-07-10T06:00:00Z
attempt count: 1
```

Proof planning time is:

```text
2026-07-09T06:00:00Z
```

This creates a deterministic due versus deferred boundary.

## Due versus deferred planning

The Due-job Planner must select exactly the first two entries.

The deferred entry must not enter the planned Job because its `next_eligible_retry_at` is later than the planning time.

The expected Job is:

```text
system: japan-banei-system
mode: selected_meetings
reason: rank_upgrade_retry
rank strategy: target_rank
target rank: A+
runner policy: registry_primary_or_fallback
selected meetings: 2
```

The Planner uses the existing shared retry planning path. The proof does not introduce a Banei-only scheduler.

## Selected-meeting Job execution

The planned selected-meeting Job compiles through:

```text
runner_used: github_actions
executor_id: banei-schedule-detail-actions
```

The proof then uses the same Banei Actions normalization core already validated for partial batches.

The deterministic result is:

```text
records discovered: 2
records updated: 1
coverage: partial
rank counts:
  B: 1
  A+: 1
unresolved meetings: 1
source errors: 1
```

The first meeting is the A+ success.

The second meeting retains valid B schedule evidence and remains unresolved.

## Result Manifest

The retry proof must produce a valid Collection Result Manifest.

The Manifest preserves:

```text
campaign identity
Job identity
batch identity
Banei system identity
GitHub Actions runner identity
selected-meeting requested scope
observed scope
partial coverage claim
records discovered
records updated
rank counts
unresolved meeting IDs
source errors
artifact references
```

The rank total must equal records discovered.

The Manifest must cross-check exactly against Coverage Observation.

## Review Queue

The proof batch enters Review Queue as:

```text
review_state: review_ready
promotion_state: not_ready
```

This proves retry execution can feed the existing human review path without automatic approval or promotion.

The Review Queue entry must cross-check against Result Manifest identity, scope, rank counts, unresolved counts, source-error count, and Manifest reference.

## Success removal

A selected retry entry is removed from Retry Queue only when:

1. it is not unresolved in the Result Manifest; and
2. the resulting candidate rank reaches the entry's retry target.

For the proof:

```text
2026-07-04 B -> A+
```

The entry is removed after successful target attainment.

This is success removal, not automatic canonical promotion. Candidate review and Promotion Validation remain separate.

## Failure retention

A selected retry entry remains in Retry Queue when the Result Manifest still lists the meeting as unresolved.

For the proof:

```text
2026-07-05 remains B fallback
```

The entry remains queued with updated attempt state.

This failure retention preserves valid schedule evidence while keeping unresolved detail work explicit.

## Attempt accounting

For a failed selected retry:

```text
attempt_count = attempt_count + 1
last_attempt_at = proof execution time
```

First failure proof:

```text
attempt count: 0 -> 1
last attempt: 2026-07-09T06:00:00Z
```

A second deterministic failure proof increments:

```text
attempt count: 1 -> 2
```

The proof also verifies that an entry already at `max_attempt_count` is excluded from a newly planned retry Job.

## Exponential backoff

The proof policy uses:

```text
base backoff: 6 hours
maximum backoff: 48 hours
```

The deterministic rule is:

```text
backoff = min(max_hours, base_hours * 2^previous_attempt_count)
```

Therefore:

```text
first failure:  6 hours
second failure: 12 hours
```

The proof verifies both transitions.

Backoff calculation changes Retry Queue state only. It does not schedule execution by itself.

## Deferred entry isolation

The deferred 2026-07-06 entry is not part of the selected Job.

The proof requires byte-equivalent semantic state for that entry before and after result application.

This proves failure/success processing for one Job does not mutate unrelated deferred retry state.

## Failure isolation

The proof result intentionally mixes:

```text
one successful A+ retry
one unresolved B fallback retry
```

The successful meeting is removed from Queue while the failed meeting is retained and backed off.

The failed meeting does not erase or downgrade the successful meeting result.

The successful meeting does not hide the unresolved failure.

## Activation boundary

This PR is evidence only.

It must not change canonical:

```text
supports_rank_upgrade_retry
Banei Due-job system enabled state
Banei rank_retry policy enabled state
```

A later activation PR may use this evidence to enable only the proven capability.

That later PR must separately validate all shared Retry Queue, Due-job Planner, Actions executor, Registry, Manifest, Review Queue, Operations, and release gates.

## Public and safety boundary

Retry proof artifacts are control-plane summaries and public-safe programme-level data only.

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

## Side-effect boundary

The proof records and enforces:

```text
canonical Registry mutated: false
canonical Due-job policy mutated: false
automatic approval: false
promotion performed: false
canonical write performed: false
public write performed: false
publication performed: false
deployment performed: false
```

## Completion boundary

The Banei retry execution proof is complete when:

- canonical Registry retry support remains false;
- canonical Banei Due-job policy remains disabled;
- proof Registry clone enables retry support only in memory;
- proof policy clone enables Banei rank retry only in memory;
- two entries are due;
- one entry is deferred;
- one selected-meeting Job is planned;
- the Job resolves to GitHub Actions and the Banei executor;
- Result Manifest validates;
- Coverage Observation cross-checks Manifest;
- Review Queue validates and cross-checks Manifest;
- one success reaches A+ and is removed from Queue;
- one failure retains B fallback evidence;
- failed retry attempt count increments;
- first failure backoff is 6 hours;
- second failure backoff is 12 hours;
- deferred entry remains unchanged;
- max-attempt cap suppresses capped entries from new retry Jobs;
- no canonical activation or publication side effect occurs.

## Next handoff

After this proof is merged, the next PR may activate Banei retry capability conservatively:

1. set `supports_rank_upgrade_retry` to true;
2. enable Banei system policy only for `rank_retry`;
3. set bounded retry batch and attempt limits from reviewed proof values;
4. keep regular refresh, coverage-gap, source-revalidation, cross-month, and source-visible-horizon automation disabled;
5. keep the scheduler artifact-only and non-executing;
6. rerun Retry Queue, Due-job Planner, Banei executor, Actions multi-job, Operations, pipeline, and release gates.
