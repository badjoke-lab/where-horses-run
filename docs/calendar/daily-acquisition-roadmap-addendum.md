# Calendar daily acquisition roadmap addendum

Status: active adopted Calendar programme addendum  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Adopted: 2026-07-19  
Last reviewed: 2026-08-09

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

South Korea / KRA:
  PR #568 candidate generation is implemented
  not enrolled into the daily Due-job execution policy by that merge
  future scheduled execution requires a separate Registry/policy decision after reviewed public promotion
```

Executor or adapter capability alone does not activate ordinary scheduled refresh.

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

## August 8 operational finding and completed response

The daily acquisition system continued running after the 2026-07-19 publication. Draft PR #559 accumulated scheduled evidence through 2026-08-08, but no reviewed publication continuation was performed. Production therefore remained on the public projection ending 2026-08-17.

The response did not enable automatic publication. Instead, PR #567:

1. recovered the reviewed rolling window through 2026-09-06;
2. added/retained the machine-readable `publication_review_required` signal on daily activation;
3. treated that signal as an operator action item;
4. preserved mandatory human approval and publication boundaries;
5. merged through normal review and completed production freshness verification.

Historical July recovery audits remain historical evidence; they are not current horizon ceilings.

## Rolling season transitions

A season boundary can fall inside the 30-day horizon while the planning date itself is offseason.

The reviewed planner supports non-overlapping future season windows. It suppresses offseason dates but may schedule the exact future active interval when that interval begins inside the rolling horizon.

August 8 proof:

```text
HKJC offseason through 2026-09-05
HKJC active from 2026-09-06
wake-up acquisition interval: 2026-09-06..2026-09-07 only
```

## Required documents and controls

```text
docs/project-roadmap-2026-08-09-addendum.md
docs/calendar/implementation-roadmap-2026-08-09-addendum.md
docs/calendar/daily-acquisition-contract.md
docs/calendar/daily-acquisition-implementation-schedule.md
docs/calendar/daily-acquisition-operations.md
data/static/calendar-daily-acquisition-policy-v1.json
data/static/calendar-system-season-state-v1.json
data/static/calendar-daily-acquisition-activation-status.schema.json
```

## Completion and ongoing acceptance state

The automation implementation and August recovery are complete, but DA-09 is intentionally an ongoing operating acceptance stage rather than a reason to stop checking freshness.

Current acceptance requirements are:

1. live-state and generated-plan paths remain CI-validated;
2. separate execution authorization remains CI-validated;
3. scheduled runs produce auditable review artifacts;
4. Draft PR #559 receives repeated updates without publication side effects;
5. successful and failed/partial outcomes remain auditable;
6. JRA local-primary ownership remains explicit;
7. Banei ordinary-refresh prohibition remains explicit;
8. HKJC and UAE season transitions remain represented by reviewed windows;
9. every activation reports whether the public rolling horizon is complete;
10. `publication_review_required=true` receives operator review rather than green completion;
11. reviewed horizon publications receive bilingual QA and production freshness confirmation;
12. no unattended publication permission is introduced.

## Source-expansion separation

New systems are not automatically added to daily acquisition merely because a source test or candidate adapter succeeds.

Current source-expansion work is `WHR-CAL-SOUTH-KOREA-KRA`, governed by the active 2026-08-09 project and Calendar roadmap addenda. South Korea must complete identity review and separate reviewed promotion before any later daily-scheduling decision.

## Next decisions requiring separate review

Any of the following requires a separate reviewed decision:

- changing human review cadence;
- adding automatic notification/escalation for persistent `publication_review_required=true`;
- adding UAE to the daily Due-job execution policy;
- adding KRA or another new system to daily Due-job execution policy;
- activating Banei ordinary scheduled refresh;
- moving JRA acquisition to a hosted runner;
- changing the 30-day public horizon;
- changing automatic approval, promotion, merge, deployment, or publication permissions.

None of these decisions is implied by this addendum.
