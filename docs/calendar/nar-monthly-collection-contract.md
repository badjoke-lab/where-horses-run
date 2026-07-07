# NAR collection and July completion-audit contract

Status: active contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Pilot audit month: 2026-07  
Last reviewed: 2026-07-08

## Purpose

This contract defines the NAR-specific application of the cross-system incremental coverage and Acquisition Control Plane models.

The July full-month collector remains useful as a bounded audit and pilot benchmark. It must not become the normal gate for accepting, reviewing, promoting, or publishing otherwise valid partial NAR batches.

Governing common contracts:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
```

## Required distinction

NAR work separates:

```text
ordinary incremental collection
runner execution environment
promotion of reviewed records
coverage audit and retry planning
rank-aware retry state
explicit July completion audit
```

Fixture compatibility proves parser compatibility with one complete meeting per racecourse. It is not schedule completeness.

A successful incremental batch may contain one meeting, many meetings, an arbitrary date window, an overlapping retry window, a cross-month window, or selected meeting IDs.

## Source layers

NAR uses two official-source responsibilities:

1. Schedule evidence — establishes known racecourse/date meeting identity for the observed scope;
2. RaceList and DebaTable — provide B/B+/A/A+ timetable detail when available and safely parsed.

The present NAR v2 adapter may commonly classify meetings as C or A+ based on currently observed source behavior. That outcome is source-specific and must not redefine the shared five-rank model.

A single Collection Job may use both source responsibilities. The logical separation does not require every meeting to pass through an artificial C-only publication step.

If complete higher-rank evidence is available, the meeting may proceed directly at the highest supported rank.

## Runner model

Current state:

```text
local v2 runner: available
bounded GitHub Actions acquisition: successful
formal workflow_dispatch normal operation: pending
```

Target state after formal workflow activation:

```text
primary runner: github_actions
fallback runner: local
```

Runner choice must not alter:

- batch identity semantics;
- rank semantics;
- Coverage Observation;
- review requirements;
- retry semantics;
- promotion rules;
- publication boundaries.

Temporary diagnostic workflows are not the canonical steady-state operation.

## Incremental operator semantics

NAR collection supports:

- arbitrary date windows;
- overlapping windows;
- cross-month windows;
- selected-meeting retries;
- irregular operator run dates;
- valid partial success;
- explicit unresolved states;
- deterministic merge by stable meeting identity;
- immutable batch-specific outputs.

Requested range and observed source range must be recorded separately.

A requested month or wider range that is only partly exposed by the official source may still produce a successful partial batch.

## States

| State | Meaning |
| --- | --- |
| `meeting_complete` | Official detail exists and all fields required for the claimed meeting rank are complete. |
| `scheduled_pending_details` | Meeting existence is known, but reviewed detail is not yet available. |
| `not_observed` | The current run did not establish the meeting state. |
| `not_scheduled` | A reviewed complete Schedule source explicitly establishes no meeting in the audited scope. |
| `meeting_incomplete` | A meeting exists but the claimed detail rank cannot be safely completed. |
| `source_unavailable` | The official source route cannot be fetched safely. |
| `parser_failure` | The source is reachable but cannot be parsed safely. |
| `cancelled_or_changed` | Reviewed official evidence explicitly supersedes prior meeting state. |

`no_meeting_in_target_month` remains valid only inside a defined full-month Completion Audit that has a reviewed complete Schedule source for that exact month. It must not be inferred from absence in an ordinary partial batch.

## Five-rank semantics

NAR follows the shared order:

```text
C < B < B+ < A < A+
```

Current and future NAR source adapters must classify evidence honestly:

```text
meeting only -> C
+ first race time -> B
+ final race start time -> B+
+ complete per-race post times -> A
+ permitted reviewed programme summary -> A+
```

The implementation must not infer a final race time from a meeting end time or fabricate missing race rows.

Direct monotonic transitions are allowed when evidence supports them.

## Absence and merge rule

Absence is not deletion.

A meeting missing from a later run must not be removed, cancelled, or downgraded solely because it was not observed.

For the same stable meeting identity:

```text
existing A+ + later C observation -> keep A+
existing A + later B+ observation -> keep A
existing B+ + later B observation -> keep B+
existing C + later reviewed A+ -> promote to A+
```

Reviewed downgrade or deletion requires explicit official correction, discovered data error, source invalidation, publication-policy change, cancellation/change evidence, or rollback.

## Ordinary batch output

Ordinary incremental batches should produce review artifacts that record:

- requested scope;
- observed scope;
- meeting candidates;
- rank distribution;
- pending detail;
- unresolved dates or meeting IDs;
- source errors;
- coverage claim;
- retry targets.

Candidate, canonical, public, and raw-source writes remain separated according to Pipeline v1 boundaries.

## Ordinary batch success conditions

An ordinary incremental batch succeeds when:

- produced records pass structural and source-specific validation;
- stable meeting identities are unique within the batch;
- rank-specific required fields are complete;
- source provenance and checked time are valid;
- prohibited fields are absent;
- unresolved items are explicit;
- partial coverage is labelled honestly;
- review is required before promotion;
- canonical/public writes do not occur as collection side effects.

The following are not ordinary batch failure conditions by themselves:

- the requested month is incomplete;
- future dates are not yet exposed by the source;
- only part of the requested range is observed;
- another valid meeting elsewhere in the month remains unresolved;
- the current run overlaps a prior run;
- different meetings resolve to different supported ranks.

## Promotion rule

Valid reviewed records may be promoted in partial batches.

Reviewed NAR detail through 2026-07-07 is already published. Later reviewed batches may be promoted independently as official data becomes available.

Promotion Validation must not require July completion.

Normal promotion remains monotonic across C/B/B+/A/A+.

## Retry transition

Current NAR v2 artifacts record retry date targets, meeting targets, and reason counts.

The Acquisition Control Plane will move NAR into a Rank-aware Retry Queue with:

```text
current_reviewed_rank
latest_observed_rank
collection_target_rank
missing_fields
retry_reason
retry_scope
primary_runner
fallback_runner
adapter_id
retry timing/backoff
attempt history
```

The queue must support broad date-window retry and selected-meeting retry.

## July 2026 Completion Audit

The existing full-month tooling is retained as a separate July Completion Audit path.

The audit scope is:

```text
2026-07-01 through 2026-07-31 inclusive
```

The July Completion Audit may claim completion only when:

- all fourteen NAR flat-racing racecourses are classified for the audit scope;
- every official July meeting date is represented or explicitly blocked;
- future or unavailable detail gaps are explicit;
- no meeting is silently omitted;
- every represented meeting resolves to a reviewed rank, pending state, or explicit blocker according to the audit contract;
- the public projection and bilingual QA for the audited scope pass;
- freshness and rollback evidence pass.

A failed or incomplete July Completion Audit reports gaps and retry targets. It does not invalidate valid reviewed partial promotions.

## Existing July full-month artifacts

The bounded audit path may use:

```text
data/candidates/nar-monthly-2026-07-full-month-candidates.json
data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json
```

These files are audit/pilot artifacts. They do not define the global rule for ordinary Calendar updates.

## Current repository state

The July 8–31 immutable review batch is committed with:

```text
schedule-confirmed meetings: 82
A+ detail candidates:         11
C schedule candidates:        71
schedule errors:               0
coverage claim:                source_window_complete
pending detail retries:       71
```

Current order:

1. finish review/promotion/publication for this batch;
2. close temporary diagnostic PRs without merge;
3. formalize NAR Actions manual dispatch;
4. keep local fallback;
5. register NAR in the Acquisition Registry;
6. connect NAR to Collection Job/Plan, Review Queue, and Rank-aware Retry Queue contracts.

## Validation responsibility split

NAR implementation separates:

1. Batch Validation;
2. Promotion Validation;
3. Coverage Audit;
4. July Completion Audit.

The source-specific NAR path now feeds the shared control-plane programme. Future orchestration work must follow the common contracts rather than introducing new NAR-only job, plan, review, or retry formats.
