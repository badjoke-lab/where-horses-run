# Calendar daily acquisition roadmap addendum

Status: active adopted Calendar programme addendum  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Adopted: 2026-07-19  
Last reviewed: 2026-08-08

## Scope

This addendum inserts reviewed scheduled acquisition into steady-state Calendar maintenance after the accepted v1 static release.

It does not reopen v1 product scope and does not authorize unattended publication.

## Operating boundary

For `WHR-CAL-DAILY-ACQUISITION`:

```text
planning-only Due-job policy: retained
separate hosted-execution policy: required
scheduled planning: enabled
scheduled authorized hosted acquisition: enabled
stable human-review branch / Draft PR #559: enabled
automatic PR creation: disabled
automatic approval: disabled
automatic Canonical promotion: disabled
automatic public projection: disabled
automatic merge: disabled
automatic deployment: disabled
publication freshness reporting: required
```

The active contract and machine-readable execution policy govern this distinction.

## Source-specific boundary

The daily system does not imply uniform automation across all maintained systems.

```text
NAR:
  hosted acquisition allowed within declared modes and reasons

HKJC:
  hosted bounded fixture acquisition allowed
  ordinary offseason dates suppressed
  reviewed future active window inside the rolling horizon may create a bounded wake-up Job

Banei:
  regular refresh / coverage-gap / source-revalidation execution remains disabled
  reviewed selected-meeting rank retry only under ordinary daily policy

JRA:
  hosted execution excluded
  local/reviewed operator remains responsible

UAE:
  reviewed season windows retained
  not in the current daily Due-job execution policy
```

Executor capability alone does not activate ordinary scheduled refresh.

## Programme sequence

Steady-state maintenance is:

```text
accepted Calendar Public v1
-> daily reviewed season-state resolution
-> live planning and authorized acquisition
-> Draft PR #559 review queue
-> publication-freshness evaluation
-> human source/rank review when due
-> separate Promotion Validation / Canonical / public projection
-> bilingual QA
-> reviewed publication merge
-> production freshness verification
```

A successful acquisition run does **not** close the cycle if the public horizon is stale.

## August 8 operational finding

The daily acquisition system continued running after the 2026-07-19 publication. Draft PR #559 accumulated scheduled evidence through 2026-08-08, but no reviewed publication continuation was performed. Production therefore remained on the public projection ending 2026-08-17.

The response is not to enable automatic publication. Instead:

1. recover the current reviewed rolling window through 2026-09-06;
2. add a machine-readable `publication_review_required` signal to every daily activation;
3. treat that signal as an operator action item;
4. preserve the existing mandatory human approval and publication boundary.

## Rolling season transitions

A season boundary can fall inside the 30-day horizon while the planning date itself is offseason.

The reviewed planner must therefore support non-overlapping future season windows. It suppresses offseason dates but may schedule the exact future active interval when that interval begins inside the rolling horizon.

August 8 example:

```text
HKJC offseason through 2026-09-05
HKJC active from 2026-09-06
wake-up acquisition interval: 2026-09-06..2026-09-07 only
```

## Required documents and controls

```text
docs/calendar/daily-acquisition-contract.md
docs/calendar/daily-acquisition-implementation-schedule.md
docs/calendar/daily-acquisition-operations.md
data/static/calendar-daily-acquisition-policy-v1.json
data/static/calendar-system-season-state-v1.json
data/static/calendar-daily-acquisition-activation-status.schema.json
```

## Completion state

The Work ID is not complete merely because automation code is merged.

Steady-state acceptance requires:

1. live-state and generated-plan paths are CI-validated;
2. separate execution authorization is CI-validated;
3. scheduled runs produce auditable review artifacts;
4. Draft PR #559 receives repeated updates without publication side effects;
5. successful and failed/partial outcomes remain auditable;
6. JRA local-primary ownership remains explicit;
7. Banei ordinary-refresh prohibition remains explicit;
8. HKJC and UAE season transitions are represented by reviewed windows;
9. every activation reports whether the public rolling horizon is complete;
10. `publication_review_required=true` receives operator review rather than being treated as green completion;
11. reviewed horizon publications receive bilingual QA and production freshness confirmation;
12. no unattended publication permission is introduced.

## Next decisions after acceptance

Any of the following requires a separate reviewed decision:

- changing human review cadence;
- adding automatic notification/escalation for persistent `publication_review_required=true`;
- adding UAE to the daily Due-job execution policy;
- activating Banei ordinary scheduled refresh;
- moving JRA acquisition to a hosted runner;
- expanding to another racing system;
- changing the 30-day public horizon.

None of these decisions is implied by this addendum.
