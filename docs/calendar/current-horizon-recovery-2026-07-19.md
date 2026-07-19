# Calendar current-horizon recovery audit — 2026-07-19

Status: reviewed audit candidate; candidate acquisition pending  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Audit window: 2026-07-19 through 2026-08-17 inclusive  
Machine-readable audit: `data/audits/calendar-current-horizon-recovery-2026-07-19-v1.json`

## Purpose

This audit separates three different states that must not be flattened into one generic missing-data condition:

```text
active system with missing reviewed public horizon
active system with a source-specific manual boundary
system with no meeting expected inside the window
```

No Canonical data, public timetable projection, or deployment is changed by this audit.

## Current dispositions

| System | Current public end | Window disposition | Required path |
| --- | --- | --- | --- |
| JRA | 2026-07-26 | Recovery required | Reviewed local acquisition |
| NAR | 2026-07-31 | Recovery required | Authorized hosted review artifacts |
| Banei | 2026-08-10 | Bounded recovery required for 2026-08-15 through 2026-08-17 | Reviewed manual recovery; ordinary daily refresh remains disabled |
| HKJC local racing | 2026-07-15 | No recovery Job in this window | Offseason suppression |
| UAE ERA | 2026-04-11 | No recovery Job in this window | Offseason suppression; next season begins 2026-10-22 |

## JRA

Reviewed official programmes exist for:

```text
2026-08-01
2026-08-02
2026-08-08
2026-08-09
2026-08-15
2026-08-16
```

The current public projection stops on 2026-07-26, so the missing public horizon is real. JRA remains local-primary. The daily hosted workflow may plan JRA work, but it must preserve the Job as a non-hosted exclusion rather than silently switching runners.

The published JRA programme pages are advance programmes. Final race-day changes remain subject to later official confirmation, and recovery candidates must preserve that evidence state.

## NAR

The official August monthly schedule is available. The current public projection stops on 2026-07-31, so the daily acquisition system should generate bounded August coverage work through 2026-08-17.

The existing NAR Actions path remains review-only. It may produce schedule identities, detail candidates, Coverage Observation, Result Manifest, status, and source-error artifacts. It must not promote or publish them automatically.

## Banei

The current public projection includes meetings through 2026-08-10. The official August schedule also lists:

```text
2026-08-15
2026-08-16
2026-08-17
```

These three dates are a real public-horizon tail. However, the accepted Banei operating boundary still disables ordinary regular refresh, coverage-gap execution, and source revalidation in the daily workflow. This recovery remains a separate reviewed manual operation unless a later operating-evidence decision changes that boundary.

## HKJC

The reviewed local fixture ends on 2026-07-15 and shows no local meeting after that date inside this audit window. The absence is therefore represented as `offseason`, not as a coverage gap.

The daily live-state builder must emit:

```text
season_state: offseason
coverage_gaps: []
```

and the Due-job Planner must create no HKJC Job for this window.

## UAE ERA

The official 2026–2027 season begins on 2026-10-22. No UAE meeting is expected inside the July 19 through August 17 audit window.

The system remains `offseason` for this audit and receives no recovery Job. A later preseason review must update the reviewed season-state record before the October start.

## Planner integration

Reviewed system season states are stored in:

```text
data/static/calendar-system-season-state-v1.json
```

The daily state builder must use the reviewed state instead of inferring active status merely because a system had a meeting during the previous 60 days.

This prevents a recently completed season from being misclassified as a missing rolling horizon.

## Completion boundary

DA-00 is complete when:

1. the five maintained systems have explicit reviewed dispositions;
2. the season-state file validates against the Acquisition Registry;
3. the live-state builder suppresses HKJC during this window;
4. the planner still emits JRA and NAR recovery work;
5. Banei ordinary daily recovery remains disabled;
6. UAE remains season-suppressed until the reviewed preseason window;
7. no Canonical/public/deployment write occurs.

Candidate acquisition and publication are later stages. This audit alone does not restore the public Calendar.
