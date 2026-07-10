# HKJC PILOT-06 reviewed-import evidence decision

Status: reviewed-import detail operator path evidence-backed; system-level fallback remains pending  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-06`  
Last reviewed: 2026-07-10

## Purpose

PILOT-06 separates two questions that PILOT-05 exposed:

1. can the accepted artifact-only detail core safely consume public-safe reviewed input;
2. can the current system-level Acquisition Registry represent a detail-only reviewed-import route without overstating fallback behavior for the evidence-backed schedule path.

The first question is now answered yes. The second remains open because the current Registry records only one primary runner and one fallback runner per system.

## Reviewed evidence run

The evidence workflow used one externally materialized public-safe input derived from explicit official HKJC source review.

Reviewed target:

```text
meeting: hkjc-happy-valley-racecourse-2026-07-08
source: official HKJC racecard page
review state: reviewed_public_safe
meeting_complete: false
```

The reviewed public-safe row contained:

```text
Race 1
post time: 18:30
race name: KICK OFF HANDICAP
distance: 1000m
surface: Turf
course: B Course
```

Because only one race was reviewed and `meeting_complete` remained false, the five-rank classifier correctly produced B rather than A or A+.

## Exact evidence identity

```text
workflow run: 29106908246
artifact: 8233171311
artifact digest: sha256:201cca150dd2d5008ee779e3211dd31b7966a271b84b99b1db27a269b6d0d55f
external input SHA-256: 4bf489f4c6c31f9fc9c7a21606ac2625f297e6d192a6a4636933d80de29a138b
```

Observed result:

```text
rank: B
first_race_time_local: 18:30
last_race_time_local: null
timetable row count: 0
coverage: partial
unresolved meetings: 1
runner_used: reviewed_import
candidate review state: needs_review
promotion target: null
```

Side effects:

```text
network_fetch: false
raw_source_storage: disabled
canonical_write: disabled
public_write: disabled
publication_effect: none
protected-state hash check: pass
repository clean after run: true
```

## What is accepted

The following path is evidence-backed as an operator path:

```text
external public-safe reviewed input
-> exact input SHA-256
-> strict field validation
-> reviewed_public_safe state
-> accepted PILOT-05 five-rank classifier
-> timetable candidate
-> Coverage Observation
-> Collection Result Manifest
-> reviewed-import report
-> HUMAN REVIEW REQUIRED
```

The resulting candidate remains `needs_review`. Input review does not equal candidate approval, Promotion Validation, canonical promotion, or publication.

## Why Registry fallback remains pending

Current Acquisition Registry runner fields are system-level:

```text
primary_runner
fallback_runner
```

The actual HKJC evidence is route-specific:

```text
schedule route:
  github_actions evidence-backed

detail route:
  github_actions HTTP acquisition not evidence-backed
  reviewed_import operator path evidence-backed
```

Setting the whole HKJC system `fallback_runner` to `reviewed_import` would overstate what has been proved because it would imply a system-wide fallback relationship rather than a detail-only operator route.

Therefore PILOT-06 keeps:

```text
primary_runner: github_actions
fallback_runner: null
fallback_runner status: pending
detail_source_id: null
detail_adapter_id: null
supported observation ranks: C only
```

The evidence-backed reviewed-import detail path is retained as an operator path, not yet as a system-level Registry fallback.

## Next subunit

```text
HKJC-PILOT-06B
HKJC route-specific runner policy representation
```

Goal:

Represent schedule and detail runner routes separately enough to preserve the evidence-backed GitHub Actions schedule path while registering the evidence-backed reviewed-import detail operator path without overstating system-level fallback capability.

The next subunit must answer:

- whether route-specific runner fields belong directly in Acquisition Registry v1 extension or in a compatible route-policy supplement;
- how existing runner compatibility, Collection Job, Collection Plan, Due-job Planner, and Operations views consume the route-specific state;
- how older system-level runner fields remain backward compatible;
- how a detail-only reviewed-import path is selected without enabling automatic import, approval, promotion, or publication.

## Safety boundary

The following remain disabled:

- scheduled acquisition execution;
- automatic Queue mutation;
- automatic approval;
- automatic promotion;
- automatic publication;
- canonical write;
- public write;
- deployment.

The reviewed-import path continues to reject participant, betting, result, payout, prediction, raw-source, embedded-video, direct-stream, credential, cookie, token, and restricted-access material.
