# HKJC route-specific runner policy

Status: operational detail path activated  
Work ID: `WHR-CAL-HKJC-DETAIL-RECOVERY`  
Implementation unit: `HKJC-DETAIL-RECOVERY-01`  
Last reviewed: 2026-07-13

## Purpose

HKJC has two different evidence-backed operating routes:

```text
schedule route
  -> GitHub Actions
  -> C-level fixture/date-window acquisition

detail route
  -> reviewed_import
  -> explicit operator-only public-safe detail intake
  -> C/B/B+/A/A+ classifier
  -> public ceiling A
```

Hosted direct HTTP detail acquisition is not evidence-backed. The detail route therefore remains a human-reviewed operator path rather than an automatic fallback.

## Compatibility rule

The core compatibility rule remains:

> system-level fields remain authoritative for legacy jobs.

The system-level primary runner remains `github_actions` because existing Collection Jobs represent the schedule route. The system-level fallback remains null and pending. A generic Collection Job requesting `reviewed_import` is still rejected.

The route policy is additive and may not activate Registry fields by itself. `HKJC-DETAIL-RECOVERY-01` is a separate explicit activation decision based on the reviewed source, adapter, classifier, historical A+ reference, and manual operator workflow.

Current Registry state:

```text
primary_runner: github_actions
fallback_runner: null
fallback_runner: pending
schedule_source_id: hkjc-fixture-list
schedule_adapter_id: hkjc-fixture-artifact-bridge-v1
detail_source_id: hkjc-detail-reviewed-import
detail_adapter_id: hkjc-detail-reviewed-import-v1
supported_observation_ranks: C, B, B+, A, A+
public_ceiling: A
supports_selected_meetings: false
supports_rank_upgrade_retry: false
```

Registry detail fields are now active. Selected-meeting retry ownership is not active in this unit.

## Schedule route

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

`automatic_planning_allowed: true` allows the artifact-only Due-job Planner to prepare a schedule Job. It does not authorize execution, approval, promotion, publication, or deployment.

## Detail route

```text
route_kind: detail
status: operator_path_evidence_backed
selection_mode: operator_only
primary_runner: reviewed_import
source: hkjc-detail-reviewed-import
adapter: hkjc-detail-reviewed-import-v1
supported collection modes: date_window
evidence-backed ranks: B, A+
classifier ranks: C, B, B+, A, A+
automatic planning allowed: false
automatic execution allowed: false
human review required: true
public ceiling: A
```

The route has two accepted evidence points:

1. bounded reviewed-import B evidence for Happy Valley on 2026-07-08;
2. reviewed historical A+ reference for Happy Valley on 2026-06-10 with nine continuous races from 18:40 through 22:50.

The A+ technical reference does not change the public ceiling. HKJC public output remains capped at A, meaning race labels/numbers and post times are the public detail boundary.

## Manual operator

The operational workflow is:

```text
.github/workflows/calendar-hkjc-detail-operator.yml
```

It accepts:

- a base64-encoded `calendar-hkjc-detail-reviewed-import-v1` public-safe JSON input;
- batch ID;
- campaign ID;
- job ID.

The input must already have:

```text
review.state: reviewed_public_safe
```

The workflow:

1. validates stable IDs;
2. decodes input outside the repository;
3. validates the reviewed-import contract;
4. builds an immutable reviewed-import package;
5. extracts Candidate, Coverage Observation, Result Manifest, Collection Report, and input evidence;
6. verifies rank totals and review state;
7. rejects prohibited participant, betting, result, payout, raw-source, and stream fields;
8. uploads review artifacts;
9. proves Canonical and public state were unchanged.

Operator output remains:

```text
candidate review state: needs_review
promotion target: null
canonical write: disabled
public write: disabled
publication effect: none
```

## Operator-only meaning

The detail route is operator-only:

- a generic Collection Job cannot select it;
- a Collection Plan cannot reach it through system fallback;
- the Due-job Planner cannot select it;
- automatic execution is disabled;
- explicit reviewed public-safe input is required;
- importing reviewed input does not approve the resulting candidates;
- promotion and publication remain separate human-reviewed steps.

## Due-job Planner

The Due-job Planner continues to select only the schedule route:

```text
schedule + due_job_planner -> github_actions
```

The detail route keeps:

```text
selection_mode: operator_only
automatic_planning_allowed: false
```

Therefore automatic C-to-A retry planning remains pending for `HKJC-DETAIL-RECOVERY-02`.

## Operations supplement

The Operations supplement exposes:

- Registry primary and fallback state;
- route kind and status;
- route runner;
- selection mode;
- automatic planning/execution state;
- evidence-backed observation ranks.

It does not expose reviewed input contents, reviewer identity, raw source, internal notes, or automatic-action controls.

## Selection contexts

Allowed:

```text
schedule + collection_job          -> github_actions
schedule + due_job_planner         -> github_actions
detail + operator_reviewed_import  -> reviewed_import
detail + operations_view           -> reviewed_import status visibility
```

Rejected:

```text
detail + collection_job
detail + due_job_planner
schedule + operator_reviewed_import
detail + wrong requested runner
detail + unsupported collection mode
```

## Safety boundary

The following remain disabled:

- no automatic import;
- no automatic approval;
- no automatic promotion;
- no canonical write;
- no public write;
- no automatic publication;
- no deployment;
- no automatic execution;
- no participant, betting, result, payout, prediction, raw HTML, embedded-video, or direct-stream data.

## Completion and next unit

`HKJC-DETAIL-RECOVERY-01` is complete when:

1. detail Source and Adapter resolve through the Acquisition Registry;
2. the route policy exposes B and A+ evidence;
3. the manual workflow builds review artifacts from external reviewed public-safe input;
4. a generic detail Collection Job remains rejected;
5. Due-job Planner selection remains schedule-only;
6. Canonical and public files remain unchanged during operator execution;
7. all validators and CI checks pass.

Next:

```text
HKJC-DETAIL-RECOVERY-02
```

It will add selected-meeting ownership, C-to-higher-rank retry planning, Review Queue connection, and reviewed promotion without enabling unattended publication.
