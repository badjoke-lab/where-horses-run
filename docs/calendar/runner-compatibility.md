# Calendar runner compatibility foundation

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The runner compatibility foundation separates acquisition intent from execution environment while preserving one shared result model.

The compatibility path is:

```text
Collection Job
-> runner policy resolution
-> Registry route resolution
-> runner-specific executor
-> source-specific result adapter
-> Coverage Observation
-> Collection Result Manifest
-> Review Queue / Retry Queue
```

GitHub Actions, local execution, and reviewed import may use different acquisition mechanics. They must not create incompatible Job, Coverage, or Result Manifest semantics.

## Canonical artifacts

```text
data/static/calendar-runner-compatibility-contract-v1.json
data/fixtures/calendar-runner-compatibility-fixtures-v1.json
data/fixtures/calendar-runner-compatibility-invalid-cases-v1.json
scripts/timetable/runner-compatibility.mjs
scripts/check-calendar-runner-compatibility.mjs
.github/workflows/calendar-runner-compatibility.yml
```

## Runner resolution

Runner policy is resolved from Collection Job plus Acquisition Registry.

```text
registry_primary
  -> Registry primary runner

registry_primary_or_fallback
  -> Registry primary by default
  -> declared fallback only when explicitly requested

exact
  -> exact runner named by the Job
```

A runner not registered as primary or fallback for the system is rejected.

The runner compatibility contract maps each supported system/runner pair to one bounded executor identity and one source-specific output model.

Initial compatibility mappings are:

```text
NAR + github_actions -> nar-incremental-v2-actions
NAR + local          -> nar-incremental-v2-local
JRA + local          -> jra-refresh-local
JRA + reviewed_import -> jra-reviewed-import
```

## Runner execution contract

Every compiled execution specification carries:

```text
job identity
campaign identity
batch identity
system identity
runner used
executor identity
invocation kind
entry point
collection mode
requested scope
rank strategy
reason
Registry source/adapter route
Coverage contract identity
Result Manifest contract identity
review-required marker
side-effect boundary
```

The execution contract is planning metadata. It does not perform acquisition by itself.

The Registry route is copied exactly from the system profile:

```text
schedule_source_id
detail_source_id
schedule_adapter_id
detail_adapter_id
```

Runner selection must not rewrite source or adapter identity.

## NAR compatibility proof

The existing immutable NAR v2 July remainder batch is used as real integration evidence.

Inputs:

```text
data/generated/timetable/nar-incremental-batches/
  july-2026-08-through-31-run-001/
  collection-report.json

data/generated/timetable/nar-incremental-batches/
  july-2026-08-through-31-run-001/
  coverage-observation.json
```

The normalizer produces a shared Collection Result Manifest with:

```text
records discovered: 82
C:                  71
B:                   0
B+:                  0
A:                   0
A+:                 11
```

The same immutable source result is normalized once with `runner_used=github_actions` and once with `runner_used=local`.

Runner-neutral semantic comparison requires every Manifest field except `runner_used` to remain identical.

This proves that the current NAR Actions-primary and local-fallback paths can share one result meaning. It does not claim that both runners executed the same network request at the same instant.

## JRA compatibility proof

The current JRA local refresh report is normalized into the same Coverage Observation and Collection Result Manifest contracts.

The adapter converts the inclusive JRA report window to the Collection Job exclusive-end window and preserves the existing operator rule that weekday 403 responses are expected non-racing dates.

Unexpected source statuses become bounded Coverage source errors and unresolved dates.

The current July report normalizes to:

```text
records discovered: 24
records updated:    24
A:                   0
A+:                 24
coverage claim: source_window_complete
runner used: local
```

The generated Coverage Observation is validated by the shared Coverage validator. The generated Result Manifest is validated structurally and cross-checked against the same Collection Job, Acquisition Registry, and Coverage Observation contracts used by NAR.

JRA remains local-primary. This foundation does not move JRA acquisition to GitHub Actions.

## Reviewed import

`reviewed_import` remains a registered runner class for bounded human-reviewed intake where the Registry allows it.

The compatibility contract may compile a reviewed-import execution specification, but no file import is automatically approved or published. Human review and Promotion Validation remain separate gates.

## Result neutrality

Runner-specific mechanics may differ in:

```text
process launcher
environment variable transport
local command arguments
network availability
source-specific report shape
artifact production mechanics
```

They must converge on:

```text
Collection Job identity
requested scope
Coverage Observation semantics
five-rank accounting
unresolved state
source-error state
Collection Result Manifest semantics
human-review boundary
```

No runner may redefine C/B/B+/A/A+ or silently change the requested scope.

## Side-effect boundary

Every compiled compatibility execution keeps these effects disabled:

```text
approval: false
promotion: false
canonical_write: false
public_write: false
publication: false
deployment: false
```

`review_required=true` is mandatory.

The compatibility layer does not approve, promote, publish, deploy, or schedule work.

## Banei handoff

This foundation satisfies the runner-neutral batch/result semantics portion of the Banei handoff gate.

Banei may therefore begin source-specific implementation on the shared model without waiting for the full Actions multi-job matrix or scheduler.

Banei must still establish its own source route, adapter behavior, Banei-specific terminology, rank observation behavior, and retry state without inheriting flat-racing assumptions.

## Next handoff

The next shared stage remains Actions multi-job execution:

```text
Collection Plan
-> filter hosted-capable Jobs
-> independent execution
-> independent batch artifacts
-> independent Result Manifests
-> campaign summary
```

JRA shared local-job execution remains the corresponding local-runner stage. The full Runner Gate is not complete until NAR formal Actions execution and JRA shared local Job execution both operate through the common Job/result boundary.
