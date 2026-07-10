# HKJC shared Actions live evidence

Status: completed evidence review; profile remains provisional  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-03`  
Last reviewed: 2026-07-10

## Purpose

This unit connects the HKJC artifact-only fixture bridge to the shared Calendar Actions Job path and captures actual live artifact evidence before any Registry activation decision.

The path is:

```text
Collection Plan
-> shared Actions planner
-> immutable Runner Execution
-> shared Actions dispatcher
-> hkjc-live-fixture-actions executor
-> external-temp official fixture acquisition
-> validated C-level review artifacts
-> shared per-Job artifact directory
-> Actions artifact upload
-> evidence summary review
-> Registry status re-evaluation
```

The profile remains provisional until actual live artifact evidence is reviewed and a separate decision is recorded.

## Shared Plan

The existing shared Collection Plan remains:

```text
nar-hkjc-actions-window-001
```

The HKJC Job remains:

```text
job_id: hkjc-august-actions-plan-job-001
system_id: hong-kong-hkjc-system
runner: github_actions
collection_mode: date_window
start_date: 2026-08-01
end_date_exclusive: 2026-08-29
timezone: Asia/Hong_Kong
```

The NAR and HKJC Jobs keep independent windows, batch IDs, execution states, and outcomes.

An HKJC source error must not rewrite a successful NAR outcome.

## Registry transition in this unit

The HKJC Registry schedule path now identifies:

```text
schedule_source_id: hkjc-fixture-list
schedule_adapter_id: hkjc-fixture-artifact-bridge-v1
primary_runner: github_actions
fallback_runner: local
supported_observation_ranks: C
```

The profile remains provisional.

The following remain intentionally unactivated:

```text
detail_source_id: null
detail_adapter_id: null
```

Historical A+ evidence remains migration evidence only and is not used to activate detail acquisition.

## Runner compatibility

The HKJC Actions mapping is:

```text
executor_id: hkjc-live-fixture-actions
entry_point: scripts/timetable/run-hkjc-live-fixture-job.mjs
output_model: hkjc-live-fixture-artifact-batch
supported_collection_modes: date_window
```

The execution remains review-required and all side-effect flags remain false.

## Executor boundary

The shared executor has two paths.

### Production live path

```text
shared execution specification
-> external temporary directory
-> PILOT-02 live collector
-> candidate / Coverage / Manifest / report validation
-> copy exactly four review artifacts
-> shared Actions artifact directory
```

The shared artifact directory exists only in the ephemeral Actions checkout and is uploaded by the workflow.

No commit is created.

### Fixture check-only path

The permanent tests use reviewed fixed month-result fixtures.

The fixture path:

- performs no network fetch;
- performs no repository write;
- validates the same PILOT-02 artifact builder;
- validates the compiled shared execution identity;
- validates success and source-error behavior.

## Actual live artifact evidence

The PR evidence workflow runs the actual shared dispatcher path for the HKJC Job extracted from `nar-hkjc-actions-window-001`.

The workflow does not promote or publish the result.

It records and uploads:

```text
actions Job status
candidates.json
coverage-observation.json
result-manifest.json
collection-report.json
bounded summary log
```

The evidence review records:

- coverage claim;
- discovered record count;
- source error count;
- C-rank count;
- Job status;
- whether candidate review state remains `needs_review`;
- whether canonical/public/config state remained unchanged.

The reviewed actual live evidence is:

```text
workflow_run_id: 29094860976
batch_id: nar-hkjc-actions-window-001-hkjc-august-actions-plan-job-001-run-001
requested_scope: 2026-08-01 through 2026-08-29 exclusive
coverage_claim: none
observed_scope: not_observed
records_discovered: 0
records_updated: 0
source_error_count: 1
source_error_code: parser_failure
source_error_scope: month:2026-08
job_status: source_error
envelope_review_state: needs_review
protected state hash check: pass
repository clean after cleanup: true
publication_effect: none
canonical_write_enabled: false
public_write_enabled: false
automatic_approval_enabled: false
automatic_promotion_enabled: false
automatic_publication_enabled: false
```

The shared Actions execution path, artifact transport, summary generation, protected-state verification, upload, cleanup, and clean-worktree proof all succeeded. The official fixture request returned a response, but the August 2026 page produced no recognized fixture markers. The bridge therefore classified the run as fail-closed `parser_failure` with `coverage_claim: none`.

This evidence does not justify Registry activation. The HKJC profile remains provisional and the next unit is route/parser resilience reconciliation.

## Live evidence interpretation

A successful source-window observation may support schedule-path activation review.

It does not support:

- detail-source activation;
- detail-adapter activation;
- A or A+ evidence claims;
- automatic approval;
- automatic promotion;
- automatic publication;
- scheduler execution.

A source-error result is also valid evidence. It must keep the Registry profile provisional and preserve explicit source failure state.

## Human review boundary

This human review boundary remains mandatory for every artifact produced by the shared live path.

Every candidate remains:

```text
review_status: needs_review
review.status: needs_review
promotion_target: null
```

Human review is required before any later promotion proposal.

This unit contains no automatic promotion and no automatic publication.

## Public data boundary

The shared live fixture path remains Rank C only.

It may contain meeting identity, racecourse identity, date, timezone, source trace, confidence, and review state.

It must not contain:

- race times;
- timetable rows;
- race names;
- distance;
- surface;
- course;
- participant lists;
- horse names;
- jockey names;
- trainer names;
- weights;
- draw/gate/post positions;
- odds;
- betting data;
- results;
- payouts;
- predictions or tips;
- raw HTML or source body;
- embedded video;
- direct stream URLs.

## Validation

The permanent checker is:

```text
node scripts/check-calendar-hkjc-shared-actions-live-evidence.mjs
```

It proves:

- Registry remains provisional;
- schedule adapter points to the PILOT-02 bridge;
- detail acquisition remains inactive;
- runner compatibility resolves to the live fixture executor;
- the existing NAR/HKJC Plan compiles two independent hosted Jobs;
- the HKJC execution preserves its date window and source route;
- fixed success evidence yields source-window-complete C candidates;
- fixed source failure yields explicit none/source-error semantics;
- check-only execution does not modify canonical/public/config state;
- dispatcher and executor contain no canonical/public writer invocation;
- shared and evidence workflows remain contents-read only and unscheduled.

## Completion boundary

`HKJC-PILOT-03` is complete when:

1. the shared planner compiles HKJC to `hkjc-live-fixture-actions`;
2. the shared dispatcher runs the live fixture executor;
3. fixed integration tests pass;
4. one bounded actual live artifact run completes;
5. the actual artifact summary is inspected and recorded;
6. Registry provisional/active status is explicitly re-evaluated;
7. detail source/adapter remain separate from schedule-path evidence;
8. no automatic approval, promotion, publication, or scheduler execution is enabled.

## Next implementation unit

The next implementation unit is reserved as:

```text
HKJC-PILOT-04
```

The reviewed PILOT-03 evidence selects:

```text
HKJC official fixture route and parser resilience reconciliation
```

PILOT-04 must review the current official fixture page structure and any alternate official fixture route, improve parser resilience using public-safe fixture evidence, and repeat bounded shared-Actions evidence before Registry activation is reconsidered.

Detail-source inventory and bounded detail-adapter transition planning are deferred until the schedule path produces reviewed successful evidence.
