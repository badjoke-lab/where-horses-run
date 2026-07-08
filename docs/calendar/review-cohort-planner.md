# Calendar Review Cohort Planner contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The Review Cohort Planner converts one validated Review Queue snapshot into deterministic, risk-bounded review proposals.

The planner exists because acquisition timing and review compatibility are different concerns.

The central rule is:

```text
collection time is not a grouping key
```

One campaign may produce several review proposals, while compatible review-ready batches from different campaigns may share one cohort.

The planner does not approve, promote, publish, or deploy data.

## Canonical artifacts

```text
data/static/calendar-review-cohort-plan.schema.json
data/fixtures/calendar-review-cohort-planner-fixtures-v1.json
data/fixtures/calendar-review-cohort-planner-invalid-cases-v1.json
scripts/timetable/review-cohort-planner.mjs
scripts/check-calendar-review-cohort-planner.mjs
.github/workflows/calendar-review-cohort-planner.yml
```

## Input boundary

The planner consumes:

```text
Calendar Review Queue v1
+
Calendar Acquisition Registry v1
```

The Review Queue supplies batch identity, requested scope, coverage claim, five-rank distribution, unresolved counts, source-error count, review state, promotion state, and Manifest reference.

The Acquisition Registry supplies system/source compatibility and the active public ceiling.

The planner does not read candidate bodies in order to decide cohort grouping.

## Eligibility

Only entries with:

```text
review_state: review_ready
promotion_state: not_ready
```

enter cohort grouping.

Other states are accounted for explicitly:

```text
reviewing -> already_reviewing
approved or promotion progress -> already_reviewed_or_promoted
rejected -> rejected
```

Every Review Queue entry must be accounted for exactly once as either:

```text
one cohort batch
or
one excluded entry
```

## Grouping factors

The deterministic grouping key contains:

```text
system/source compatibility
cohort kind
public display risk
promotion dependency
```

The source-compatible portion is derived from the Acquisition Registry:

```text
system_id
schedule_source_id
detail_source_id
```

The planner does not combine batches merely because they were collected together or share one campaign ID.

## Cohort kinds

Initial cohort kinds are:

```text
candidate_review
coverage_review
source_failure_review
```

### Candidate review

A clean review-ready batch with no source failure and no unresolved coverage dependency enters a candidate-review cohort.

### Coverage review

A review-ready batch with partial coverage or unresolved dates/meeting IDs enters a coverage-review cohort.

The batch may still contain valid candidate records. The cohort boundary ensures that unresolved coverage remains visible during review.

### Source failure review

A batch with source errors or `coverage_claim=none` enters a source-failure-review cohort.

Source failure isolation is mandatory. A source-failure batch is not mixed into a clean candidate-review cohort merely because system or campaign identity matches.

## Public display risk

The planner maps the highest observed rank in each batch to the corresponding public display risk class:

```text
C      -> meeting_only
B / B+ -> time_summary
A      -> race_timetable
A+     -> programme_summary
no observed records -> none
```

This is a review-risk classification, not permission to display fields outside the existing public display boundary.

`programme_summary` means the bounded A+ summary layer only. It does not mean a full racecard, runner list, odds page, result page, or betting product.

Different public display risk classes are not merged into one review cohort.

## Promotion dependencies

Initial promotion dependencies are:

```text
promotion_validation_required
coverage_review_required
source_recovery_required
public_ceiling_projection_required
```

Rules:

1. source errors or no observation require source recovery;
2. an observed rank above the active public ceiling requires Public Ceiling projection review;
3. partial or unresolved coverage requires coverage review;
4. otherwise Promotion Validation remains the next explicit gate.

The planner does not perform any of those gates.

## Public Ceiling behavior

Technical observation rank and public ceiling remain separate.

Example:

```text
observed: A+
public ceiling: A
```

The review risk remains `programme_summary`, because that is the observed technical content under review.

The promotion dependency becomes:

```text
public_ceiling_projection_required
```

The planner must not silently relabel the technical observation as A and must not publish A+ fields above the ceiling.

## Cross-campaign grouping

Compatible batches may share one cohort even when campaign IDs differ.

Example:

```text
JRA campaign A -> A+ clean batch
JRA campaign B -> A+ clean batch
```

When source route, cohort kind, public display risk, and promotion dependency match, the planner may propose one bounded review cohort.

Campaign identity remains visible on every batch reference.

## Same-campaign splitting

One campaign may produce several review proposals.

Example:

```text
NAR campaign X
├─ C-only clean schedule batch
└─ C + A+ batch with unresolved detail identities
```

These batches have different public display risk and coverage dependency and therefore belong to different cohorts.

Campaign timing does not override review risk.

## Cohort aggregate fields

Every cohort preserves:

```text
cohort identity
cohort kind
system identity
authority identity
schedule source identity
detail source identity
public ceiling
public display risk
promotion dependency
batch count
C/B/B+/A/A+ aggregate counts
unresolved date count
unresolved meeting count
source error count
batch references
review proposal metadata
```

Aggregate counts must equal the exact sum of cohort batch references.

A batch ID may appear only once across cohorts and exclusions.

## Review proposal boundary

Each cohort includes bounded proposal metadata:

```text
title
review_label: human review required
human_review_required: true
automatic_approval: false
automatic_promotion: false
```

The proposal is deterministic planning metadata. It is not an approved PR body and does not create a Pull Request.

ACP-13 may prepare or open review PRs from validated cohorts, but the automation stop point remains:

```text
human review required
```

## Invalid combinations rejected

Validation rejects at least:

- source identity drift from Registry;
- public ceiling drift;
- public display risk drift;
- promotion dependency drift;
- rank aggregate mismatch;
- unresolved/source-error aggregate mismatch;
- batch count mismatch;
- duplicate batch accounting;
- missing batch accounting;
- unsafe Manifest references;
- incorrect exclusion reason;
- automatic approval enabled;
- automatic promotion enabled.

## Safety boundary

Review Cohort Plans contain batch-level summary metadata only.

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

The planner has no canonical-write, public-write, publication, deployment, or scheduler side effects.

## ACP-12 completion boundary

ACP-12 is complete when:

- Review Queue entries are fully accounted for;
- only review-ready/not-ready entries enter cohort grouping;
- grouping uses Registry source compatibility;
- rank distribution and public display risk remain visible;
- coverage dependencies remain visible;
- source failures remain isolated;
- compatible batches may group across campaigns;
- incompatible batches split inside one campaign;
- every proposal requires human review;
- automatic approval and promotion remain disabled.

## Next handoff

After ACP-12, ACP-13 automatic review PR preparation becomes current.

ACP-13 may generate deterministic review summaries, candidate diffs, Coverage summaries, rank distributions, retry summaries, and bounded PR proposals from validated cohorts.

PR creation does not equal approval. Promotion and publication remain governed by explicit human review, Promotion Validation, and release gates.
