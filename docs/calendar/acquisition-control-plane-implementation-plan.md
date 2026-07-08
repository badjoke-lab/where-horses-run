# Calendar acquisition control plane implementation plan

Status: adopted programme plan  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

This plan schedules the transition from source-specific operator commands to one shared Calendar acquisition operating model.

The control plane must support:

```text
multiple racing systems
multiple runners
multiple date windows in one campaign
single-system retries
multi-system retries
C / B / B+ / A / A+ result classification
human review before promotion/publication
```

The plan does not replace source-specific adapters. It standardizes job planning, runner routing, result classification, review state, retry state, and review preparation around those adapters.

## Starting point

At the time this plan is adopted:

- JRA acquisition is local-first because hosted acquisition was not reliable for the source path;
- NAR acquisition has succeeded in GitHub Actions during bounded runs;
- NAR has a schedule-aware immutable v2 batch path;
- the July 8–31 NAR batch has 82 published schedule-confirmed meetings, including 11 A+ detail records and 71 C schedule records;
- the 71 C meetings remain explicit detail-retry work;
- temporary diagnostic PRs #430 and #435 are closed without merge;
- formal NAR workflow-dispatch acquisition is active with GitHub Actions primary and local fallback;
- Banei remains the next source-specific pilot after the shared control-plane foundation is established.

## Programme order

The adopted order is:

```text
A. finish current NAR July remainder promotion/publication
B. close temporary NAR diagnostic PRs
C. formalize NAR Actions manual dispatch with local fallback
D. implement acquisition control plane foundation
E. connect Actions and local runners to shared Job/Plan semantics
F. implement Review Queue and Rank-aware Retry Queue
G. add multi-system execution and review cohort planning
H. resume Banei source-specific implementation on the shared model
I. add scheduler and automatic review-PR preparation incrementally
```

Banei must not be used as a reason to skip the control-plane foundation, and the control-plane work must not discard the current NAR review/promotion state.

## Work IDs

Completed source-specific work:

```text
WHR-CAL-JAPAN-NAR-A-PLUS
```

Current shared work:

```text
WHR-CAL-ACQUISITION-CONTROL-PLANE
```

Subsequent source-specific work:

```text
WHR-CAL-JAPAN-BANEI-A-PLUS
```

Later shared automation work may remain under the control-plane Work ID until the foundation release gate is closed, then move to a separately named operations-automation Work ID if scope grows materially.

## Stage ACP-0 — documentation and transition alignment

Status: complete.

Deliverables:

1. add `acquisition-control-plane-contract.md`;
2. add this implementation plan;
3. update project and Calendar roadmaps;
4. update Calendar documentation index and START-HERE;
5. update incremental coverage contract with runner-neutral and rank-aware retry requirements;
6. update NAR runbook to distinguish current local command support from the target Actions-primary operating model;
7. update documentation authority to include the new canonical contract and plan.

Completion condition:

```text
canonical docs no longer say that all ordinary NAR acquisition is permanently local-only
and
all shared operating plans explicitly preserve C/B/B+/A/A+
```

## Stage ACP-1 — finish NAR July remainder publication

Status: complete.

Deliverables:

1. finalize review decision for the July 8–31 batch;
2. generate approved promotion envelopes using source-compatible boundaries;
3. validate C and A+ promotion paths independently;
4. perform canonical normal promotion;
5. rebuild public projection;
6. run rendered bilingual QA and release checks;
7. publish reviewed output;
8. preserve the 71 pending-detail meetings as retry targets after publication.

The current observed NAR batch is allowed to contain only C and A+ because those are the observed source outcomes for that run. This must not redefine the global five-rank model.

## Stage ACP-2 — NAR formal workflow-dispatch operation

Status: complete. The canonical manual-dispatch workflow accepts bounded date-window or selected-meeting input, writes immutable review artifacts only, validates shared boundaries, and uploads the four review artifacts without approval or publication side effects.

Inputs must support at least:

```text
batch_id
mode
start_date
end_date_exclusive
meeting_ids
```

The workflow must:

1. validate mutually exclusive scope modes;
2. run the existing NAR v2 acquisition path;
3. preserve immutable batch paths;
4. run batch and coverage validators;
5. upload review artifacts;
6. expose failure state clearly;
7. perform no approval, promotion, canonical write, public write, or publication.

Operating profile after release:

```text
NAR primary runner: github_actions
NAR fallback runner: local
```

The local runner remains supported and must produce equivalent common batch semantics.

## Stage ACP-3 — Acquisition Registry

Status: complete. The machine-readable registry, schema, loader, validator, initial Japan profiles, and CI are implemented.

Goal: remove runner and capability knowledge from operator memory.

Add a machine-readable Acquisition Registry and schema.

