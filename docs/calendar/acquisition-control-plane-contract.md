# Calendar acquisition control plane contract

Status: adopted foundation  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

This contract defines the shared operating model for acquiring, validating, retrying, reviewing, and preparing Calendar timetable updates across multiple racing systems.

The control plane exists because racing systems do not share one acquisition environment or one source shape. Some systems can be acquired from GitHub Actions, some require a local runner, some use separate Schedule and Detail sources, and later systems may require reviewed import paths.

The operator must not need to remember source-specific runner rules or manually reconstruct retry state from conversation history.

The control plane therefore separates:

```text
what to collect
from
where and how collection runs
```

The common operating flow is:

```text
Collection Plan
-> independent Collection Jobs
-> runner routing
-> source-specific adapters
-> field observation
-> rank classification
-> Batch Validation
-> Coverage Observation
-> Review Queue
-> Rank-aware Retry Queue
-> review cohort planning
-> human review
-> Promotion Validation
-> monotonic canonical promotion
-> public projection
-> publication QA
```

Unattended publication is outside this contract and remains disabled unless separately approved.

## Governing relationships

This contract is read together with:

```text
docs/calendar/incremental-coverage-contract.md
docs/calendar/coverage-observation-schema.md
docs/calendar/validation-responsibility-contract.md
docs/calendar/pipeline-v1-candidate-contract.md
docs/calendar/pipeline-v1-promotion.md
docs/calendar/pipeline-v1-public-projection.md
docs/calendar/acquisition-control-plane-implementation-plan.md
```

Source-specific contracts and runbooks remain authoritative for parser semantics and source limitations. They must not redefine the shared job, rank, review, retry, or promotion model.

## Operating unit

The control plane is system/source/adapter oriented, not country-only.

A country may contain multiple independently operated racing systems:

```text
Japan
├─ JRA
├─ NAR
└─ Banei
```

Those systems may use different sources and runners. Therefore operational routing is keyed by stable identifiers such as:

```text
system_id
source_id
adapter_id
```

Country remains important for identity, navigation, and policy, but country alone is not a sufficient acquisition routing key.

## Runner classes

The first supported runner classes are:

```text
github_actions
local
reviewed_import
```

`github_actions` means the source can be acquired from the hosted Actions environment with bounded validated behavior.

`local` means acquisition requires the operator's local execution environment or is intentionally kept local because hosted acquisition is blocked, unreliable, or unsuitable.

`reviewed_import` means the source enters through a bounded manual or document-import path whose normalized output still passes the common candidate, coverage, review, and promotion gates.

Runner choice is operational metadata. It does not change meeting identity, rank definitions, review requirements, or promotion rules.

## Primary and fallback runners

An acquisition profile may define:

```text
primary_runner
fallback_runner
```

Example operating profiles:

```text
JRA
primary_runner: local
fallback_runner: reviewed_import or none

NAR
primary_runner: github_actions
fallback_runner: local
```

NAR's GitHub Actions primary status becomes active only when the formal workflow-dispatch path is merged and validated. Until that activation, temporary diagnostic workflows remain non-canonical execution aids.

A fallback runner must produce the same common batch semantics as the primary runner. Runner fallback must not create a second incompatible data model.

## Acquisition Registry

The future Acquisition Registry is the control plane's routing source of truth.

Each system profile should be able to declare at least:

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
supports_date_window
supports_cross_month_window
supports_selected_meetings
supports_source_visible_horizon
supports_rank_upgrade_retry
operator_notes
```

`technical_capability_rank`, `collection_target_rank`, and `public_ceiling` are different facts.

Example:

```text
technical_capability_rank: A+
collection_target_rank: best_available
public_ceiling: A
```

means the source may support A+ acquisition while the current public policy exposes no more than A.

The registry must not claim a capability merely because a system-level maximum is theoretically possible. Capability remains evidence-based and source-specific.

## Collection Plan

A Collection Plan groups one or more independent Collection Jobs under one campaign identity.

One plan may contain different systems, runners, modes, and date ranges.

Example:

```text
campaign_id: 2026-08-05-regular-refresh

job 1
system: japan-jra-system
runner: local
scope: 2026-08-10 .. 2026-08-31

job 2
system: japan-nar-system
runner: github_actions
scope: 2026-08-01 .. 2026-08-31

