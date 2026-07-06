# Japan full-month completion-audit policy

Status: active scope policy  
Applies to: `WHR-CAL-JAPAN-JRA-A-PLUS`, `WHR-CAL-JAPAN-NAR-A-PLUS`, `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Pilot audit month: 2026-07  
Last reviewed: 2026-07-06

## Governing relationship

This policy is subordinate to the cross-system incremental coverage contract:

```text
docs/calendar/incremental-coverage-contract.md
```

The July full-month rule applies only when making an explicit July completion claim. It is not a prerequisite for ordinary batch validation, human review, promotion, or publication of otherwise valid partial records.

## Completion-audit boundary

For a July 2026 completion claim, the audit window is:

```text
2026-07-01 through 2026-07-31 inclusive
```

A partial `through_date` run may be used for diagnostics, incremental collection, review, or intermediate promotion. It is never by itself evidence that the whole month is complete.

At the same time, an incomplete July audit must not block valid reviewed partial batches from being promoted.

## Common operating rule

Japan system operators may run at irregular times and may use arbitrary, overlapping, or selected-meeting scopes.

The system must distinguish:

```text
requested scope
observed source scope
valid records produced
unresolved dates or meetings
coverage claim
```

A successful ordinary run may have partial coverage.

A meeting may enter at C, B, B+, A, or A+ according to reviewed evidence. A source that directly supports A+ does not need an artificial C-only publication step.

Absence in one run is not deletion, cancellation, or proof of no meeting.

## JRA

JRA July coverage remains a completed reference implementation for the reviewed July programme.

That result does not create a global rule that every future JRA update, or every other system update, must complete a whole month before promotion.

Future JRA maintenance must follow the same incremental rules for arbitrary windows, partial success, overlap safety, freshness, and separate completion claims.

## NAR flat racing

The NAR flat-racing Work ID covers all fourteen flat-racing racecourses.

NAR distinguishes two source responsibilities:

1. official schedule evidence for known racecourse/date meetings;
2. RaceList and DebaTable evidence for timetable detail when available.

Future or unavailable detail must not erase known meeting identity.

The July full-month collector remains a bounded completion-audit path. Ordinary NAR batches may be promoted independently when their records pass batch, review, and promotion validation.

The first reviewed A+ promotion through 2026-07-04 remains valid partial data.

## Banei

Banei remains a separate Work ID and parser path.

Its July completion audit uses the same explicit audit boundary:

```text
2026-07-01 through 2026-07-31 inclusive
```

However, ordinary Banei updates do not require whole-month completion before valid partial records can be reviewed and promoted.

Banei schedule and detail acquisition may be separate or combined according to official source behavior. Banei-specific race detail must use Banei semantics and must not inherit NAR flat-racing assumptions.

## Completion claim conditions

A Japan system may claim a defined scope complete only when the applicable completion audit establishes:

- the declared scope start and end are explicit;
- the authoritative schedule expectation for that scope is defined;
- every expected meeting is represented or explicitly blocked;
- pending, unavailable, changed, or cancelled states are explicit where applicable;
- no meeting is silently omitted;
- every available reviewed detail record is represented at the highest supported rank;
- public projection and bilingual QA pass for the claim scope;
- freshness and rollback evidence pass.

These conditions govern the completion claim only.

## Non-blocking rule

Coverage audit and completion audit results must not block unrelated valid incremental promotions.

Example:

```text
July audit: incomplete because five future meetings remain unresolved
Current batch: three newly available meetings pass review and promotion validation
Result: promote the three valid meetings; keep the July audit incomplete and retain five retry targets
```

This rule applies to NAR, Banei, JRA future maintenance, and later systems that use explicit completion audits.