Minimum profile fields:

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
```

Initial registry entries must cover at least:

```text
japan-jra-system
japan-nar-system
japan-banei-system
```

Banei values may remain explicitly pending where source testing has not yet established them.

Validation must reject:

- unknown runner classes;
- impossible rank values;
- target rank above technical capability;
- public ceiling above approved policy;
- selected-meeting retry enabled without adapter support;
- missing primary runner.

## Stage ACP-4 — Collection Job schema

Status: complete. The schema, validation core, valid fixtures, negative fixtures, contract documentation, and dedicated CI are implemented.

Goal: define one schedulable acquisition request format.

Required concepts:

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

Supported collection modes:

```text
date_window
single_date
selected_meetings
source_visible_horizon
```

Supported rank strategies:

```text
best_available
target_rank
```

Supported reasons initially:

```text
regular_refresh
coverage_gap
rank_upgrade_retry
source_revalidation
manual_recovery
completion_audit_support
```

Add fixtures covering:

- one NAR month window;
- one JRA local window;
- selected-meeting retry;
- B to B+ target retry;
- A to A+ target retry;
- invalid mixed date-window and selected-meeting scope.

## Stage ACP-5 — Collection Plan schema

Status: complete. The schema, validation core, valid multi-system fixtures, negative fixtures, rank-isolation checks, source-error-isolation checks, contract documentation, and dedicated CI are implemented.

Goal: allow one campaign to contain multiple systems with independent scopes.

A plan must support:

```text
one campaign
many jobs
different runners
different date windows
different reasons
different target ranks
```

Required tests:

1. JRA local + NAR Actions in one plan;
2. NAR and HKJC Actions jobs with different date windows;
3. one regular refresh plus one selected-meeting retry;
4. duplicate job ID rejection;
5. invalid system/runner mismatch rejection;
6. campaign remains valid when jobs have different scope lengths.

A plan must not imply one review PR or one promotion transaction.

## Stage ACP-6 — shared five-rank classifier contract

Status: complete. The machine-readable contract, classifier core, classification fixtures, transition/regression fixtures, invalid-shape fixtures, cross-contract validator, documentation, and dedicated CI are implemented.

Goal: make C/B/B+/A/A+ classification a tested common layer.

Required field-shape tests:

```text
C  -> meeting only
B  -> first race time only
B+ -> first and final race times, no race rows
A  -> complete per-race post-time rows
A+ -> A rows plus permitted reviewed summary fields
```

Required transition tests:

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

Required regression tests:

```text
A+ + later C observation -> keep A+
A + later B+ observation -> keep A
B+ + later B observation -> keep B+
```

The classifier must not infer last race time from meeting end time or infer missing per-race rows.

Historical B/B+ route investigations may be used as fixtures, but historical research state must not be silently promoted.

## Stage ACP-7 — Collection Result Manifest

Status: current.

Goal: give every job one concise machine-readable result summary.

The result manifest should include:

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
unresolved_dates
unresolved_meeting_ids
source_errors
artifact_refs
```

The manifest is a summary, not a replacement for source-specific candidate and Coverage Observation artifacts.

## Stage ACP-8 — Review Queue

Goal: provide one operator-facing view of validated batches awaiting review.

Queue states initially:

```text
review_ready
reviewing
approved
rejected
promotion_ready
promoted
published
```

Required views:

- by system;
- by campaign;
- by runner;
- by rank distribution;
- by source error count;
- by unresolved count;
- by review state.

The queue must display all five rank counts.

A C-heavy batch and a B/B+-heavy batch must be distinguishable without opening raw candidate files.

## Stage ACP-9 — Rank-aware Retry Queue

Goal: replace generic retry target lists with structured rank-gap work.

Minimum retry fields:

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

Required retry scenarios:

```text
C -> best available
B -> B+
B+ -> A
A -> A+
selected meetings only
broad date-window retry
multi-system retry plan
```

A later successful retry may jump directly to the highest supported rank.

The queue must not retry meetings already at their effective collection target unless the reason is source revalidation or explicit completion-audit support.

## Stage ACP-10 — Actions multi-job runner

Goal: execute multiple hosted-capable jobs independently.

Implementation requirements:

1. consume Collection Plan or generated job subset;
2. filter `github_actions` jobs;
3. execute jobs independently, using matrix execution or equivalent isolation;
4. permit different date windows per job;
5. preserve independent batch IDs and artifacts;
6. preserve successful artifacts when another job fails;
7. produce one campaign summary.

Do not require all systems in a campaign to succeed before valid review-ready batches appear.

## Stage ACP-11 — local multi-job runner

Goal: allow the operator to execute all pending local jobs with one plan command.

Target interface is conceptually:

```text
run local pending plan
```

The implementation must:

1. consume the same Collection Job schema as Actions;
2. filter local jobs;
3. route each job to its source-specific adapter;
4. allow different scopes per job;
5. preserve independent batches;
6. run common validators;
7. update result manifests and queues;
8. continue to the next independent job after one bounded job failure where safe.