job 3
system: hong-kong-hkjc-system
runner: github_actions
scope: 2026-08-05 .. 2026-08-20
```

Jobs in one plan do not need a shared date range.

A plan is an execution grouping, not a review or promotion transaction.

```text
execution grouping
!=
review cohort
!=
promotion batch
```

One failed job must not invalidate unrelated successful jobs.

## Collection Job

A Collection Job is the smallest schedulable acquisition request.

The job model must support at least:

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

Supported conceptual `collection_mode` values include:

```text
date_window
single_date
selected_meetings
source_visible_horizon
```

Supported conceptual `reason` values include:

```text
regular_refresh
coverage_gap
rank_upgrade_retry
source_revalidation
manual_recovery
completion_audit_support
```

A job must use one explicit scope. A date window and selected meeting set must not be ambiguously combined.

## Rank strategy

The default strategy is:

```text
rank_strategy: best_available
```

This means the adapter and classifier should emit the highest evidence-supported safe rank available for each individual meeting in the current observation.

A targeted investigation or retry may instead use:

```text
rank_strategy: target_rank
target_rank: B+
```

Targeted rank does not authorize fabricated fields. If the requested target is not supported by the observed evidence, the actual observed rank remains lower and the missing fields remain explicit.

## Five first-class timetable ranks

The control plane must treat every public timetable rank as a first-class operational result:

```text
C
B
B+
A
A+
```

The classifier meanings are:

### C

Confirmed:

```text
meeting identity
date
racecourse
authority/system provenance
```

No race time is required.

### B

Confirmed:

```text
C fields
+
first_race_time
```

`last_race_time` remains unknown.

### B+

Confirmed:

```text
B fields
+
last_race_time
```

The last race time must be the final race start time, not a meeting end time or closing time.

### A

Confirmed:

```text
B+ timing envelope
+
per-race labels or race numbers
+
per-race post times
```

A records timetable rows but does not require A+ programme-summary fields.

### A+

Confirmed:

```text
A fields
+
reviewed programme-summary fields allowed by source and publication policy
```

The shared A+ field set remains bounded by the candidate and public projection contracts.

## Rank classifier rule

Adapters may observe different combinations of fields. The classifier derives the highest rank whose required shape is fully supported.

Conceptually:

```text
meeting only
-> C

+ first race time
-> B

+ final race time
-> B+

+ complete per-race post-time rows
-> A

+ approved A+ summary fields
-> A+
```

The classifier must never fill missing intermediate fields by inference merely to reach a higher rank.

The architecture does not require sequential writes through every rank. Valid direct transitions include:

```text
C -> B+
C -> A
C -> A+
B -> A
B -> A+
B+ -> A+
```

Normal promotion remains monotonic.

## Monotonic rank order

The shared order is:

```text
C < B < B+ < A < A+
```

A later lower-detail observation must not automatically downgrade canonical or public data.

Examples:

```text
A+ canonical + later C observation
-> keep A+

B+ canonical + later B observation
-> keep B+

