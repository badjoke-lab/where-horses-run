# Calendar machine-readable contracts

Status: active canonical implementation contract  
Work ID: `WHR-CAL-CONTRACT-02`  
Last reviewed: 2026-07-08

## Purpose

This document maps the active human-readable Calendar contracts to the schemas, machine-readable maps, and validators that enforce them.

Read together:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
```

The shared model is:

```text
Meeting / Schedule Layer
+
Timetable Detail Layer
+
Coverage Observation
+
Acquisition Control Plane
```

Validation is separated into:

```text
Batch Validation
Promotion Validation
Coverage Audit
Completion Audit
```

## Canonical files

Implemented machine-readable contracts:

```text
data/static/source-test-v2.schema.json
data/static/calendar-readiness.schema.json
data/static/calendar-readiness-registry.json
data/static/calendar-coverage-observation.schema.json
data/static/calendar-validation-responsibilities-v1.json
data/static/authority-source-inventory.schema.json
data/static/authority-source-inventory.json
data/static/timetable-candidate-v1.schema.json
data/static/jra-final-program-intake.schema.json
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
data/static/calendar-collection-job.schema.json
data/fixtures/calendar-collection-jobs-v1.json
data/fixtures/calendar-collection-job-invalid-cases-v1.json
data/static/calendar-collection-plan.schema.json
data/fixtures/calendar-collection-plans-v1.json
data/fixtures/calendar-collection-plan-invalid-cases-v1.json
data/static/calendar-five-rank-classifier-contract-v1.json
data/fixtures/calendar-five-rank-classifier-fixtures-v1.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/timetable/collection-job-validation.mjs
scripts/timetable/collection-plan-validation.mjs
scripts/timetable/five-rank-classifier.mjs
scripts/timetable/coverage-observation-validation.mjs
scripts/timetable/pipeline-v1/promotion-core.mjs
scripts/check-calendar-coverage-observation-schema.mjs
scripts/check-calendar-validation-responsibilities.mjs
scripts/check-calendar-contracts.mjs
scripts/check-authority-source-inventory-schema.mjs
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/check-calendar-acquisition-registry.mjs
scripts/check-calendar-collection-job.mjs
scripts/check-calendar-collection-plan.mjs
scripts/check-calendar-five-rank-classifier.mjs
.github/workflows/calendar-contracts.yml
.github/workflows/calendar-acquisition-registry.yml
.github/workflows/calendar-collection-job.yml
.github/workflows/calendar-collection-plan.yml
.github/workflows/calendar-five-rank-classifier.yml
.github/workflows/calendar-validation-responsibilities.yml
```

Planned control-plane canonical artifacts:

```text
Collection Result Manifest schema
Review Queue schema
Rank-aware Retry Queue schema
associated validators and release gates
```

Until those machine-readable artifacts are implemented, their semantics and implementation order are governed by:

```text
docs/calendar/acquisition-control-plane-contract.md
docs/calendar/acquisition-control-plane-implementation-plan.md
```

## Source capability, operation, and readiness

Source Test v2, authority/source inventory, Calendar Readiness, and the implemented Acquisition Registry keep these states separate:

```text
Technical Rank
Collection Target Rank
Public Ceiling
Calendar Readiness
Runner Profile
Automation Mode
Implementation Status
Source Status
```

A source may support C, B, B+, A, or A+. A meeting may enter the pipeline directly at the highest reviewed rank supported by its evidence. No artificial C-only intermediate publication is required.

The Acquisition Registry routes system/source/adapter profiles to runners without changing candidate or promotion semantics.

## Candidate windows

`timetable-candidate-v1` uses:

```text
candidate_window.start_date
candidate_window.end_date_exclusive
candidate_window.timezone
```

Candidate windows are not inherently monthly. Operators may use arbitrary windows, overlapping retries, one-date runs, or selected-meeting retries when their source-specific contract supports them.

A candidate window describes batch scope. It does not claim that every meeting in the range was available or collected.

Different Collection Jobs in one plan may use different windows.

## Coverage Observation

The active contract is:

```text
data/static/calendar-coverage-observation.schema.json
docs/calendar/coverage-observation-schema.md
scripts/timetable/coverage-observation-validation.mjs
scripts/check-calendar-coverage-observation-schema.mjs
```

It separates requested scope from observed source scope and records unresolved dates, unresolved meeting IDs, source errors, and coverage claim.

Coverage claims are:

```text
none
partial
source_window_complete
audited_complete
```

`partial` is a normal valid state. `audited_complete` requires an audit reference and zero unresolved items or source errors. `not_observed` does not mean no meeting exists.

Coverage Observation cannot directly delete or downgrade canonical/public data.

## Validation responsibility map

The machine-readable role map is:

```text
data/static/calendar-validation-responsibilities-v1.json
```

Its validator is:

```text
scripts/check-calendar-validation-responsibilities.mjs
```

### Batch Validation

Anchor:

```text
scripts/check-calendar-pipeline-v1-candidate-contract.mjs
```

Checks current-batch structure and safety. It may block a malformed current batch but may not require whole-month completeness or block unrelated valid batches.

### Promotion Validation

Anchors:

```text
scripts/check-calendar-pipeline-v1-promotion.mjs
scripts/timetable/pipeline-v1/promotion-core.mjs
```

Normal promotion is monotonic by reviewed rank. A lower-rank ordinary candidate cannot overwrite higher reviewed canonical rank.

A corrective downgrade is a separate explicit core mode and requires one reviewed reason from the responsibility map. The ordinary promotion CLI does not expose corrective mode. Corrective downgrade remains canonical-only.

### Coverage Audit

Anchors:

```text
scripts/check-calendar-coverage-observation-schema.mjs
scripts/timetable/coverage-observation-validation.mjs
```

Coverage incompleteness is reportable state. It does not block unrelated valid promotion.

### Completion Audit

Current source-specific anchor:

```text
scripts/check-calendar-nar-full-month-candidate-set.mjs
```

This is a bounded NAR July completion-audit validator. It is not an ordinary Batch or Promotion gate.

## Five-rank result contract

Common result and queue schemas must preserve:

```text
C
B
B+
A
A+
```

Field-shape semantics:

```text
C  meeting only
B  first race time only
B+ first and final race times, no race rows
A  complete per-race post-time rows
A+ A plus permitted reviewed programme-summary fields
```

The planned rank classifier contract must test all five shapes and direct monotonic upgrades.

Normal incremental behavior:

```text
A+ + later C observation -> keep A+
A + later B+ observation -> keep A
B+ + later B observation -> keep B+
C + later reviewed A+ -> promote to A+
B + later reviewed A -> promote to A
```

A reviewed downgrade requires the separately controlled corrective path. Freshness and source-health changes remain separate from rank.

## Implemented Acquisition Registry

Canonical files:

```text
data/static/calendar-acquisition-registry.schema.json
data/static/calendar-acquisition-registry.json
scripts/timetable/load-calendar-acquisition-registry.mjs
scripts/check-calendar-acquisition-registry.mjs
.github/workflows/calendar-acquisition-registry.yml
```

The Acquisition Registry represents at least:

```text
system_id
country_id
authority_id
primary_runner
fallback_runner
schedule_source_id
detail_source_id
schedule_adapter_id
detail_adapter_id
technical_capability_rank
collection_target_rank
public_ceiling
supported_observation_ranks
supported scope modes
rank-upgrade retry support
```

Initial required system profiles:

```text
japan-jra-system
japan-nar-system
japan-banei-system
```

JRA and NAR are represented without hard-coding runner choice into the common orchestration layer. The initial Banei profile is provisional and preserves explicit pending detail source/adapter state instead of inventing unsupported acquisition capability.

## Planned Collection Job and Plan contracts

The Collection Job schema will define one schedulable acquisition request.

Conceptual required fields:

```text
job_id
campaign_id
system_id
runner_policy
collection_mode
requested_scope
rank_strategy
target_rank
reason
requested_at
```

The Collection Plan schema will allow one campaign to contain multiple independent jobs with different systems, runners, scopes, and target ranks.

```text
one campaign
many independent jobs
independent validation
independent review state
```

Plan grouping must not imply one review PR or one promotion batch.

## Planned Collection Result Manifest

Every job should have a compact result summary containing:

```text
campaign_id
job_id
batch_id
system_id
runner_used
requested_scope
observed_scope
coverage_claim
records_discovered
records_updated
rank_counts.C
rank_counts.B
rank_counts.B+
rank_counts.A
rank_counts.A+
unresolved dates/meetings
source errors
artifact references
```

The manifest summarizes but does not replace candidate or Coverage Observation artifacts.

## Planned Review Queue

The Review Queue machine-readable contract must expose:

```text
campaign/job/batch identity
system
runner
scope
coverage claim
C/B/B+/A/A+ counts
unresolved counts
source error count
review state
promotion state
```

The queue is the shared operator view of validated batches awaiting review.

## Planned Rank-aware Retry Queue

The Retry Queue contract must retain:

```text
meeting_id
system_id
current_reviewed_rank
latest_observed_rank
collection_target_rank
missing_fields
retry_reason
retry_scope
primary_runner
fallback_runner
adapter_id
next_eligible_retry_at
attempt_count
last_attempt_at
```

Retry must support C/B/B+/A/A+ upgrade gaps and direct jumps to the highest newly supported rank.

## Validation commands

Current implemented validators:

```text
node scripts/check-calendar-contracts.mjs
node scripts/check-calendar-coverage-observation-schema.mjs
node scripts/check-calendar-validation-responsibilities.mjs
node scripts/check-authority-source-inventory-schema.mjs
node scripts/check-calendar-pipeline-v1-candidate-contract.mjs
node scripts/check-calendar-pipeline-v1-promotion.mjs
node scripts/check-jra-final-program-intake-schema.mjs
```

These validators prove schema consistency, stable references, partial shorter source horizons, selected-meeting retry observations, completion-claim boundaries, four-role separation, normal rank-regression rejection, and corrective-path isolation.

Control-plane implementation must add dedicated validators for Registry, Job, Plan, five-rank classifier, Result Manifest, Review Queue, and Rank-aware Retry Queue contracts.

## Current next implementation

The shared coverage and validation foundations are complete.

Next:

1. finish the current NAR July remainder promotion/publication path;
2. formalize NAR Actions manual dispatch with local fallback;
3. implement Acquisition Registry schema and initial Japan profiles;
4. implement Collection Job and Collection Plan schemas;
5. implement five-rank classifier contract tests;
6. implement Collection Result Manifest, Review Queue, and Rank-aware Retry Queue schemas;
7. connect Actions and local runners to common job semantics;
8. begin Banei on the shared control-plane foundation;
9. add multi-system execution, review-PR preparation, and scheduling incrementally.

## Change discipline

Changes to enums, stable IDs, runner classes, job modes, rank strategies, merge rules, coverage claims, queue states, validation responsibilities, corrective downgrade rules, or completion conditions must update the affected machine-readable schema/map, human contract, validator, and roadmap together.
