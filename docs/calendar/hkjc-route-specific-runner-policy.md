# HKJC route-specific runner policy

Status: HKJC-PILOT-06B implementation  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-06B`  
Last reviewed: 2026-07-11

## Purpose

PILOT-06 proved two different HKJC runner realities:

```text
schedule route
  -> GitHub Actions
  -> evidence-backed C-level date-window acquisition

detail route
  -> reviewed_import
  -> evidence-backed operator path
  -> not a generic automatic fallback
```

The existing Acquisition Registry v1 has one system-level `primary_runner` and one system-level `fallback_runner`. Those fields are too coarse to express the proven HKJC route split without overstating capability.

PILOT-06B therefore adds an additive route-specific runner policy supplement. It does not replace or reinterpret Registry v1.

## Backward compatibility rule

The core compatibility rule is:

> system-level fields remain authoritative for legacy jobs.

Existing Collection Job and Collection Plan schemas do not gain a new route field in this unit. Existing jobs continue to resolve runners through the system-level Registry contract.

The route policy is additive and may not activate Registry fields.

Current system-level HKJC state therefore remains:

```text
primary_runner: github_actions
fallback_runner: null
fallback_runner: pending
detail_source_id: null
detail_adapter_id: null
supported_observation_ranks: C only
```

Registry detail fields remain null.

## Schedule route

The schedule route is represented as:

```text
route_kind: schedule
status: active
selection_mode: collection_job
primary_runner: github_actions
source: hkjc-fixture-list
adapter: hkjc-fixture-artifact-bridge-v1
supported collection modes: date_window
evidence-backed ranks: C
automatic planning allowed: true
automatic execution allowed: false
human review required: true
```

This preserves the PILOT-04 schedule evidence and current explicit Collection Job path.

`automatic_planning_allowed: true` means the artifact-only Due-job Planner may prepare a schedule Job. It does not authorize execution. The scheduler boundary still records `jobs_executed: false`.

## Detail route

The detail route is represented as:

```text
route_kind: detail
status: operator_path_evidence_backed
selection_mode: operator_only
primary_runner: reviewed_import
source: hkjc-detail-reviewed-import
adapter: hkjc-detail-reviewed-import-v1
supported collection modes: date_window
evidence-backed ranks: B
automatic planning allowed: false
automatic execution allowed: false
human review required: true
```

The B rank records only the bounded PILOT-06 evidence actually proved. It does not reduce the five-rank classifier capability and does not expand Registry supported ranks.

The detail route is operator-only. Operator-only means:

- a generic Collection Job cannot select this route;
- a Collection Plan cannot acquire it indirectly through system fallback;
- the Due-job Planner cannot select it;
- the reviewed-import package builder is entered only from an explicit reviewed operator flow;
- input review still does not equal candidate approval or promotion.

## Collection Job and Plan behavior

PILOT-06B deliberately does not change Collection Job v1 or Collection Plan v1 schemas.

Existing HKJC schedule Jobs remain valid:

```text
runner_policy:
  mode: exact
  runner: github_actions
```

A generic HKJC Job that requests:

```text
runner: reviewed_import
```

remains invalid because reviewed_import is not registered as a system-level HKJC primary or fallback runner.

This is the safety property that prevents an evidence-backed operator path from silently becoming automatic system fallback.

## Due-job Planner behavior

The Due-job Planner continues to produce the current HKJC schedule revalidation/refresh Job under system-level Job semantics.

The route-policy resolver verifies that the generated HKJC date-window Job maps to:

```text
schedule route
runner: github_actions
```

The detail route has:

```text
selection_mode: operator_only
automatic_planning_allowed: false
```

Therefore Due-job Planner selection of the detail route is rejected.

## Runner compatibility behavior

The schedule route must match a runner compatibility executor mapping. Current mapping:

```text
system: hong-kong-hkjc-system
runner: github_actions
entry point: scripts/timetable/run-hkjc-live-fixture-job.mjs
```

The detail route is not an automatic runner executor. Its explicit operator entry point is:

```text
scripts/timetable/build-hkjc-detail-reviewed-import-package.mjs
```

That package builder performs no network fetch and requires external input/output paths.

## Operations supplement

PILOT-06B adds an Operations supplement through `buildRouteRunnerPolicyStatusV1`.

It exposes, without changing Operations v2 schema:

- system-level Registry primary runner;
- system-level Registry fallback runner;
- whether system fallback is pending;
- route kind;
- route status;
- selection mode;
- route primary/fallback runner;
- automatic planning state;
- automatic execution state;
- evidence-backed observation ranks.

This is additive. Existing Operations v2 accounting remains unchanged.

## Selection contexts

The resolver recognizes four contexts:

```text
collection_job
due_job_planner
operator_reviewed_import
operations_view
```

Allowed HKJC path matrix:

```text
schedule + collection_job          -> github_actions
schedule + due_job_planner         -> github_actions
detail + operator_reviewed_import  -> reviewed_import
detail + operations_view           -> reviewed_import status visibility
```

Rejected examples:

```text
detail + collection_job
detail + due_job_planner
schedule + operator_reviewed_import
detail + wrong requested runner
detail + unsupported collection mode
```

## Safety boundary

PILOT-06B preserves:

- no automatic import;
- no automatic approval;
- no automatic promotion;
- no canonical write;
- no public write;
- no automatic publication;
- no deployment;
- no automatic execution.

The policy supplement does not activate Registry detail fields, does not expand Registry observation ranks, and does not restore the historical direct source-to-canonical/public chain.

## Handoff condition

PILOT-06B is complete when:

1. route policy schema and current HKJC policy validate;
2. schedule route resolves through the existing Actions compatibility mapping;
3. detail route resolves only in explicit operator reviewed-import context;
4. generic HKJC reviewed_import Collection Job is rejected;
5. Due-job Planner HKJC work resolves only to schedule route;
6. Operations supplement exposes both routes without changing Operations v2 accounting;
7. system-level Registry fallback remains pending;
8. detail source/adapter remain null;
9. all side-effect boundaries remain false.
