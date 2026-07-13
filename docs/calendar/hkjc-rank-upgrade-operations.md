# HKJC rank-upgrade operations

Status: manual reviewed operations  
Work ID: `WHR-CAL-HKJC-DETAIL-RECOVERY`  
Implementation unit: `HKJC-DETAIL-RECOVERY-02`  
Last reviewed: 2026-07-13

## Purpose

This unit connects an existing HKJC C/B/B+/A meeting to the operator-reviewed detail route without changing the system-level schedule runner.

```text
canonical C/B/B+/A meeting
-> explicit selected-meeting Retry Queue
-> reviewed public-safe HKJC detail input
-> Candidate + Coverage + Manifest
-> Review Queue
-> human review
-> SHA-bound approval
-> Canonical promotion proposal
-> human merge required
```

The schedule route remains:

```text
GitHub Actions
hkjc-fixture-list
hkjc-fixture-artifact-bridge-v1
C-level date-window acquisition
```

The detail route remains:

```text
reviewed_import
operator_only
hkjc-detail-reviewed-import
hkjc-detail-reviewed-import-v1
```

## Calendar Readiness

The detail route has a separate Readiness record:

```text
hong-kong/hkjc/hkjc-detail-reviewed-import
```

Reviewed boundary:

- Technical Rank: A+;
- Public Ceiling: A;
- mode: manual import;
- two racecourses: Happy Valley and Sha Tin;
- post times and programme-summary fields may be validated;
- public output remains race label/number plus post time;
- participant, betting, result, payout, prediction, raw-source, video, and stream data remain prohibited.

## Phase 1 — prepare a rank-upgrade review

Workflow:

```text
Calendar HKJC rank-upgrade review
```

Inputs:

- comma-separated canonical HKJC meeting IDs;
- Base64-encoded `calendar-hkjc-detail-reviewed-import-v1` JSON;
- batch ID;
- campaign ID;
- job ID.

Every selected meeting must:

- already exist in Canonical;
- belong to HKJC;
- use `Asia/Hong_Kong`;
- be below Technical Rank A+;
- exactly match one candidate meeting in the reviewed detail input.

The workflow produces:

- `rank-aware-retry-queue.json`;
- `review-queue.json`;
- `candidates.json`;
- `collection-result-manifest.json`;
- immutable reviewed-import package and summaries.

Retry entries use:

```text
retry_scope: selected_meetings
primary_runner: reviewed_import
fallback_runner: null
adapter_id: hkjc-detail-reviewed-import-v1
collection_target_rank: best_available
```

This is a route-specific operator Retry Queue. It does not claim that the system-level GitHub Actions schedule runner can fetch HKJC detail.

## Review Queue state

A successful Phase 1 run creates:

```text
review_state: review_ready
promotion_state: not_ready
```

This means:

- the artifacts are structurally ready for a person to review;
- no approval has occurred;
- no promotion target is assigned to the candidate;
- Canonical and public data remain unchanged.

## Approval artifact

After reviewing the Phase 1 artifact, create a JSON approval:

```json
{
  "schema_version": "calendar-hkjc-detail-promotion-approval-v1",
  "batch_id": "hkjc-example-batch",
  "decision": "approved",
  "reviewer": "reviewer-name",
  "reviewed_at": "2026-07-13T05:00:00Z",
  "candidate_sha256": "64-lowercase-hex",
  "manifest_sha256": "64-lowercase-hex"
}
```

The two digests are calculated from the exact pretty-printed JSON with a trailing newline used by the operator artifacts.

Any changed candidate or manifest after approval fails closed.

Approval additionally requires:

- no unresolved dates;
- no unresolved meetings;
- no source errors;
- complete reviewed coverage;
- at least one A or A+ result.

## Phase 2 — prepare Canonical promotion proposal

Workflow:

```text
Calendar HKJC promotion proposal
```

Inputs:

- Base64 candidate JSON from Phase 1;
- Base64 manifest JSON from Phase 1;
- Base64 approval JSON.

The workflow validates exact SHA-256 bindings and creates:

- approved candidate;
- proposed Canonical meetings;
- proposed Canonical meeting details;
- promotion summary;
- promotion proposal with exact output digests.

It does not write the repository.

The proposal remains:

```text
repository_write: false
canonical_write: false
public_write: false
publication_effect: none
human_merge_required: true
```

## Applying the proposal

Do not copy only one proposed Canonical file.

A later reviewed PR must include together:

1. approved candidate under the intended `data/candidates/` path;
2. proposed Canonical meetings;
3. proposed Canonical meeting details;
4. promotion proposal and approval evidence;
5. regenerated public projection;
6. bilingual rendered verification.

The normal Pipeline v1 promotion and release gates must pass before merge.

## Failure handling

A meeting remains at its existing reviewed rank when:

- no reviewed detail input exists;
- candidate IDs do not exactly match selected meeting IDs;
- detail coverage is partial or unresolved;
- source errors remain;
- the approval digest is stale;
- an unapproved field is present;
- the proposal fails Pipeline v1 validation.

Failure does not delete or downgrade the existing C/B/B+/A meeting.

## Automation boundary

Disabled:

- automatic selection by Due-job Planner;
- automatic HKJC detail HTTP fetch;
- automatic approval;
- automatic promotion;
- direct Canonical write;
- public write;
- automatic publication;
- deployment.

Enabled:

- explicit operator selection;
- deterministic Retry Queue generation;
- reviewed-import Candidate generation;
- Review Queue generation;
- SHA-bound approval validation;
- read-only Canonical promotion proposal generation.

## Completion condition

`HKJC-DETAIL-RECOVERY-02` is complete when:

1. HKJC detail Readiness resolves;
2. selected canonical meetings produce route-specific Retry Queue entries;
3. selected IDs exactly match reviewed Candidate IDs;
4. a reviewed package produces a Review Queue entry;
5. stale approvals fail closed;
6. approved A/A+ evidence produces a valid Canonical promotion proposal;
7. all operations remain repository-read-only until a human-reviewed PR is merged.
