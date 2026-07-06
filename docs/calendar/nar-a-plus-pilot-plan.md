# NAR A+ pilot plan

Status: active  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Pilot audit month: 2026-07  
Current phase: shared incremental coverage implementation and NAR operator refactor  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

## Governing contracts

This pilot follows:

- `docs/calendar/incremental-coverage-contract.md`;
- `docs/calendar/machine-readable-contracts.md`;
- `docs/calendar/implementation-roadmap.md`;
- `docs/calendar/nar-monthly-collection-contract.md`.

The NAR pilot must not introduce a NAR-only rule that ordinary updates require a complete calendar month before valid records can be reviewed or promoted.

## Scope

The NAR flat-racing scope is fourteen racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains a separate Banei Work ID.

The reviewed A+ promotion through 2026-07-04 is valid partial data. It remains published evidence and does not need to wait for the rest of July.

The July 2026 full-month path remains a bounded completion audit and pilot benchmark. It is not the normal promotion gate for later incremental batches.

## Shared acquisition model

NAR uses the common three-concern model:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

For NAR specifically:

- the official schedule source may establish racecourse/date meeting identity;
- RaceList and DebaTable provide A+ timetable detail when available;
- a valid meeting may be published at C or a higher supported rank;
- a meeting already supported at A+ must not be downgraded merely because a later run observes only schedule-level data;
- future or temporarily unavailable detail must not erase known meeting identity;
- ordinary operator runs may use arbitrary, overlapping, or retry windows after the shared operator refactor.

## Completed sequence

1. source architecture — complete;
2. route probe — complete;
3. candidate adapter — complete;
4. all-fourteen compatibility audit — complete;
5. complete fixture coverage 14/14 — complete;
6. first reviewed A+ promotion through 2026-07-04 — complete as valid partial data;
7. July full-month schedule collector and audit path — complete as pilot tooling;
8. generated full-month candidate PR validation — complete.

## Current sequence

1. implement the shared incremental coverage contract in machine-readable schemas and validators;
2. split validation into batch, promotion, coverage, and completion responsibilities;
3. refactor NAR normal collection away from the fixed July full-month completion gate;
4. support arbitrary and overlapping windows plus selected-meeting retries;
5. add coverage observation and retry-target output;
6. collect the next source-visible NAR batch;
7. review and promote valid records independently of unresolved dates elsewhere;
8. continue incremental retries as source detail becomes available;
9. run the July completion audit only when claiming July coverage complete;
10. complete public projection, freshness, rollback, and bilingual QA.

## Source layers

The NAR official source architecture distinguishes:

1. schedule source evidence for meeting existence;
2. RaceList and DebaTable evidence for timetable detail.

This does not force two physical publication steps. If one acquisition run produces complete A+ evidence for a meeting, that meeting may proceed directly through A+ candidate review and promotion.

A future scheduled meeting with unavailable detail may remain `scheduled_pending_details` when existence is known. A missing result from one run is only `not_observed` unless a reviewed complete schedule source establishes a stronger state.

Mizusawa and Himeji have no July 2026 meetings according to the reviewed July schedule audit. That conclusion is specific to that audited scope and must not be generalized to later arbitrary windows.

## Ordinary batch success conditions

An ordinary NAR incremental batch succeeds when:

- its requested and observed scopes are explicit;
- produced records pass batch validation;
- every record has stable identity and official source provenance;
- supported rank fields are internally complete;
- prohibited fields are absent;
- unresolved dates and meetings are reported rather than silently converted into no-meeting conclusions;
- partial coverage is labelled honestly;
- review remains required before canonical/public updates;
- unattended publication remains disabled.

The batch does not require the entire calendar month to be complete.

## July completion audit

The separate July 2026 completion audit may claim completion only when:

- exact audit window is 2026-07-01 through 2026-07-31;
- all fourteen racecourses are classified for that audit scope;
- every official July meeting date is represented or explicitly blocked;
- pending and unavailable states are explicit;
- no partial cutoff is misrepresented as month completion;
- public projection, bilingual QA, freshness, and rollback evidence pass.

Failure of the completion audit must not roll back or block unrelated valid partial batches already reviewed and promoted.

## Banei handoff

The following Banei Work ID inherits the same cross-system incremental coverage contract.

Banei does not inherit a rule that ordinary updates must cover the entire month before publication. Its July full-month check is likewise a separate completion audit. Banei detail parsing remains separate from flat-racing assumptions.
