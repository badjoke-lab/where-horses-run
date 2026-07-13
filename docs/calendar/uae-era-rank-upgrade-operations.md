# UAE ERA rank-upgrade operations

Status: manual reviewed operations  
Work ID: `WHR-CAL-UAE-ERA-DETAIL-RECOVERY`  
Implementation unit: `UAE-DETAIL-RECOVERY-02`  
Last reviewed: 2026-07-13

## Operating model

UAE uses one GitHub Actions executor with two explicit modes:

```text
source_visible_horizon
  -> ERA season-calendar PDF
  -> C meeting date and racecourse

selected_meetings
  -> official ERA racecard pages
  -> complete Race 1-N post times
  -> A candidate
```

The detail route is not inferred before ERA publishes the racecard. A selected meeting remains C when official detail is unavailable or incomplete.

## Phase 1 — collect a review package

Workflow:

```text
Calendar UAE ERA rank-upgrade operator
```

Inputs:

- comma-separated existing Canonical UAE meeting IDs;
- stable batch ID;
- campaign ID;
- job ID.

The workflow compiles a standard Collection Job:

```text
system: uae-national-racing-system
runner: github_actions
collection_mode: selected_meetings
rank_strategy: target_rank
target_rank: A
reason: rank_upgrade_retry
```

For every selected meeting it:

1. resolves the existing Canonical date and racecourse;
2. fetches official `https://emiratesracing.com/racecard/{date}/{race}/declarations` pages;
3. discovers the continuous Race 1-N range;
4. extracts post times in memory;
5. emits public-safe A rows containing race label and post time only;
6. builds Candidate, Coverage Observation, Result Manifest, Collection Report, Retry Queue, and Review Queue;
7. uploads the review artifact;
8. proves Canonical and public files were unchanged.

## Review package

Expected files:

- `candidates.json`;
- `coverage-observation.json`;
- `collection-result-manifest.json`;
- `collection-report.json`;
- `rank-aware-retry-queue.json`;
- `review-queue.json`.

Successful selected-meeting coverage is:

```text
candidate rank: A
review state: needs_review
Review Queue: review_ready
promotion state: not_ready
promotion target: null
```

The selected meeting IDs must exactly match Candidate meeting IDs.

## Failure behavior

The existing reviewed C meeting remains unchanged when:

- ERA has not published a racecard;
- Race 1-N cannot be discovered continuously;
- a post time is missing;
- racecourse or date differs from Canonical;
- the official hostname changes;
- source errors remain;
- selected and Candidate meeting IDs differ.

Failure does not delete or downgrade the C schedule record.

## Phase 2 — prepare a promotion proposal

After human review, create:

```json
{
  "schema_version": "calendar-uae-era-promotion-approval-v1",
  "batch_id": "uae-example-batch",
  "decision": "approved",
  "reviewer": "reviewer-name",
  "reviewed_at": "2026-07-13T07:00:00Z",
  "candidate_sha256": "64-lowercase-hex",
  "manifest_sha256": "64-lowercase-hex"
}
```

Workflow:

```text
Calendar UAE ERA promotion proposal
```

It accepts Base64-encoded Candidate, Manifest, and Approval files. Exact SHA-256 matching is required. It then uses Pipeline v1 to produce:

- approved Candidate;
- proposed Canonical meetings;
- proposed Canonical meeting details;
- promotion summary;
- promotion proposal with exact output digests.

The workflow remains read-only:

```text
repository_write: false
canonical_write: false
public_write: false
publication_effect: none
human_merge_required: true
```

## Public boundary

UAE Technical Rank and Public Ceiling are both A.

Public meeting detail may contain:

- Race label or number;
- post time.

It does not contain:

- horse, jockey, trainer, draw, weight, or entries;
- odds, betting, result, or payout data;
- predictions or tips;
- raw HTML or source bodies;
- embedded video or direct stream URLs.

## Operational proof

The reference proof is:

```text
meeting: era-al-ain-racecourse-2026-04-10
starting Canonical rank: C
observed rank: A
races: 10
first race: 17:00
last race: 21:30
source errors: 0
```

## Remaining boundary

This unit does not enable:

- scheduled execution;
- automatic approval;
- automatic Canonical write;
- automatic public projection;
- unattended publication;
- deployment.

A separate reviewed PR must apply an approved proposal and regenerate the public projection.
