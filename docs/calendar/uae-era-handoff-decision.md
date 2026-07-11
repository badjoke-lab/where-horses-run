# UAE ERA bounded reviewed steady-state handoff decision

Status: handoff accepted for bounded manual reviewed steady-state operation  
Work ID: `WHR-CAL-UAE-ERA`  
Decision ID: `UAE-HANDOFF-01`  
Last reviewed: 2026-07-11

## Decision

Accept the UAE ERA source-specific sequence for bounded manual reviewed steady-state operation.

The completed Work ID is:

```text
WHR-CAL-UAE-ERA
```

The next programme Work ID is:

```text
WHR-CAL-PUBLIC-V1
```

The global Current Work ID switch remains a separate entrypoint synchronization step.

## Accepted operating state

```text
Registry profile: provisional
Readiness: prototype_ready
implementation status: fixture_validated
automation mode: semi_automatic
primary runner: github_actions
system fallback runner: pending
supported observation ranks: C only
detail route: inactive
```

### Schedule path: evidence-backed

The accepted schedule route is:

```text
selection mode:
  explicit Collection Job

collection mode:
  source_visible_horizon only

runner:
  github_actions

source:
  era-season-calendar

adapter:
  uae-era-pdf-grid-actions-v1

executor:
  uae-era-pdf-grid-actions

rank:
  C

reviewed fixture window:
  2026-10-22 through 2027-04-15 inclusive

end exclusive:
  2027-04-16

reviewed records:
  64

coverage claim:
  source_window_complete
```

The live evidence batch closed exactly to:

```text
Meydan: 17
Abu Dhabi: 16
Al Ain: 14
Jebel Ali: 11
Sharjah: 6
TOTAL: 64
```

The output remains review-only:

```text
candidate review state: needs_review
promotion target: null
```

### Detail route: inactive

The UAE profile has no activated detail source or adapter.

```text
detail_source_id: null
detail_adapter_id: null
```

No race-time, racecard, programme-detail, participant, odds, result, payout, prediction, or stream claim is authorized by this handoff.

## Accepted claims

The handoff accepts:

- five approved canonical venue identities;
- evidence-backed date and venue pairing from the reviewed official PDF grid;
- evidence-backed GitHub Actions schedule execution for explicit source-visible-horizon Jobs;
- C-level review artifact generation;
- exact 64-record and 17/16/14/11/6 venue-count closure;
- bounded ordinary manual reviewed operation;
- incremental future UAE maintenance that does not block Calendar Public v1.

## Explicit non-claims

The handoff does not claim:

- arbitrary date-window capability;
- cross-month requested-window capability beyond the fixed reviewed source-visible horizon;
- selected-meeting acquisition;
- rank-upgrade retry automation;
- fallback runner activation;
- detail acquisition;
- full detail completeness;
- a broader semantic definition of the complete UAE racing season;
- automatic planning or execution;
- automatic approval, promotion, or publication;
- canonical or public write authorization.

## Operating rule

UAE ERA continues as bounded manual reviewed steady-state operation.

An operator may submit an explicit Collection Job for the reviewed `source_visible_horizon` route. The executor may produce C-level review artifacts only. Human review remains required before any later promotion decision.

The profile remains provisional. Unsupported modes must fail closed.

Future UAE maintenance may continue without blocking Calendar Public v1.

## Safety boundary

All of the following remain disabled:

```text
scheduled acquisition execution
automatic collection planning
automatic Queue mutation
automatic approval
automatic promotion
automatic publication
detail route activation
canonical write
public write
deployment
```

## Handoff result

```text
decision:
  accept_bounded_reviewed_steady_state_handoff

completed Work ID:
  WHR-CAL-UAE-ERA

next Work ID:
  WHR-CAL-PUBLIC-V1

ordinary operation:
  bounded manual reviewed steady-state

profile status:
  provisional

public capability:
  C-level meeting date and approved racecourse identity only
```
