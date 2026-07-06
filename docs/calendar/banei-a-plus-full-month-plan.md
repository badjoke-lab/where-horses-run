# Banei A+ incremental plan and July completion audit

Status: queued next Work ID  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Pilot audit month: 2026-07  
Last reviewed: 2026-07-06

## Governing contract

Banei follows:

```text
docs/calendar/incremental-coverage-contract.md
```

The Banei implementation must support irregular manual runs, arbitrary and overlapping date windows, selected-meeting retries, partial source horizons, and valid partial promotion batches.

The July full-month check is a completion audit, not a gate on ordinary valid updates.

## Shared model

Banei uses the common three-concern model:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
```

A Banei meeting may enter at C or at any higher reviewed rank supported by the official source. The implementation must not force an artificial C-only publication step when the source directly supports B, B+, A, or A+.

## Separation from NAR flat racing

Banei remains a separate Work ID and parser path. Banei detail parsing must not inherit flat-racing assumptions for:

- surface;
- course direction;
- course label construction;
- distance interpretation beyond reviewed Banei semantics;
- terminology and race programme labels.

Only shared pipeline rules are inherited: stable identity, review boundaries, arbitrary windows, partial success, overlap safety, coverage observations, no implicit deletion, and no accidental rank regression.

## Ordinary incremental sequence

1. review official Banei schedule and detail source responsibilities;
2. create Banei-specific fixture evidence and parser semantics;
3. implement arbitrary-window schedule acquisition;
4. implement detail acquisition or combined acquisition according to official source behavior;
5. record requested and observed scopes separately;
6. allow valid partial candidate batches;
7. review and promote valid records independently of unresolved meetings elsewhere;
8. retain retry targets for pending, unavailable, or parser-failure states;
9. continue irregular manual refreshes and overlapping retries;
10. complete freshness, rollback, and bilingual QA.

## Ordinary batch conditions

A valid Banei batch may contain:

- one meeting;
- several meetings;
- a partial month;
- a cross-month window;
- an overlapping retry window;
- selected meeting IDs;
- all currently source-visible meetings.

The batch succeeds when its produced records are valid and its unresolved scope is reported honestly.

It does not require every July meeting to be available.

## Absence and rank rules

Absence from one run is not cancellation or deletion.

A lower-detail later observation must not automatically overwrite a higher reviewed rank.

Examples:

```text
existing A+ + later schedule-only observation -> keep A+
existing C + later reviewed A+ -> promote to A+
missing from one run -> keep prior reviewed record, update coverage/source-health state separately
```

Reviewed correction, cancellation/change evidence, source invalidation, publication-policy change, or rollback may still justify explicit revision.

## July 2026 completion audit

The separate July completion audit covers:

```text
2026-07-01 through 2026-07-31 inclusive
```

A July completion claim requires:

- every official July Obihiro Banei meeting represented or explicitly blocked;
- future or unavailable detail gaps explicit;
- no silent omissions;
- Banei terminology and course semantics independently validated;
- every available reviewed detail represented at the highest supported rank;
- public projection and bilingual QA pass;
- freshness and rollback evidence pass;
- partial cutoff output never treated as month completion.

An incomplete completion audit reports gaps and retry targets. It must not block unrelated valid Banei partial batches from review or promotion.

## Handoff from NAR

Banei begins only after the shared incremental coverage contract and validation split have been implemented during the active NAR phase.

Banei should reuse the common contracts and validators for:

- arbitrary windows;
- coverage observation;
- batch validation;
- promotion validation;
- coverage audit;
- completion audit;
- stable merge behavior.

It must not reuse NAR-specific flat-racing parsing assumptions.
