# NAR collection and July completion-audit contract

Status: active contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Pilot audit month: 2026-07

## Purpose

This contract defines the NAR-specific application of the cross-system incremental coverage model.

The July full-month collector remains useful as a bounded audit and pilot benchmark. It must not become the normal gate for accepting, reviewing, promoting, or publishing otherwise valid partial NAR batches.

The governing common contract is:

```text
docs/calendar/incremental-coverage-contract.md
```

## Required distinction

NAR work separates four concerns:

```text
ordinary incremental batch
promotion of reviewed records
coverage audit and retry planning
explicit July completion audit
```

Fixture compatibility proves parser compatibility with one complete meeting per racecourse. It is not schedule completeness.

A successful incremental batch may contain one meeting, many meetings, an arbitrary date window, an overlapping retry window, or selected meeting IDs.

## Source layers

NAR uses two official-source responsibilities:

1. schedule evidence — establishes known racecourse/date meeting identity for the scope observed;
2. RaceList and DebaTable — provide B/B+/A/A+ timetable detail when available and safely parsed.

A single operator run may use both responsibilities. The logical separation does not require every meeting to pass through an artificial C-only publication step.

If complete A+ evidence is available, the meeting may proceed directly as an A+ candidate.

## Incremental operator semantics

After the shared operator refactor, NAR collection must support:

- arbitrary date windows;
- overlapping windows;
- selected-meeting retries;
- irregular operator run dates;
- source-visible-horizon collection;
- valid partial success;
- explicit unresolved states;
- deterministic merge by stable meeting identity.

Requested range and observed source range must be recorded separately.

A requested month or wider range that is only partly exposed by the official source may still produce a successful partial batch.

## States

| State | Meaning |
| --- | --- |
| `meeting_complete` | Official detail exists and all fields required for the claimed meeting rank are complete. |
| `scheduled_pending_details` | Meeting existence is known, but reviewed detail is not yet available. |
| `not_observed` | The current run did not establish the meeting state. |
| `not_scheduled` | A reviewed complete schedule source explicitly establishes no meeting in the audited scope. |
| `meeting_incomplete` | A meeting exists but the claimed detail rank cannot be safely completed. |
| `source_unavailable` | The official source route cannot be fetched safely. |
| `parser_failure` | The source is reachable but cannot be parsed safely. |
| `cancelled_or_changed` | Reviewed official evidence explicitly supersedes prior meeting state. |

`no_meeting_in_target_month` remains valid only inside a defined full-month completion audit that has a reviewed complete schedule source for that exact month. It must not be inferred from absence in an ordinary partial batch.

## Absence and merge rule

Absence is not deletion.

A meeting missing from a later run must not be removed, cancelled, or downgraded solely because it was not observed.

For the same stable meeting identity:

```text
existing A+ + later C-only observation -> keep A+
existing A + later B observation -> keep A
existing C + later reviewed A+ -> promote to A+
```

Reviewed downgrade or deletion requires explicit official correction, discovered data error, source invalidation, publication-policy change, cancellation/change evidence, or rollback.

## Ordinary batch output

Ordinary incremental batches should produce review artifacts that record:

- requested scope;
- observed scope;
- meeting candidates;
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
- the current run overlaps a prior run.

## Promotion rule

Valid reviewed records may be promoted in partial batches.

Existing reviewed A+ promotions through 2026-07-04 remain valid partial data. Later reviewed batches may be promoted independently as official data becomes available.

Promotion validation must not require July completion.

## July 2026 completion audit

The existing full-month tooling is retained as a separate July completion-audit path.

The audit scope is:

```text
2026-07-01 through 2026-07-31 inclusive
```

The July completion audit may claim completion only when:

- all fourteen NAR flat-racing racecourses are classified for the audit scope;
- every official July meeting date is represented or explicitly blocked;
- future or unavailable detail gaps are explicit;
- no meeting is silently omitted;
- every represented meeting resolves to a reviewed rank, pending state, or explicit blocker according to the audit contract;
- the public projection and bilingual QA for the audited scope pass;
- freshness and rollback evidence pass.

A failed or incomplete July completion audit reports gaps and retry targets. It does not invalidate valid reviewed partial promotions.

## Existing July full-month artifacts

The bounded audit path may use:

```text
data/candidates/nar-monthly-2026-07-full-month-candidates.json
data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json
```

These files are audit/pilot artifacts. They do not define the global rule for ordinary Calendar updates.

## Validation responsibility split

NAR implementation must separate:

1. batch validation;
2. promotion validation;
3. coverage audit;
4. July completion audit.

The next implementation work must refactor current NAR operator and validator responsibilities to match this split before the pilot continues with additional data collection.
