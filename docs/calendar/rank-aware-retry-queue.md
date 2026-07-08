# Calendar Rank-aware Retry Queue contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The Rank-aware Retry Queue represents explicit follow-up acquisition work without flattening every gap into a generic retry.

One queue entry identifies one meeting and records:

```text
meeting identity
system identity
current reviewed rank
latest observed rank
collection target rank
missing fields
retry reason
retry scope
runner profile
adapter identity
next eligible retry time
attempt count
last attempt time
```

The Queue does not infer deletion or downgrade from a lower-detail later observation. It describes acquisition work only.

## Canonical artifacts

```text
data/static/calendar-rank-aware-retry-queue.schema.json
data/fixtures/calendar-rank-aware-retry-queue-fixtures-v1.json
data/fixtures/calendar-rank-aware-retry-queue-invalid-cases-v1.json
scripts/timetable/rank-aware-retry-queue-validation.mjs
scripts/check-calendar-rank-aware-retry-queue.mjs
.github/workflows/calendar-rank-aware-retry-queue.yml
```

## Required entry fields

```text
meeting_id
system_id
current_reviewed_rank
latest_observed_rank
collection_target_rank
missing_fields
retry_reason
retry_scope
primary_runner
fallback_runner
adapter_id
next_eligible_retry_at
attempt_count
last_attempt_at
```

## Rank model

Current and latest observed ranks use:

```text
C
B
B+
A
A+
```

Collection target rank uses those five ranks plus:

```text
best_available
```

Required rank-gap scenarios include:

```text
C -> best_available
B -> B+
B+ -> A
A -> A+
C -> A+ direct jump
```

A retry may jump directly to the highest supported reviewed rank. Intermediate ranks are not mandatory steps.

A later lower-detail observation does not lower `current_reviewed_rank`:

```text
current reviewed: A
latest observed:  B+
target:           A+
```

is a valid retry shape. Normal promotion remains monotonic and corrective downgrade remains a separate reviewed path.

## Target closure rule

An ordinary upgrade-oriented retry must have work left to do.

For an explicit target rank, the target must be above the current reviewed rank.

For `best_available`, the Acquisition Registry technical capability must be above the current reviewed rank.

A retry whose latest observation already satisfies its target is rejected as stale queue work.

Exceptions are limited to:

```text
source_revalidation
completion_audit_support
```

Those reasons may intentionally re-check a meeting already at its effective target.

## Missing fields

Initial shared missing-field vocabulary is:

```text
first_race_time_local
last_race_time_local
timetable_rows
race_name
distance_m
surface
course_label
```

Examples:

```text
B -> B+
missing_fields: [last_race_time_local]

B+ -> A
missing_fields: [timetable_rows]

A -> A+
missing_fields: [race_name, distance_m, surface, course_label]
```

Upgrade-oriented retries require at least one missing field. Source revalidation and Completion Audit support may use an empty missing-field set because they are verification work rather than an inferred rank gap.

## Retry reasons

Initial reasons are:

```text
scheduled_pending_details
detail_retry_required
coverage_gap
rank_upgrade_retry
source_revalidation
manual_recovery
completion_audit_support
```

The first two preserve the current NAR source-specific states rather than discarding them during shared Queue normalization.

`scheduled_pending_details` means the meeting identity is confirmed but higher detail was not yet available at observation time.

`detail_retry_required` means detail acquisition for a past/current meeting did not complete safely and must be retried explicitly.

Both NAR detail reasons currently require:

```text
current_reviewed_rank: C
collection_target_rank: best_available
adapter_id: Registry detail adapter
```

## Retry scopes

Supported shared retry scope shapes are:

```text
selected_meetings
date_window
single_date
source_visible_horizon
```

Selected-meeting scope must include the entry meeting ID.

A single-date or date-window scope must contain the meeting date when the stable meeting ID carries a terminal `YYYY-MM-DD` date.

Scope support is cross-checked against the Acquisition Registry. Cross-month retry windows require explicit cross-month support.

## Registry routing rule

The Queue does not invent runner or adapter routing.

For every registry-backed entry:

```text
primary_runner  == Acquisition Registry primary_runner
fallback_runner == Acquisition Registry fallback_runner
adapter_id      == registered schedule or detail adapter
```

Rank-oriented retry uses the registered detail adapter when one exists and requires `supports_rank_upgrade_retry=true`.

The Queue records routing facts but does not execute the runner.

## Backoff and attempt metadata

Initial backoff fields are:

```text
next_eligible_retry_at
attempt_count
last_attempt_at
```

Rules:

- attempt count zero requires `last_attempt_at=null`;
- positive attempt count requires a last-attempt timestamp;
- next eligible retry time cannot precede the last attempt time;
- `next_eligible_retry_at=null` means the shared Queue does not impose a time gate; it does not enable a scheduler.

Scheduled retry remains disabled until later due-job planning and scheduler stages are explicitly implemented.

## NAR July remainder projection

The current NAR v2 immutable artifact:

```text
data/generated/timetable/nar-incremental-batches/
  july-2026-08-through-31-run-001/
  retry-targets.json
```

contains 71 meeting targets with reason `scheduled_pending_details`.

The shared builder projects those targets by joining:

```text
NAR v2 retry artifact
+
canonical meetings
+
Acquisition Registry
```

For each target it verifies:

- the meeting exists canonically;
- current canonical rank is preserved as `current_reviewed_rank`;
- NAR Registry primary/fallback runner values are retained;
- NAR detail adapter is used;
- collection target remains Registry `best_available`;
- source-specific retry reason is preserved;
- the shared Queue entry passes rank-gap, scope, backoff, and safety validation.

The validator requires exactly 71 projected entries for the reviewed July remainder artifact. This is integration evidence, not a rule that all systems or future NAR batches must contain 71 entries.

## Multi-system rule

The Queue may contain work from several systems at once.

Each entry keeps its own:

```text
system
rank gap
scope
runner profile
adapter
reason
backoff
```

Multi-system retry planning must not force one common window or one runner across unrelated systems.

The later Collection Plan integration may group compatible retry work into independent Collection Jobs while preserving these entry-specific facts.

## Safety boundary

Rank-aware Retry Queue files contain acquisition work metadata only.

They must not contain:

- raw source bodies or HTML;
- credentials, cookies, tokens, or secrets;
- participant, horse, jockey, trainer, betting, odds, payout, prediction, or tip data;
- direct stream URLs;
- approval, promotion, publication, or deployment state.

The Queue does not perform canonical writes, public writes, deployment, or scheduling.

## Next handoff

After this foundation, Actions and local runners are connected to shared Collection Job and Result Manifest semantics.

NAR provides the Actions-primary/local-fallback compatibility case. JRA provides the local-primary compatibility case. Banei begins on the shared foundation after the minimum runner-neutral result semantics are connected.
