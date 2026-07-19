# Calendar daily acquisition roadmap addendum

Status: active adopted Calendar programme addendum  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Adopted: 2026-07-19

## Scope

This addendum inserts reviewed scheduled acquisition into steady-state Calendar maintenance after the accepted v1 static release.

It does not reopen v1 product scope and does not authorize unattended publication.

## Clarification of earlier roadmap language

Earlier roadmap statements that scheduled acquisition execution is disabled remain true for the accepted v1 release baseline and for any workflow that writes Canonical or public data without review.

For `WHR-CAL-DAILY-ACQUISITION`, the approved target boundary is narrower:

```text
scheduled planning: enabled after merge and evidence gate
scheduled hosted acquisition: enabled after merge and evidence gate
automatic draft review PR: enabled after merge and evidence gate
automatic approval: disabled
automatic Canonical promotion: disabled
automatic public projection: disabled
automatic merge: disabled
automatic deployment: disabled
```

The active contract governs this distinction.

## Programme insertion

The steady-state sequence becomes:

```text
accepted Calendar Public v1
-> current-horizon recovery audit
-> WHR-CAL-DAILY-ACQUISITION implementation
-> first manual-dispatch operating evidence
-> reviewed rolling-window recovery publication
-> first scheduled-cycle evidence
-> steady-state reviewed incremental maintenance
```

This operational work may proceed in parallel with glossary, search, filtering, SEO, and other static product improvements because it does not add a new public route family or public data class.

## Required documents

```text
docs/calendar/daily-acquisition-contract.md
docs/calendar/daily-acquisition-implementation-schedule.md
docs/calendar/daily-acquisition-operations.md
```

## Completion state

The Work ID is not complete when code is merely merged.

It becomes complete only after:

1. CI validates the live-state and generated-plan path;
2. one manual-dispatch run produces auditable acquisition artifacts;
3. one draft PR is created or updated without publication side effects;
4. the current rolling horizon is separately reviewed and restored;
5. one scheduled daily cycle succeeds;
6. JRA local-primary ownership is documented and exercised where due;
7. production Calendar freshness is confirmed after reviewed publication.

## Next decision after completion

After acceptance, the operator decides separately whether to:

- keep the same review cadence;
- add a reviewed Retry Queue input to the daily state builder;
- add UAE seasonal wake-up planning;
- move JRA acquisition to a hosted runner after new source evidence;
- expand to another racing system.

None of these decisions is implied by this addendum.
