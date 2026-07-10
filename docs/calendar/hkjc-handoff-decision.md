# HKJC pilot handoff decision

Status: handoff accepted for bounded manual reviewed steady-state operation  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Decision ID: `HKJC-HANDOFF-01`  
Next Work ID: `WHR-CAL-UAE-ERA`  
Last reviewed: 2026-07-11

## Decision

The HKJC source-specific pilot handoff is accepted.

The accepted claim is deliberately bounded:

```text
schedule path: evidence-backed
schedule runner: github_actions
schedule evidence rank: C

detail operator path: evidence-backed
detail runner: reviewed_import
detail evidence rank: B

Registry profile: provisional
system fallback runner: pending
Registry detail source/adapter: null
Registry supported observation ranks: C only
```

This is sufficient for bounded manual reviewed steady-state operation and for moving the active source-specific development sequence to:

```text
WHR-CAL-UAE-ERA
```

It is not a claim of full detail automation, full-season completeness, A/A+ detail completeness, system-wide fallback activation, or unattended publication.

## Evidence chain

### Schedule path

PILOT-04 corrected the August parser-failure ambiguity with fail-closed valid-empty semantics and produced repeated shared-Actions evidence:

```text
coverage: source_window_complete
records discovered: 0
source errors: 0
valid empty month: 2026-08
Job status: success
protected state hashes: pass
repository cleanup: pass
```

The resulting schedule route is:

```text
route_kind: schedule
status: active
selection_mode: collection_job
runner: github_actions
source: hkjc-fixture-list
adapter: hkjc-fixture-artifact-bridge-v1
evidence-backed ranks: C
automatic planning allowed: true
automatic execution allowed: false
human review required: true
```

### Hosted detail route blocker

PILOT-05 proved the artifact-only detail core and external collector foundation, but GitHub Actions HTTP acquisition did not observe target racecard fields.

Nine route-form probes across three reviewed meetings returned the same hosted shell, and browser-header/warmup strategies did not change that result.

Therefore the hosted detail acquisition path remains unproven and is not activated.

### Reviewed-import detail operator path

PILOT-06 proved a network-free external reviewed-import path with exact input SHA-256 binding.

Reviewed evidence:

```text
workflow run: 29106908246
external input SHA-256: 4bf489f4c6c31f9fc9c7a21606ac2625f297e6d192a6a4636933d80de29a138b
meeting: hkjc-happy-valley-racecourse-2026-07-08
rank: B
first race time: 18:30
last race time: null
timetable rows: 0
coverage: partial
unresolved meetings: 1
runner: reviewed_import
candidate state: needs_review
promotion target: null
network fetch: false
publication effect: none
```

The incomplete one-race observation remained B and did not fabricate A/A+ completeness.

### Route-specific runner policy

PILOT-06B represents the proven route split without changing Registry v1 system-level semantics.

Allowed matrix:

```text
schedule + collection_job          -> github_actions
schedule + due_job_planner         -> github_actions
detail + operator_reviewed_import  -> reviewed_import
detail + operations_view           -> reviewed_import status visibility
```

Rejected matrix:

```text
detail + collection_job
detail + due_job_planner
schedule + operator_reviewed_import
detail + wrong requested runner
detail + unsupported collection mode
```

The route-policy CI revalidates Acquisition Registry, Collection Job, Collection Plan, Due-job Planner, runner compatibility, and Operations v2.

## Accepted steady-state operating boundary

HKJC maintenance may continue incrementally under the following rules:

1. explicit schedule Jobs may use the evidence-backed GitHub Actions schedule route;
2. schedule Jobs remain review-bound and do not execute automatically;
3. detail intake may use only the explicit operator-reviewed-import route;
4. reviewed-import input must remain external, public-safe, official-source referenced, and exact-digest bound;
5. reviewed input still produces `needs_review` candidates;
6. candidate approval, Promotion Validation, canonical promotion, and publication remain separate;
7. absence from one run is not cancellation or deletion;
8. partial coverage remains valid when honestly represented;
9. future HKJC maintenance may continue without blocking UAE work.

## Claims explicitly not made

The handoff does not claim:

- a complete HKJC detail source adapter in Registry;
- automatic racecard acquisition;
- automatic reviewed-import execution;
- system-level fallback activation;
- selected-meeting automation;
- rank-upgrade retry automation;
- full meeting programme completeness;
- full season completeness;
- A or A+ coverage for current HKJC public data;
- unattended approval, promotion, publication, canonical write, or public write.

## Safety boundary

The following remain disabled:

```text
scheduled acquisition execution
automatic detail import
automatic Queue mutation
automatic approval
automatic promotion
automatic publication
canonical write
public write
deployment
```

Participant, betting, odds, result, payout, prediction, raw-source, embedded-video, direct-stream, credential, cookie, token, and restricted-access material remain outside the reviewed-import path.

## Handoff

The HKJC pilot no longer blocks the source-specific sequence.

The next active source-specific Work ID is:

```text
WHR-CAL-UAE-ERA
```

HKJC remains maintainable under bounded manual reviewed steady-state operation while UAE source-specific implementation begins.
