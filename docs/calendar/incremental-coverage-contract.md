# Calendar incremental coverage contract

Status: active cross-system contract  
Work ID: `WHR-CAL-INCREMENTAL-COVERAGE`  
Last reviewed: 2026-07-06

## Purpose

This contract defines the common acquisition and validation model for every racing system used by Where Horses Run.

Calendar maintenance must remain safe when:

- operator runs happen at irregular times;
- requested date ranges differ between runs;
- official sources expose only part of the requested future range;
- detail pages appear later than meeting dates;
- a later run overlaps earlier runs;
- previously unavailable meetings become available on a later retry;
- a source supports direct B, B+, A, or A+ acquisition without a C-only intermediate publication step.

No country, authority, or racing system may require month-wide completeness as a precondition for accepting, reviewing, promoting, or publishing an otherwise valid partial batch.

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
C + later A+ review -> promote to A+
```

A reviewed downgrade remains allowed when required by:

- official correction;
- discovered data error;
- source invalidation;
- publication policy change;
- rollback or safety control.

Freshness and source-health state are separate from rank and may become stale or degraded without destroying previously reviewed data.

## Validation split

Calendar validation is divided into four responsibilities.

### Batch validation

Checks the integrity of records produced by the current run.

It may reject malformed identities, impossible dates, unsupported ranks, prohibited fields, invalid source provenance, duplicate records in the batch, or unsafe state transitions.

It must not fail only because the requested month, season, or arbitrary date window is incomplete.

### Promotion validation

Checks whether reviewed records can safely update canonical data.

It validates source/readiness gates, review state, stable identity, rank shape, collision safety, freshness requirements, and deterministic merge behavior.

It must permit valid partial promotion batches.

### Coverage audit

Compares known public or official schedule coverage for a defined scope and reports gaps, pending detail, source failures, and retry targets.

A coverage audit may report incompleteness without blocking unrelated valid promotion batches.

### Completion audit

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
- review before canonical and public writes;
- unattended publication remaining disabled unless separately approved.

## Source-specific adapters

The common contract does not force all systems into identical parser paths.

A system may use:

- one source for meeting existence and another for timetable detail;
- one source that yields both meeting and A+ detail;
- a manual PDF/import path;
- a semi-automatic adapter;
- selected-meeting manual review.

System-specific semantics remain local to the adapter and review contract. For example, Banei-specific course and distance semantics must not inherit NAR flat-racing assumptions.

## NAR July 2026 role

The NAR July 2026 full-month collector remains useful as a bounded pilot coverage audit and benchmark.

It must not define the global rule that normal updates require a complete calendar month before promotion or publication. Existing reviewed partial promotions remain valid, later valid batches may be promoted independently, and the July completion audit remains a separate claim.

## Implementation order

The active sequence is:

1. establish this cross-system contract in canonical documentation;
2. split shared validation responsibilities into batch, promotion, coverage, and completion roles;
3. refactor the NAR operator path so incremental updates and July completion audit are separate;
4. continue NAR reviewed incremental acquisition and promotion;
5. implement Banei on the same common contract with Banei-specific parsing semantics;
6. apply the same model to HKJC, UAE, and later expansion systems.

All later Calendar implementation work must review this contract together with the applicable system-specific plan.
