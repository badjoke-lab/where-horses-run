# Calendar Actions multi-job runner

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The Actions multi-job runner executes the hosted-capable subset of one validated Collection Plan while preserving each Collection Job as an independent acquisition unit.

The path is:

```text
Collection Plan
-> validate Plan and Jobs
-> resolve Registry runner policy
-> filter github_actions-capable Jobs
-> verify executor collection-mode support
-> compile independent execution specifications
-> matrix execution with fail-fast: false
-> independent status and batch artifacts
-> campaign summary
```

One Job failure does not rewrite another Job result.

The runner does not turn a Collection Plan into one review cohort, one promotion transaction, or one all-or-nothing acquisition batch.

## Canonical artifacts

```text
scripts/timetable/actions-multi-job-core.mjs
scripts/timetable/plan-actions-multi-job.mjs
scripts/timetable/run-calendar-actions-job.mjs
scripts/timetable/run-hkjc-bounded-generator-job.mjs
scripts/timetable/summarize-actions-multi-job.mjs
scripts/check-calendar-actions-multi-job.mjs
.github/workflows/calendar-actions-multi-job.yml
```

The runner also consumes:

```text
data/fixtures/calendar-collection-plans-v1.json
data/static/calendar-acquisition-registry.json
data/static/calendar-runner-compatibility-contract-v1.json
```

## Hosted-capable filtering

A Job is admitted to the Actions matrix only when all of these conditions hold:

1. the Collection Plan and Job are valid;
2. runner policy resolves to `github_actions`;
3. the runner compatibility contract contains a system/runner executor mapping;
4. that executor explicitly supports the Job collection mode.

Jobs using local or reviewed-import runners are excluded without invalidating hosted Jobs.

Jobs whose system is Actions-capable but whose executor does not support the requested collection mode are explicitly excluded as `unsupported_collection_mode`.

This prevents Registry-level runner capability from being mistaken for universal executor support.

## Independent batch identity

Every hosted Job receives a deterministic independent batch ID:

```text
<plan-id>-<job-id>-run-001
```

The batch ID is attached to the compiled runner execution specification and is not shared with unrelated Jobs in the same Plan.

Each matrix entry retains:

```text
job_id
batch_id
execution specification
artifact paths
```

Different systems and different requested scopes remain independent.

## Matrix isolation

The formal workflow uses:

```text
strategy:
  fail-fast: false
```

Each Job writes its own status artifact and uploads its own batch artifacts with `if: always()`.

A successful NAR Job remains `success` even if an HKJC Job in the same Plan returns `source_error`.

A missing status record becomes `not_run` in the campaign summary. It does not rewrite existing successful or partial results.

Duplicate or unknown status records are rejected.

## Job status model

Each hosted Job produces one bounded status record:

```text
success
partial
source_error
```

The campaign summary reuses the Collection Plan outcome model and adds `not_run` for a planned hosted Job with no valid status artifact.

The summary retains:

```text
plan identity
campaign identity
hosted Job count
excluded Job count
per-Job result
success / partial / source_error / not_run counts
excluded Job details
validated status records
```

The summary is observational. It does not approve or promote any batch.

## NAR Actions executor

NAR hosted Jobs use the existing formal NAR incremental v2 Actions path.

Supported collection modes are:

```text
date_window
selected_meetings
```

The multi-job dispatcher converts the shared execution specification into the existing bounded NAR Actions environment inputs and preserves the existing immutable batch artifacts.

NAR single-date Jobs are not silently translated into another scope. They are excluded unless and until the executor contract explicitly supports that mode.

## HKJC bounded executor

HKJC Actions Jobs use a bounded review-only executor around the existing `hong-kong-hkjc-dry-run-adapter` source evidence.

The current bounded source window is the existing candidate window. The executor does not claim live coverage beyond that evidence.

When the requested Job window is fully inside the bounded source window, the executor may emit a C-level meeting result with `source_window_complete` coverage.

When the requested Job window only partially overlaps the bounded source window, the executor emits `partial` coverage plus a source error explaining that the full requested scope was not observed.

When there is no overlap, the executor emits:

```text
coverage_claim: none
records_discovered: 0
source_error_count: 1
status: source_error
```

This is an honest failure state, not a zero-meeting success claim.

The executor has a `--check-only` mode for CI validation without writing generated output files.

## Multi-system example

The `nar-hkjc-actions-window-001` Plan contains:

```text
NAR  -> September date window
HKJC -> August date window
```

Both Jobs resolve to GitHub Actions, but their requested windows remain different.

The matrix compiles two independent execution specifications and two independent batch IDs.

The campaign may therefore end as:

```text
NAR  -> success
HKJC -> source_error
```

without flattening either result.

## Mixed runner example

The `japan-dual-runner-august-001` Plan contains:

```text
JRA -> local
NAR -> github_actions
```

The Actions runner executes only NAR and records JRA as excluded with `non_actions_runner`.

JRA is not a failed Actions Job. It belongs to the shared local multi-job stage.

## Rank and scope isolation

The runner preserves each Job's:

```text
collection_mode
requested_scope
rank_strategy
target_rank
reason
```

A selected-meeting rank-upgrade retry does not inherit the date window of a regular refresh Job.

A low-rank target Job does not redefine another Job's best-available strategy.

Executor support is checked before matrix admission.

## Artifact preservation

The workflow uploads independent Job artifacts even after a matrix Job failure.

NAR artifact families include immutable candidate and generated batch directories.

HKJC bounded artifacts include candidate summary, Coverage Observation, Result Manifest, and collection report under the Job batch directory.

Every hosted Job also has an independent status JSON artifact.

The final campaign summary is uploaded separately.

## Security and publication boundary

The Actions multi-job workflow uses:

```text
permissions:
  contents: read
```

It has no schedule or cron trigger.

The workflow does not:

- approve candidates;
- promote canonical timetable data;
- write public projection data;
- publish or deploy the site;
- enable unattended publication;
- enable scheduled retry.

The acquisition output still requires the existing human review and Promotion Validation boundaries.

The runner handles no participant, horse, jockey, trainer, betting, odds, result, payout, prediction, tip, raw source body, credential, or direct-stream data.

## ACP-10 completion boundary

ACP-10 is complete when:

- a validated Collection Plan can be filtered to hosted-capable Jobs;
- hosted Jobs can keep different scopes and targets;
- matrix execution is isolated with `fail-fast: false`;
- each Job preserves independent batch and status artifacts;
- failure in one Job does not rewrite another Job outcome;
- campaign summary preserves `success`, `partial`, `source_error`, and `not_run` independently;
- no approval, promotion, publication, deployment, or scheduling side effect is added.

The full Runner Gate is not complete after ACP-10 alone.

JRA shared local Job execution remains ACP-11 work.

## Next handoff

After ACP-10, ACP-11 local multi-job execution becomes current shared work.

Banei source-specific implementation may begin on the already satisfied minimum handoff gate and does not need to wait for the full Actions matrix or scheduler. The shared local runner remains necessary before the full Runner Gate is closed.

Scheduled execution remains disabled until later due-job planning and scheduling stages are explicitly implemented.
