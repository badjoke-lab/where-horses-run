# Calendar review PR preparation contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

ACP-13 moves validated Review Cohort data to a deterministic human-review package boundary.

The core rule is:

```text
preparation is not PR creation
```

A review PR package may contain a proposed branch name, title, labels, body, checklist, candidate diff summary, Coverage summary, retry summary, rank distribution, and artifact references.

It does not create a Pull Request, approve a candidate, run Promotion Validation, promote canonical data, publish public data, or deploy the site.

## Canonical artifacts

```text
data/static/calendar-review-pr-package.schema.json
data/fixtures/calendar-review-pr-preparation-fixtures-v1.json
data/fixtures/calendar-review-pr-preparation-invalid-cases-v1.json
scripts/timetable/review-pr-preparation.mjs
scripts/timetable/prepare-calendar-review-pr-packages.mjs
scripts/check-calendar-review-pr-preparation.mjs
.github/workflows/calendar-review-pr-preparation.yml
```

## Input model

The preparation layer consumes:

```text
validated Review Cohort Plan
validated Review Queue
Acquisition Registry
batch artifact catalog
canonical meeting rank snapshot
Rank-aware Retry Queue
```

The artifact catalog maps each cohort batch to:

```text
Manifest reference
candidate reference
Coverage Observation reference
collection report reference
candidate meeting IDs and observed ranks
```

The preparation layer does not require raw source HTML or participant-level data.

## Package identity

One Review Cohort produces one deterministic package.

The package retains:

```text
package_id
cohort_id
system_id
cohort_kind
public_display_risk
promotion_dependency
C/B/B+/A/A+ rank counts
candidate diff summary
Coverage summary
retry summary
batch artifact references
review checklist
proposed PR metadata
side-effect boundaries
```

Package count must equal Review Cohort count.

## Candidate diff summary

The candidate diff summary compares candidate observed rank to the current canonical meeting rank.

Initial buckets are:

```text
new_count
upgrade_count
unchanged_count
lower_observation_count
```

The package also preserves deterministic transition counts such as:

```text
NEW -> C
C -> A+
A -> A+
A+ -> A+
```

A lower observation is visible in the review package but does not automatically downgrade canonical state.

The diff summary must close exactly:

```text
candidate_count
=
new_count
+ upgrade_count
+ unchanged_count
+ lower_observation_count
```

Candidate count must also equal the cohort five-rank total.

## Coverage summary

Every package contains a Coverage summary with:

```text
batch count
none count
partial count
source_window_complete count
audited_complete count
unresolved date count
unresolved meeting count
source error count
```

Coverage counts must close to the cohort batch count.

The package does not convert partial coverage into completeness and does not treat source failure as an empty successful batch.

## Retry summary

The retry summary joins candidate meeting identities to the Rank-aware Retry Queue within the same system.

It contains:

```text
matched retry count
due now count
deferred count
counts by retry reason
```

The summary is observational. It does not execute a retry and does not enable scheduling.

A retry may remain visible while the corresponding candidate batch is under human review.

## Public Ceiling review

When the Review Cohort promotion dependency is:

```text
public_ceiling_projection_required
```

The package checklist must explicitly require Public Ceiling projection review.

Technical observation rank remains visible in the review package.

Example:

```text
observed rank: A+
public ceiling: A
review risk: programme_summary
promotion dependency: public_ceiling_projection_required
```

The package does not silently rewrite A+ to A and does not authorize publication of A+ fields above the active ceiling.

## Proposed PR metadata

Each package prepares:

```text
branch_name
title
labels
body_markdown
review_state
```

Required label:

```text
human review required
```

Required state:

```text
pending_human_review
```

The body must visibly contain the human review boundary and summarize:

```text
cohort identity
system
review kind
public display risk
promotion dependency
batch count
candidate diff counts
Coverage gaps
source errors
retry counts
```

## Checklist boundary

Every package includes at least these review requirements:

1. verify candidate diff summary against candidate artifacts;
2. verify five-rank distribution and public display risk;
3. verify Coverage and unresolved counts;
4. verify retry summary and monotonic rank rules;
5. run Promotion Validation separately after human approval.

Additional cohort-specific checks are added for:

```text
coverage_review
source_failure_review
public_ceiling_projection_required
```

## Side-effect boundary

Every package must record:

```text
pull_request_created: false
candidate_approved: false
promotion_performed: false
canonical_write_performed: false
public_write_performed: false
publication_performed: false
deployment_performed: false
```

The preparation workflow uses:

```text
permissions:
  contents: read
```

It must not request:

```text
pull-requests: write
contents: write
```

The workflow uploads the prepared package only as a workflow artifact.

## Workflow model

The formal workflow has two modes.

### Pull request / push validation

Repository changes affecting the contract run:

```text
schema/core syntax checks
review PR preparation checker
Review Cohort Planner dependency checker
Review Queue dependency checker
Retry Queue dependency checker
Calendar contracts/governance
runtime import boundary
diff formatting
```

### Manual package preparation

`workflow_dispatch` runs the deterministic CLI against the review-preparation fixture or an explicitly wired bounded input set and uploads the JSON package artifact.

The workflow step is named:

```text
Prepare deterministic review PR package
```

The artifact remains review material. No Pull Request is opened by this workflow.

## CLI model

Fixture mode:

```text
node scripts/timetable/prepare-calendar-review-pr-packages.mjs \
  --fixture=data/fixtures/calendar-review-pr-preparation-fixtures-v1.json \
  --output=.calendar-review-pr-packages.json
```

Explicit input mode:

```text
node scripts/timetable/prepare-calendar-review-pr-packages.mjs \
  --review-queue=<queue.json> \
  --artifact-catalog=<catalog.json> \
  --canonical-meetings=<meetings.json> \
  --retry-queue=<retry-queue.json> \
  --output=<packages.json>
```

The CLI first plans Review Cohorts, then prepares one package per cohort.

## Invalid combinations rejected

Validation rejects at least:

- candidate diff count drift;
- Coverage batch count drift;
- retry count drift;
- Manifest reference drift;
- unsafe candidate references;
- missing human review label;
- review state changed to approved;
- PR body without human review marker;
- `pull_request_created=true`;
- `candidate_approved=true`;
- `promotion_performed=true`;
- system identity drift.

## Safety boundary

Review PR packages contain public-safe summary metadata and repository artifact references only.

They must not contain:

- raw source bodies or HTML;
- credentials, cookies, tokens, or secrets;
- horse names;
- jockey names;
- trainer names;
- draw or gate positions;
- weights;
- odds;
- betting rank;
- results;
- payouts;
- predictions;
- tips;
- direct stream URLs.

A+ remains a lightweight programme summary boundary, not a full racecard.

## ACP-13 completion boundary

ACP-13 is complete when:

- one deterministic package is prepared per validated Review Cohort;
- candidate diff summary closes against rank counts;
- Coverage summary closes against cohort batches;
- retry summary is attached by meeting identity;
- Public Ceiling dependencies create explicit checklist requirements;
- proposed branch/title/body/label are deterministic;
- every package remains `pending_human_review`;
- `human review required` remains mandatory;
- no PR creation permission is granted;
- approval, promotion, publication, and deployment remain disabled.

## Next handoff

After ACP-13, ACP-14 due-job planner and scheduling becomes current.

The next planner generates explicit Collection Jobs from freshness, meeting proximity, source horizon, season state, rank gaps, retry backoff, coverage gaps, and source health before any execution occurs.

Scheduling remains conservative and must not imply unattended publication.
