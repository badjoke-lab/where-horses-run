# Calendar incremental coverage contract

Status: active cross-system contract  
Work ID: `WHR-CAL-INCREMENTAL-COVERAGE`  
Last reviewed: 2026-07-08

## Purpose

This contract defines the common acquisition and validation model for every racing system used by Where Horses Run.

Calendar maintenance must remain safe when:

- operator runs happen at irregular times;
- requested date ranges differ between runs;
- official sources expose only part of the requested future range;
- detail pages appear later than meeting dates;
- a later run overlaps earlier runs;
- previously unavailable meetings become available on a later retry;
- a source supports direct B, B+, A, or A+ acquisition without a C-only intermediate publication step;
- one system runs in GitHub Actions while another requires a local runner;
- one campaign contains multiple systems with different requested scopes;
- retry work targets rank gaps such as C to B+, B to A, or A to A+ rather than only C to A+.

No country, authority, or racing system may require month-wide completeness as a precondition for accepting, reviewing, promoting, or publishing an otherwise valid partial batch.

Runner choice must not change meeting identity, rank semantics, coverage semantics, review requirements, or promotion rules.

## Shared model

Every system uses three independent concerns.

### 1. Meeting / schedule layer

The meeting layer answers whether an official meeting is known for a date and racecourse.

Minimum public-safe meeting fields are:

- meeting identity;
- country;
- authority and racing system;
- racecourse;
- date;
- timezone;
- official source provenance;
- freshness and source status.

A meeting may enter the pipeline at C or at any higher supported rank. The architecture does not require an artificial C-only write before B, B+, A, or A+ promotion.

### 2. Timetable detail layer

The detail layer records the highest reviewed rank supported for the individual meeting:

```text
C -> B -> B+ -> A -> A+
```

The rank is evidence-bound per meeting. A system-level Technical Rank or Public Ceiling is only a maximum and does not invent missing meeting fields.

Later successful acquisition may raise a meeting rank. A temporary fetch failure or missing result in a later run must not automatically lower or delete a previously reviewed record.

### 3. Coverage observation

Coverage observation records what an operator attempted and what the source exposed at that time. It is not itself a completeness claim.

A coverage observation should be able to record:

```text
run_id
system_id
source_id
checked_at
requested_scope
observed_scope
collection_mode
records_discovered
records_updated
unresolved_dates
unresolved_meeting_ids
source_errors
coverage_claim
```

Allowed conceptual coverage claims are:

- `none` — no coverage conclusion is claimed;
- `partial` — some records were observed, but the requested range is not claimed complete;
- `source_window_complete` — all records exposed by the reviewed source window were processed;
- `audited_complete` — a separate completion audit established completeness for a defined range.

`partial` is a normal successful state.

## Five-rank operational model

All common acquisition planning, result summaries, review queues, and retry queues must preserve these ranks as first-class states:

```text
C
B
B+
A
A+
```

Conceptual field shapes are:

```text
C
meeting identity + date + racecourse

B
C + first race time

B+
B + final race start time

A
B+ timing envelope + complete per-race labels/numbers and post times

A+
A + reviewed programme-summary fields permitted by source and publication policy
```

The classifier must use observed evidence. It must not infer a final race time from a meeting end time, fabricate missing race rows, or fill summary fields to force a higher rank.

A run may observe different ranks for different meetings in the same scope.

The common contract does not require sequential intermediate writes. Valid direct transitions include:

```text
C -> B+
C -> A
C -> A+
B -> A
B -> A+
B+ -> A+
```

## Arbitrary collection windows

Operator collection windows may vary between runs.

Valid examples include:

```text
2026-07-01 .. 2026-07-31
2026-07-06 .. 2026-08-15
2026-07-20 .. 2026-09-01
selected meeting IDs only
one date only
source-visible horizon
```

Overlapping runs are expected. Stable meeting IDs and deterministic merge rules must make retries and overlaps safe.

A requested range and an observed source range are different facts. If an operator asks for two months but the source currently exposes only three weeks, the batch may still succeed as partial coverage.

Different systems in one Collection Plan may use different scopes. A campaign-level date range must not be invented merely to make multi-system execution look uniform.

## Runner-neutral collection

Collection may run through:

```text
github_actions
local
reviewed_import
```

The runner is an execution environment, not a data model.

The same shared semantics apply after collection:

```text
source-specific adapter output
-> field observation
-> rank classification
-> Batch Validation
-> Coverage Observation
-> Review Queue
-> Rank-aware Retry Queue
-> human review
-> Promotion Validation
```

A source profile may define primary and fallback runners. Fallback execution must preserve compatible batch identity, scope, rank, coverage, and review semantics.

Runner routing is governed by `docs/calendar/acquisition-control-plane-contract.md`.

## Multi-system Collection Plans

A Collection Plan may group independent jobs.

One plan may contain:

```text
JRA local job: one date window
NAR Actions job: a different date window
HKJC Actions job: selected meetings
UAE reviewed import job: a seasonal scope
```

Jobs remain independently validatable and reviewable.

```text
execution grouping
!=
review cohort
!=
promotion batch
```

One failed job must not invalidate unrelated successful or valid partial jobs.

## Absence is not deletion

A meeting missing from one acquisition result must not be treated as cancelled, unscheduled, or deleted merely because it was not observed.

The pipeline must distinguish at least these meanings where applicable:

