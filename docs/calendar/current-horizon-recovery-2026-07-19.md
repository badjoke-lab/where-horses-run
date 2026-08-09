# Calendar current-horizon recovery audit — 2026-07-19

Status: historical reviewed audit baseline; subsequent reviewed recovery completed  
Work ID: `WHR-CAL-DAILY-ACQUISITION`  
Audit window: 2026-07-19 through 2026-08-17 inclusive  
Machine-readable audit: `data/audits/calendar-current-horizon-recovery-2026-07-19-v1.json`

## Historical status note

This document preserves the exact 2026-07-19 recovery decision and must not be rewritten as if the later state existed on that date. Candidate acquisition was pending **at the time of this audit**.

Subsequent reviewed work closed this historical recovery gap:

- PR #564 published reviewed recovery through 2026-08-17;
- PR #567 later recovered the rolling public horizon through 2026-09-06 and added the future HKJC season wake-up behavior.

Current execution state is governed by `docs/project-roadmap-2026-08-09-addendum.md`, `docs/calendar/implementation-roadmap-2026-08-09-addendum.md`, and `docs/calendar/daily-acquisition-implementation-schedule.md`. The machine-readable July audit remains a historical floor/evidence snapshot, not the current public-horizon ceiling.

## Purpose

This audit separates three different states that must not be flattened into one generic missing-data condition:

```text
active system with missing reviewed public horizon
active system with a source-specific manual boundary
system with no meeting expected inside the window
```

No Canonical data, public timetable projection, or deployment is changed by this audit.

## Current dispositions at audit time

| System | Public end at audit time | Window disposition | Required path |
| --- | --- | --- | --- |
| JRA | 2026-07-26 | Recovery required | Reviewed local acquisition |
| NAR | 2026-07-31 | Recovery required | Authorized hosted review artifacts |
| Banei | 2026-08-10 | Bounded recovery required for 2026-08-15 through 2026-08-17 | Reviewed manual recovery; ordinary daily refresh remains disabled |
| HKJC local racing | 2026-07-15 | No recovery Job in this window | Offseason suppression |
| UAE ERA | 2026-04-11 | No recovery Job in this window | Offseason suppression; next season begins 2026-10-22 |

## JRA

Reviewed official programmes existed for:

```text
2026-08-01
2026-08-02
2026-08-08
2026-08-09
2026-08-15
2026-08-16
```

At audit time the public projection stopped on 2026-07-26, so the missing public horizon was real. JRA remained local-primary. The daily hosted workflow could plan JRA work, but it had to preserve the Job as a non-hosted exclusion rather than silently switching runners.

The published JRA programme pages were advance programmes. Final race-day changes remained subject to later official confirmation, and recovery candidates had to preserve that evidence state.

## NAR

The official August monthly schedule was available. At audit time the public projection stopped on 2026-07-31, so the daily acquisition system was required to generate bounded August coverage work through 2026-08-17.

The existing NAR Actions path remained review-only. It could produce schedule identities, detail candidates, Coverage Observation, Result Manifest, status, and source-error artifacts. It could not promote or publish them automatically.

## Banei

At audit time the public projection included meetings through 2026-08-10. The official August schedule also listed:

```text
2026-08-15
2026-08-16
2026-08-17
```

These three dates were a real public-horizon tail. However, the accepted Banei operating boundary still disabled ordinary regular refresh, coverage-gap execution, and source revalidation in the daily workflow. This recovery therefore required a separate reviewed operation unless a later operating-evidence decision changed that boundary.

## HKJC

The reviewed local fixture ended on 2026-07-15 and showed no local meeting after that date inside this audit window. The absence was represented as `offseason`, not as a coverage gap.

The daily live-state builder had to emit:

```text
season_state: offseason
coverage_gaps: []
```

and the Due-job Planner had to create no HKJC Job for this audit window.

Later reviewed season-state work confirmed a future active interval beginning 2026-09-06, outside this historical audit window but inside the later August rolling horizon.

## UAE ERA

The official 2026–2027 season begins on 2026-10-22. No UAE meeting was expected inside the July 19 through August 17 audit window.

The system remained `offseason` for this audit and received no recovery Job. A later preseason review must update the reviewed season-state record before the October start.

## Planner integration

Reviewed system season states are stored in:

```text
data/static/calendar-system-season-state-v1.json
```

The daily state builder uses reviewed state instead of inferring active status merely because a system had a meeting during the previous 60 days.

This prevents a recently completed season from being misclassified as a missing rolling horizon.

## Historical completion boundary

DA-00 was complete when:

1. the five maintained systems had explicit reviewed dispositions;
2. the season-state file validated against the Acquisition Registry;
3. the live-state builder suppressed HKJC during this window;
4. the planner still emitted JRA and NAR recovery work;
5. Banei ordinary daily recovery remained disabled;
6. UAE remained season-suppressed until the reviewed preseason window;
7. no Canonical/public/deployment write occurred from the audit itself.

Candidate acquisition and publication were later stages and were subsequently completed through separate reviewed PRs. This historical audit alone never authorized publication.