C canonical + later A review
-> promote to A
```

Corrective downgrade remains a separate reviewed path governed by the promotion and validation contracts.

## Collection result summary

Every completed job should be summarizable across all five ranks.

Example:

```text
C: 40
B: 3
B+: 5
A: 7
A+: 12
```

The result summary must also separate:

```text
records_discovered
records_updated
source_errors
unresolved_dates
unresolved_meeting_ids
coverage_claim
```

Rank counts do not replace Coverage Observation.

## Batch independence

Each Collection Job produces an immutable batch identity.

Multiple jobs may run together, but their source evidence and output batches remain independently reviewable.

A campaign with five jobs may legitimately end as:

```text
3 success
1 partial
1 failed
```

The three successful batches may proceed to review. The partial batch may also proceed where its valid records are independently reviewable. The failed job goes to retry or operator intervention.

No campaign-wide all-or-nothing gate is permitted unless the campaign explicitly performs a Completion Audit.

## Review Queue

The Review Queue is the operator-facing inventory of validated acquisition batches awaiting human decision.

The queue must make visible at least:

```text
campaign_id
job_id
batch_id
system_id
runner_used
requested_scope
coverage_claim
rank_counts.C
rank_counts.B
rank_counts.B+
rank_counts.A
rank_counts.A+
unresolved_dates_count
unresolved_meeting_ids_count
source_error_count
review_state
promotion_state
```

The queue is not limited to C and A+.

A review cohort may group compatible batches for one PR, but grouping must not hide source identity, rank distribution, or unresolved coverage.

## Rank-aware Retry Queue

Retry state must be rank-aware.

Each retry target should be able to retain:

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

The retry model must support all upgrade paths, including:

```text
C -> B
C -> B+
C -> A
C -> A+
B -> B+
B -> A
B -> A+
B+ -> A
B+ -> A+
A -> A+
```

A retry may jump directly to the highest newly supported rank. The system must not perform artificial intermediate promotions.

## Retry selection modes

The control plane must support:

```text
retry a broad date window
retry one date
retry selected meeting IDs
retry one system
retry several systems
retry only a target rank gap
```

Examples:

```text
all C meetings in one system for the next 30 days
all B meetings missing last_race_time
selected A meetings missing A+ summary fields
two systems with separate requested windows
```

Retry scheduling policy is separate from rank and publication state.

## Actions multi-job execution

GitHub Actions-capable jobs may be executed as a matrix or equivalent independent job set.

Different matrix entries may use different systems and date ranges.

Conceptually:

```text
Campaign
├─ NAR: 2026-08-01 .. 2026-09-01
├─ HKJC: 2026-08-05 .. 2026-08-20
└─ KRA: 2026-08-10 .. 2026-08-17
```

Each matrix entry must preserve its own job ID, batch ID, scope, logs, Coverage Observation, and review state.

One failed matrix entry must not erase successful job artifacts.

## Local multi-job execution

Local-only jobs should also use Collection Plans rather than requiring the operator to construct multiple source-specific commands manually.

The target operating model is conceptually:

```text
run local pending plan
-> route each local job to its adapter
-> preserve independent batch outputs
-> validate each output
-> update Review Queue and Retry Queue
```

The operator may execute several local systems in one session even when their requested scopes differ.

Local execution is an execution environment, not a separate review model.

## Review cohort and PR boundary

Acquisition campaigns may be broad, but review and PR boundaries should remain risk-bounded.

Possible grouping factors include:

```text
system/source compatibility
rank distribution
public display risk
source failure isolation
promotion dependencies
```

A campaign containing JRA, NAR, HKJC, and UAE may produce several review PRs.

The control plane should eventually be able to prepare review PRs automatically, but PR creation does not equal approval.

The preferred automation stop point is:

```text
automatic source acquisition
-> automatic normalization
-> automatic validation
-> automatic Coverage Audit
-> automatic bounded retry planning
-> automatic review PR preparation
-> HUMAN REVIEW REQUIRED
```

Promotion and publication remain governed by explicit review and release gates.

## Source-specific transition profiles

### JRA

Current acquisition direction:

```text
primary runner: local
```

JRA source-specific local acquisition remains valid. The control plane should generate pending local jobs so the operator can execute one plan rather than reconstruct commands manually.

### NAR

Target acquisition direction after formal workflow activation:

```text
primary runner: github_actions
fallback runner: local
```

The hosted environment has successfully completed bounded NAR acquisition runs. Formal workflow-dispatch operation must replace temporary diagnostic harnesses before this becomes the canonical normal path.

NAR result classification must not remain permanently limited to a C/A+ pair. The current NAR v2 implementation may produce those two observed states for its present source behavior, but the shared control plane remains five-rank capable.

### Banei and later systems

Runner assignment and rank profile must be based on source tests and actual acquisition evidence. Do not copy JRA or NAR runner assumptions into another system.

## State machine

A Collection Job should move through explicit operational states such as:

```text
planned
queued
running
collected
validated
partial
failed
review_ready
reviewing
approved
rejected
promotion_ready
promoted
published
retry_queued
```

Not every job uses every state. The state machine must not conflate:

```text
collection success
review approval
promotion success
publication success
coverage completeness
```

Those remain separate facts.

## Automation progression

The adopted progression is:

### Level 1 — operator-triggered mixed runners

```text
Actions manual dispatch where supported
local plan execution where required
common immutable batches
human review
```

### Level 2 — shared plan and queues

```text
Acquisition Registry
Collection Job schema
Collection Plan schema
five-rank classifier contract
Review Queue
Rank-aware Retry Queue
```

### Level 3 — multi-system execution

```text
Actions matrix execution
local multi-job execution
failure isolation
campaign summaries
review cohort planning
```

### Level 4 — automated review preparation

```text
due-job planner
automatic acquisition for hosted-capable systems
automatic retry selection
automatic validated review PR preparation
human review gate
```

### Level 5 — steady-state scheduling

```text
scheduled regular refresh
scheduled rank-gap retry policy
source revalidation jobs
coverage-gap jobs
human-reviewed promotion and publication
```

This progression must not be interpreted as permission for unattended publication.

## Safety and public-data boundary

The control plane may store reviewed public-safe derived metadata, schemas, status, hashes, and bounded candidate artifacts.

It must not introduce participant, betting, result, payout, prediction, credential, raw source body, direct stream, or other prohibited content into public acquisition artifacts.

Runner capability does not override publication policy.

## Completion conditions

The control-plane foundation is complete only when:

1. runner routing is represented by an Acquisition Registry;
2. Collection Job and Collection Plan schemas support independent per-system scopes;
3. C/B/B+/A/A+ classification is tested as a common contract;
4. Review Queue and rank-aware Retry Queue contracts exist;
5. Actions and local runners consume the same job semantics;
6. multi-job failures are isolated;
7. review PR preparation does not imply approval;
8. canonical/public writes remain separately gated;
9. JRA and NAR can both be represented without source-specific orchestration logic leaking into the common control model;
10. Banei can adopt the model without inheriting flat-racing parser assumptions.

Implementation order is defined in `docs/calendar/acquisition-control-plane-implementation-plan.md`.