| State | Meaning |
| --- | --- |
| `not_observed` | The current run did not establish the meeting state. |
| `scheduled_pending_details` | Meeting existence is known, but reviewed detail is not yet available. |
| `not_scheduled` | A reviewed complete schedule source explicitly establishes no meeting for the date/scope. |
| `source_unavailable` | The expected official source could not be fetched safely. |
| `parser_failure` | The source was reachable but could not be parsed safely. |
| `cancelled_or_changed` | A reviewed official change explicitly supersedes a prior meeting state. |

Deletion, cancellation, and date changes require explicit reviewed evidence or a separately approved reconciliation rule.

## Rank regression rule

A later run that obtains less information than an earlier reviewed run must not automatically downgrade the canonical or public meeting rank.

For the same stable meeting identity, normal incremental merge behavior is monotonic with respect to reviewed detail:

```text
A+ + C observation -> keep A+
A + B+ observation -> keep A
B+ + B observation -> keep B+
C + later A+ review -> promote to A+
```

A reviewed downgrade remains allowed when required by:

- official correction;
- discovered data error;
- source invalidation;
- publication policy change;
- rollback or safety control.

Freshness and source-health state are separate from rank and may become stale or degraded without destroying previously reviewed data.

## Rank-aware retry model

Retry state must not assume that all unresolved work is C to A+.

A retry target should be able to preserve:

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

Supported upgrade paths include:

```text
C -> B
C -> B+
C -> A
C -> A+
B -> B+
B -> A
B -> A+
B+ -> A
B+ -> A+
A -> A+
```

A retry may jump directly to the highest newly supported rank.

A meeting already at its effective collection target should not remain in rank-upgrade retry solely because its Technical Rank is theoretically higher. Source revalidation, coverage repair, official correction, and Completion Audit support remain separate retry reasons.

## Validation split

Calendar validation is divided into four responsibilities.

### Batch Validation

Checks the integrity of records produced by the current run.

It may reject malformed identities, impossible dates, unsupported ranks, prohibited fields, invalid source provenance, duplicate records in the batch, or unsafe state transitions.

It must not fail only because the requested month, season, or arbitrary date window is incomplete.

### Promotion Validation

Checks whether reviewed records can safely update canonical data.

It validates source/readiness gates, review state, stable identity, rank shape, collision safety, freshness requirements, and deterministic merge behavior.

It must permit valid partial promotion batches.

### Coverage Audit

Compares known public or official schedule coverage for a defined scope and reports gaps, pending detail, source failures, and retry targets.

A coverage audit may report incompleteness without blocking unrelated valid promotion batches.

### Completion Audit

Validates an explicit claim such as:

```text
July 2026 coverage complete
2026 season schedule complete
selected meeting set complete
```

Only this audit may require every expected meeting in the declared scope to be resolved according to the audit contract.

Completion is a claim about a defined scope, not a prerequisite for ordinary incremental maintenance.

## Operator-first initial operation

Initial production maintenance remains operator-triggered and human-reviewed.

The common model must support:

- irregular manual run dates;
- arbitrary and overlapping date windows;
- selected-meeting retries;
- partial source horizons;
- direct acquisition at the highest supported rank;
- separate schedule and detail adapters where source timing requires them;
- one combined adapter where the source exposes meeting and detail data together;
- GitHub Actions, local, or reviewed-import execution according to source profile;
- one plan containing multiple systems with independent scopes;
- review before canonical and public writes;
- unattended publication remaining disabled unless separately approved.

## Source-specific adapters

The common contract does not force all systems into identical parser paths.

A system may use:

- one source for meeting existence and another for timetable detail;
- one source that yields both meeting and A+ detail;
- one source that yields only B or B+ timing fields;
- a manual PDF/import path;
- a semi-automatic adapter;
- selected-meeting manual review.

System-specific semantics remain local to the adapter and review contract. For example, Banei-specific course and distance semantics must not inherit NAR flat-racing assumptions.

## Review and PR preparation

Validated collection output may be summarized into a Review Queue.

The queue must show all five rank counts and must keep collection success, human approval, promotion, publication, and completeness separate.

A broad campaign may produce several review cohorts or PRs.

The preferred automation stop point is:

```text
automatic acquisition
-> automatic normalization
-> automatic validation
-> automatic Coverage Audit
-> automatic bounded retry planning
-> automatic review PR preparation
-> HUMAN REVIEW REQUIRED
```

Review PR creation does not imply approval.

## NAR July 2026 role

The NAR July 2026 full-month collector remains useful as a bounded pilot coverage audit and benchmark.

It must not define the global rule that normal updates require a complete calendar month before promotion or publication. Existing reviewed partial promotions remain valid, later valid batches may be promoted independently, and the July completion audit remains a separate claim.

The current NAR v2 source behavior may produce C and A+ as the observed states for a run. That source-specific outcome must not redefine the common five-rank operational model.

## Implementation order

The active shared sequence is:

1. finish the current NAR July remainder review, promotion, projection, and publication sequence;
2. close temporary diagnostic acquisition PRs without merge;
3. formalize NAR GitHub Actions manual dispatch with local fallback;
4. implement the Acquisition Registry;
5. implement Collection Job and Collection Plan schemas;
6. implement five-rank classifier contract tests;
7. implement Collection Result Manifest, Review Queue, and Rank-aware Retry Queue foundations;
8. connect Actions and local runners to the same job semantics;
9. resume Banei on the shared control-plane foundation;
10. add multi-system execution, automatic review PR preparation, due-job planning, and scheduled bounded retries incrementally.

The detailed schedule is defined in `docs/calendar/acquisition-control-plane-implementation-plan.md`.

All later Calendar implementation work must review this contract together with `docs/calendar/acquisition-control-plane-contract.md` and the applicable system-specific plan.
