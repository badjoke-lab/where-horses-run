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
planning-only Due-job policy: retained
separate hosted-execution policy: required
scheduled planning: enabled after merge and evidence gate
scheduled authorized hosted acquisition: enabled after merge and evidence gate
automatic draft review PR: enabled after merge and evidence gate
automatic approval: disabled
automatic Canonical promotion: disabled
automatic public projection: disabled
automatic merge: disabled
automatic deployment: disabled
```

The active contract and machine-readable execution policy govern this distinction.

## Source-specific boundary

The daily system does not imply uniform automation across all maintained systems.

```text
NAR: hosted acquisition allowed within declared modes and reasons
HKJC: hosted bounded schedule acquisition allowed
Banei: regular refresh remains disabled; reviewed selected-meeting retry only
JRA: hosted execution excluded; local/reviewed operator remains responsible
UAE ERA: seasonal disposition remains manual until a wake-up policy is adopted
```

Executor capability alone does not activate ordinary scheduled refresh.

## Programme insertion

The steady-state sequence becomes:

```text
accepted Calendar Public v1
-> current-horizon recovery audit
-> WHR-CAL-DAILY-ACQUISITION implementation
-> branch CI and execution-policy proof
-> first main-branch activation operating evidence
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
data/static/calendar-daily-acquisition-policy-v1.json
```

## Completion state

The Work ID is not complete when code is merely merged.

It becomes complete only after:

1. CI validates the live-state and generated-plan path;
2. CI validates the separate execution authorization boundary;
3. one main-branch activation or manual-dispatch run produces auditable acquisition artifacts;
4. one draft PR is created or updated without publication side effects;
5. the current rolling horizon is separately reviewed and restored;
6. one scheduled daily cycle succeeds;
7. JRA local-primary ownership is documented and exercised where due;
8. Banei regular-refresh status and UAE seasonal ownership remain explicit;
9. production Calendar freshness is confirmed after reviewed publication.

## Next decision after completion

After acceptance, the operator decides separately whether to:

- keep the same review cadence;
- add a reviewed Retry Queue input to the daily state builder;
- add UAE seasonal wake-up planning;
- prove and activate Banei regular scheduled refresh;
- move JRA acquisition to a hosted runner after new source evidence;
- expand to another racing system.

None of these decisions is implied by this addendum.