JRA is the first required local-runner compatibility test.

## Stage ACP-12 — review cohort planner

Goal: group review-ready batches into risk-bounded review PR proposals.

Grouping inputs may include:

```text
system/source compatibility
rank distribution
public display risk
promotion dependencies
source failure isolation
```

The planner may propose several PRs from one campaign.

It must not combine batches merely because they were collected at the same time.

## Stage ACP-13 — automatic review PR preparation

Goal: move validated data automatically to the human-review boundary.

The system may:

1. generate deterministic review summaries;
2. generate candidate diffs;
3. attach Coverage and retry summaries;
4. prepare or open bounded review PRs;
5. label them `human review required` or equivalent.

The system must not:

- approve its own candidate;
- perform human review implicitly;
- bypass Promotion Validation;
- publish unattended.

## Stage ACP-14 — due-job planner and scheduling

Goal: generate regular refresh and retry jobs from policy rather than memory.

Inputs may include:

```text
source freshness thresholds
meeting proximity
source publication horizon
season state
rank gaps
retry backoff
coverage gaps
source health
```

The planner must produce explicit Collection Jobs before execution.

Initial scheduler policy should prefer conservative bounded frequency and avoid unnecessary repeated source load.

## Stage ACP-15 — Operations v2 operator view

Goal: extend the existing Operations v1 read-only status layer into an acquisition/review operations view.

The view should summarize:

```text
planned jobs
queued jobs
running jobs
recent success/partial/failure
Review Queue
Retry Queue
rank distributions
source health
freshness
promotion state
publication state
```

Operations v1 remains historical completed scope. This stage is an additive v2 layer, not a retroactive redefinition of Operations v1.

## Banei handoff gate

Banei implementation resumes after the minimum shared foundation exists:

1. Acquisition Registry schema and initial records;
2. Collection Job schema;
3. Collection Plan schema;
4. five-rank classifier contract;
5. Review Queue foundation;
6. Rank-aware Retry Queue foundation;
7. runner-neutral batch/result semantics.

Actions matrix and full scheduler completion are not prerequisites for starting Banei.

This prevents overbuilding the control plane while still ensuring Banei enters the shared operating model from its first implementation.

## Later-system adoption gate

HKJC, UAE, KRA, Turkey, Morocco, and later systems must declare:

```text
runner profile
source/adapter profile
technical capability rank
collection target rank
public ceiling
supported collection modes
retry support
```

before becoming steady-state maintained systems.

## PR sizing guidance

The control-plane programme should be split into bounded PRs. A recommended shape is:

```text
ACP-01 docs and authority alignment
ACP-02 NAR workflow_dispatch primary path
ACP-03 Acquisition Registry schema + Japan records
ACP-04 Collection Job schema + fixtures
ACP-05 Collection Plan schema + fixtures
ACP-06 five-rank classifier contract tests
ACP-07 Result Manifest schema
ACP-08 Review Queue foundation
ACP-09 Rank-aware Retry Queue foundation
ACP-10 Actions multi-job execution
ACP-11 local multi-job execution
ACP-12 review cohort planner
ACP-13 automatic review PR preparation
ACP-14 due-job planner / scheduler foundation
ACP-15 Operations v2 view and release gate
```

Actual GitHub PR numbers do not need to match these programme labels.

## Immediate sequence from current repository state

The immediate sequence is:

```text
1. merge this documentation alignment
2. finish current NAR 82-meeting review/promotion/publication sequence
3. close temporary diagnostic PRs #430 and #435 without merge
4. formalize NAR Actions manual dispatch
5. implement Acquisition Registry
6. implement Job and Plan schemas
7. implement five-rank classifier contract tests
8. implement Review Queue and Rank-aware Retry Queue foundations
9. connect Actions and local runners to common job semantics
10. begin Banei on the shared foundation
11. expand multi-system execution
12. add automatic review PR preparation
13. add due-job scheduling and automatic bounded retries
```

## Release gates

### Foundation gate

Pass when Registry, Job, Plan, five-rank classifier, Review Queue, and Retry Queue contracts exist and JRA/NAR are representable.

### Runner gate

Pass when NAR can run through the formal Actions path and JRA can run through the shared local job path.

### Multi-system gate

Pass when one campaign can execute at least two systems with different scopes without coupling their success states.

### Review automation gate

Pass when validated jobs can be transformed into bounded review PR proposals without implying approval.

### Scheduling gate

Pass when regular refresh and rank-gap retry jobs can be generated from explicit policy and reviewed queue state.

## Non-goals during the foundation stage

Do not block the programme on:

- unattended publication;
- automatic approval;
- one universal parser;
- forcing every source into GitHub Actions;
- forcing every source into local execution;
- requiring all systems to use A+;
- requiring fixed monthly windows;
- requiring every campaign job to succeed before any batch can be reviewed.

The control plane standardizes orchestration and review state while preserving source-specific acquisition reality.
