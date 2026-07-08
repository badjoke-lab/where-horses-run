# Calendar local multi-job runner

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The local multi-job runner lets the operator execute the local-capable subset of one validated Collection Plan with one plan command while preserving each Collection Job as an independent acquisition unit.

The path is:

```text
Collection Plan
-> validate Plan and Jobs
-> resolve Registry runner policy
-> filter local Jobs
-> check executor collection-mode support
-> compile independent execution specifications
-> execute Jobs sequentially with bounded failure isolation
-> write independent batch and status artifacts
-> validate Coverage and Result Manifests
-> build Review Queue snapshot
-> build campaign summary
```

One bounded Job failure does not stop the next independent local Job.

The runner does not turn one Plan into one promotion transaction or one all-or-nothing batch.

## Canonical artifacts

```text
data/fixtures/calendar-local-multi-job-fixtures-v1.json
scripts/timetable/local-multi-job-core.mjs
scripts/timetable/run-jra-local-review-job.mjs
scripts/timetable/run-calendar-local-plan.mjs
scripts/check-calendar-local-multi-job.mjs
.github/workflows/calendar-local-multi-job.yml
```

The runner also consumes:

```text
data/fixtures/calendar-collection-plans-v1.json
data/static/calendar-acquisition-registry.json
data/static/calendar-runner-compatibility-contract-v1.json
```

## Local Job filtering

A Job enters local execution only when:

1. the Collection Plan and Job validate;
2. runner policy resolves to `local`;
3. the compatibility contract contains a local executor mapping;
4. the executor explicitly supports the requested collection mode.

A GitHub Actions Job is excluded as `non_local_runner`; it is not a local failure.

A local-capable system Job using an unsupported collection mode is excluded as `unsupported_collection_mode` rather than silently rewritten into another scope.

## Operator interface

The operator command is:

```text
node scripts/timetable/run-calendar-local-plan.mjs --plan-id=<plan-id>
```

The runner may also consume an explicit Plan file.

The command writes:

```text
local multi-job plan snapshot
per-Job status JSON
per-Job batch directory
campaign summary
campaign Review Queue snapshot
```

## JRA review-only execution

JRA is the first required local-runner compatibility case.

The existing `refresh-jra.mjs` collector currently includes canonical and public projection writes. ACP-11 must not expose those writes through the local multi-job boundary.

Therefore the JRA local executor runs the existing collector inside a temporary detached git worktree.

The isolated worktree may perform its legacy internal canonical/public reconstruction, but those writes remain inside the temporary worktree and are discarded when the Job ends.

The main operator worktree receives only review-boundary artifacts:

```text
candidate.json
coverage-observation.json
result-manifest.json
collection-report.json
source-refresh-report.json
source-snapshot.json
normalized-meetings.json
normalized-details.json
```

The executor then removes the temporary worktree.

This preserves the reviewed collector implementation without allowing ACP-11 to bypass human review or Promotion Validation.

## JRA candidate model

The local executor builds one shared `timetable-candidate-v1` envelope from the public-safe JRA snapshot.

Each discovered meeting retains:

```text
meeting identity
racecourse identity
date and timezone
C / B / B+ / A / A+ observed rank
first race time when available
last race time when available
public-safe timetable rows when available
official source URL
review_status: needs_review
```

No candidate is approved automatically.

The current reviewed July integration evidence normalizes to:

```text
24 discovered meetings
24 updated meetings
24 A+ meetings
0 source errors
source_window_complete
```

This is integration evidence for the current JRA July artifact, not a permanent assumption that every JRA local batch must be 24 A+ meetings.

## Independent local batches

Each local Job receives a deterministic independent batch ID.

Different date windows remain independent. The fixture Plan `jra-two-window-local-001` contains two JRA date-window Jobs and proves that:

```text
July window  -> independent batch
August window -> independent batch
```

The runner executes them sequentially because they share one operator machine, but sequential execution does not merge their identities or outcomes.

## Failure isolation

The local runner catches one bounded Job failure, writes a `source_error` status record, and proceeds to the next local Job where safe.

Campaign outcomes remain:

```text
success
partial
source_error
not_run
```

Examples:

```text
Job A -> success
Job B -> source_error
```

or:

```text
Job A -> success
Job B -> partial
```

Job B does not rewrite Job A.

A missing status becomes `not_run` in campaign summary.

## Result Manifest boundary

For each completed JRA Job, the executor validates:

```text
Coverage Observation structure
Collection Result Manifest structure
Job identity cross-check
Registry runner cross-check
Coverage cross-check
five-rank accounting
artifact references
```

The Manifest uses batch-specific artifact references.

No global candidate or canonical file is used as the promotion unit for the local multi-job run.

## Review Queue update

The campaign summary builds a deterministic Review Queue snapshot from validated `success` and `partial` Result Manifests.

Queue entries start as:

```text
review_state: review_ready
promotion_state: not_ready
```

A `source_error` Job does not enter Review Queue.

Manifest identity must match the planned execution and the corresponding local status record. Unrelated or drifted Manifests are rejected.

Date-level source gaps without a stable meeting identity are not forced into the meeting-specific Rank-aware Retry Queue. Later due-job planning remains responsible for creating explicit follow-up Collection Jobs from coverage gaps.

## Main-worktree safety boundary

The local runner itself does not perform:

- candidate approval;
- Promotion Validation;
- canonical timetable writes;
- public timetable writes;
- deployment;
- scheduled execution;
- unattended retry.

The JRA collector's legacy write behavior is isolated inside the temporary worktree and discarded.

The main worktree only receives review-boundary acquisition artifacts.

## Public data boundary

The local runner follows the existing timetable public display boundary.

It must not store or expose:

- horse names;
- jockey names;
- trainer names;
- draw or gate position;
- weights;
- odds;
- popularity or betting rank;
- results;
- payouts;
- predictions;
- tips;
- raw HTML;
- embedded video;
- direct stream URLs.

A+ remains a lightweight programme summary, not a full racecard.

## ACP-11 completion boundary

ACP-11 is complete when:

- the same Collection Plan/Job contracts feed the local runner;
- local Jobs are filtered without treating non-local Jobs as failures;
- different local scopes remain independent;
- JRA local acquisition produces batch-specific candidate, Coverage, Manifest, status, and report artifacts;
- main-worktree canonical/public writes are prevented through temporary worktree isolation;
- one failed local Job does not erase another valid result;
- success and partial Manifests enter Review Queue independently;
- source errors remain isolated;
- campaign summary preserves independent outcomes.

After ACP-11, the full Runner Gate is complete for the required first compatibility set:

```text
NAR Actions path
NAR local fallback semantic compatibility
JRA shared local Job path
```

This does not enable scheduling or automatic promotion.

## Next handoff

After ACP-11, ACP-12 review cohort planning becomes current shared work.

Banei source-specific implementation may proceed on the shared foundation. The next shared control-plane work groups validated review-ready batches by source compatibility, rank distribution, public-display risk, promotion dependency, and failure isolation rather than by campaign timing alone.
