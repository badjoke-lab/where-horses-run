# Banei Freshness and Rollback Operating Evidence

Status: active operating evidence contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-09

## Purpose

This contract records the first Banei operating evidence after the acquisition, retry, operator, reconciliation, and guarded Queue state-update foundations became available.

The evidence combines:

1. successful reviewed Banei Job evidence;
2. Operations v2 freshness calculation;
3. a freshness age 1 hour current scenario;
4. a 168-hour threshold breach scenario;
5. source health remains healthy across both freshness scenarios;
6. explicit Queue apply and rollback rehearsal evidence;
7. byte-for-byte restore proof;
8. stale apply rejection;
9. stale rollback rejection.

The purpose is to prove that freshness attention and rollback recovery can be operated without enabling unattended mutation or publication.

## Evidence origin

The freshness origin is:

```text
data/fixtures/calendar-banei-retry-ops-evidence-v1.json
```

That evidence was created only after the reviewed Banei retry Job proved:

```text
system: japan-banei-system
runner: github_actions
executor: banei-schedule-detail-actions
mode: selected_meetings
reason: rank_upgrade_retry
status: success
observed rank: A+
coverage: source_window_complete
unresolved meetings: 0
source errors: 0
review state: review_ready
promotion state: not_ready
publication effect: none
```

The evidence also retains SHA-256 digests for the status, candidate, Coverage Observation, Result Manifest, Review Queue, and collection report artifacts.

The successful evidence generation timestamp is used as the freshness origin timestamp for this operating scenario.

## Freshness policy

The Banei operating fixture uses:

```text
freshness threshold: 168 hours
```

The evidence does not infer source failure from age.

Source health and freshness are separate signals.

A healthy source may still require freshness attention when the last successful evidence is old enough.

## Current scenario

The current scenario uses:

```text
last successful collection evidence: 2026-07-09T05:30:36.432Z
as-of: 2026-07-09T06:30:36.432Z
freshness age: 1 hour
source health: healthy
freshness attention: false
```

The actual successful reviewed Banei Job evidence is also added to Operations v2 recent runtime history as:

```text
status: success
system: japan-banei-system
```

The existing planned Banei retry Job remains independently visible. A recent success does not erase planned work.

## Threshold breach scenario

The threshold scenario uses:

```text
last successful collection evidence: 2026-07-09T05:30:36.432Z
as-of: 2026-07-16T05:30:36.432Z
freshness age: 168 hours
source health: healthy
freshness attention: true
```

The source health remains healthy.

Only the freshness age crosses the configured threshold.

This proves the Operations v2 rule:

```text
healthy source
+ old successful evidence
-> freshness attention
```

without silently rewriting source health to degraded or unavailable.

## Operations v2 integration

The checker builds two real Operations v2 documents using the shared control-plane inputs:

```text
Due-job Plan
Due-job policy
runtime statuses
Review Queue
Retry Queue
Review Cohort Plan
Acquisition Registry
source states
publication snapshot
```

For Banei only, the source state is connected to the reviewed successful Job evidence:

```text
source_health: healthy
last_successful_collection_at: reviewed evidence generated_at
freshness_threshold_hours: 168
```

The Operations v2 builder remains read-only.

No Job execution is triggered by building either scenario.

## Rollback rehearsal

The rollback rehearsal reuses the reviewed Banei retry execution proof, Banei Actions executor artifact contract, proposal-only reconciliation, and guarded Queue state apply contracts.

The rehearsal path is:

```text
source Retry Queue
-> build reviewed execution proof
-> build candidate / Coverage / Manifest / Review Queue artifacts
-> build reconciliation proposal
-> bind exact source Queue SHA-256
-> bind exact proposal SHA-256
-> bind exact target Queue SHA-256
-> prepare explicit apply plan
-> reject repeated stale apply
-> prepare rollback plan
-> prove restored Queue text equals original Queue bytes
-> reject stale rollback current state
```

The fixture expects:

```text
Queue entries before apply: 3
Queue entries after proposal: 2
apply mode: explicit_operator_apply
rollback mode: explicit_operator_rollback
byte-for-byte restore: true
stale apply rejection: true
stale rollback rejection: true
```

## CLI durability dependency

The operating evidence checker also runs:

```text
scripts/check-calendar-banei-retry-queue-state-apply.mjs
```

That dependency proves the actual CLI path in temporary operating-system directories:

```text
validation-only no write
explicit --apply
backup before replacement
rollback evidence before replacement
same-directory temporary file
file fsync
atomic rename
directory fsync
post-apply digest verification
repeated stale apply rejection
rollback validation-only no write
explicit --restore
post-rollback digest verification
byte-for-byte restore
```

The operating evidence therefore does not replace the lower-level state-apply contract. It depends on it.

## Stale apply rejection

A reconciliation proposal is bound to exact source Queue bytes.

After the target Queue state is in place, applying the same proposal again is rejected because:

```text
current Queue SHA-256
!= proposal source Queue SHA-256
```

This protects later Queue state from stale reviewed proposals.

## Stale rollback rejection

Rollback evidence records the exact applied target Queue digest that must be present before restore.

If current Queue state changes after apply, rollback is rejected because:

```text
current Queue SHA-256
!= rollback required current Queue SHA-256
```

This prevents an old backup from erasing newer Queue changes.

## Read-only operating evidence boundary

The evidence builder and checker perform no network fetch.

They do not execute scheduled acquisition Jobs.

They do not apply Queue state to repository paths.

They do not publish or deploy.

The Queue state apply/rollback dependency runs only in temporary operating-system directories during fixture validation.

No automatic Queue mutation occurs.

## Evidence boundaries

Every evidence document records:

```text
network_fetch_performed: false
scheduler_execution_performed: false
automatic_queue_apply_performed: false
automatic_rollback_performed: false
approval_performed: false
promotion_performed: false
canonical_write_performed: false
public_write_performed: false
publication_performed: false
deployment_performed: false
```

## Public data boundary

This evidence contains operational metadata only.

It may contain:

- system identity;
- Job and batch identity;
- runner identity;
- status;
- capability rank;
- coverage claim;
- freshness timestamps and age;
- source health state;
- Queue entry counts;
- SHA-256 digests;
- operator attention markers;
- apply and rollback contract modes.

It must not contain:

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

The evidence does not change the timetable public display boundary.

## Completion boundary

This operating evidence stage is complete when:

- the successful reviewed Banei Job evidence is accepted as freshness origin;
- its artifact digest set is preserved in the operating evidence;
- Operations v2 shows Banei source health healthy at both scenario times;
- Operations v2 shows freshness age 1 hour with no freshness attention;
- Operations v2 shows a 168-hour threshold breach with freshness attention;
- source health remains unchanged across the freshness-only transition;
- recent successful Banei runtime history is visible without erasing planned work;
- rollback rehearsal begins from the reviewed retry proof path;
- apply and rollback plans use the guarded state-update contracts;
- byte-for-byte restore is true;
- stale apply rejection is true;
- stale rollback rejection is true;
- the actual state-apply CLI checker passes;
- no automatic Queue mutation occurs;
- no acquisition, approval, promotion, canonical write, public write, publication, or deployment side effect occurs.

## Next handoff

After this operating evidence is stable, Banei moves to:

1. bilingual QA;
2. remaining public-display review;
3. July whole-month Completion Audit only where an explicit full-month claim is needed;
4. explicit Banei handoff decision;
5. only then, the next source-specific pilot.
