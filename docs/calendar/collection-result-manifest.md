# Calendar Collection Result Manifest contract

Status: active canonical contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The Collection Result Manifest provides one compact, machine-readable summary for one Collection Job result.

The rule is one manifest per Collection Job result. A Collection Plan may therefore produce several manifests, each with independent runner, scope, coverage, rank distribution, unresolved state, source errors, and artifact references.

The manifest does not replace the candidate batch or Coverage Observation. It is an operator-facing and queue-ready summary that cross-checks against both.

## Canonical artifacts

```text
data/static/calendar-collection-result-manifest.schema.json
data/fixtures/calendar-collection-result-manifests-v1.json
data/fixtures/calendar-collection-result-manifest-invalid-cases-v1.json
scripts/timetable/collection-result-manifest-validation.mjs
scripts/check-calendar-collection-result-manifest.mjs
.github/workflows/calendar-collection-result-manifest.yml
```

## Required fields

```text
schema_version
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
rank_counts
unresolved_dates
unresolved_meeting_ids
source_errors
artifact_refs
```

## Identity and runner boundary

`campaign_id`, `job_id`, and `system_id` must match the source Collection Job.

`runner_used` records the runner that actually executed the Job:

```text
github_actions
local
reviewed_import
```

The validator cross-checks `runner_used` against the Collection Job runner policy and Acquisition Registry profile.

- `exact` requires the exact Job runner;
- `registry_primary` requires the Registry primary runner;
- `registry_primary_or_fallback` permits only the Registry primary or declared fallback runner.

A fallback run does not create a different manifest model.

## Scope boundary

`requested_scope` must equal the Collection Job requested scope.

`observed_scope` comes from Coverage Observation and may be:

```text
date_window
single_date
selected_meetings
source_visible_horizon
not_observed
```

The manifest cross-checks normalized requested scope and exact observed scope against the matching Coverage Observation.

## Five-rank accounting

Every manifest preserves all five operational ranks:

```text
C
B
B+
A
A+
```

The sum of the five rank counts must equal `records_discovered`.

A source-specific batch may contain only a subset of those ranks. For example, the current NAR source behavior may yield C and A+ while the shared contract still preserves B, B+, and A as first-class states.

Rank counts summarize observed records. They do not authorize promotion and do not replace reviewed rank state.

## Coverage and unresolved state

The manifest carries the Coverage Observation summary fields:

```text
coverage_claim
records_discovered
records_updated
unresolved_dates
unresolved_meeting_ids
source_errors
```

These values must match the corresponding Coverage Observation exactly.

Coverage claims remain:

```text
none
partial
source_window_complete
audited_complete
```

`partial` is valid. `source_window_complete` may still coexist with detail-layer retry targets when the claimed source window is complete for the observed layer. `audited_complete` cannot contain unresolved dates, unresolved meeting IDs, or source errors.

## Artifact references

Each manifest contains closed artifact references:

```text
candidate_ref
coverage_observation_ref
collection_report_ref
```

`coverage_observation_ref` is required. `candidate_ref` and `collection_report_ref` may be null when a bounded run fails before producing those artifacts.

Repository references must stay under `data/` or `docs/` and must not use parent traversal.

## Independence rule

One Collection Plan may produce:

```text
job A -> success manifest
job B -> partial manifest
job C -> source-error manifest
```

The source error in Job C must not rewrite Job A or Job B result state.

The manifest is batch-specific and independently reviewable. Campaign grouping does not imply one review cohort or one promotion transaction.

## Safety boundary

Collection Result Manifests contain summary metadata only.

They must not contain:

- source bodies or raw HTML;
- credentials, cookies, tokens, or secrets;
- participant, horse, jockey, trainer, betting, odds, payout, prediction, or tip data;
- direct stream URLs;
- approval, publication, or deployment side effects.

The manifest may describe collected result counts and source errors, but it is not an approval or publication record.

## Queue handoff

The Collection Result Manifest is the input summary layer for the Review Queue and Rank-aware Retry Queue.

The Review Queue may derive operator-facing counts and state from validated manifests, but it must preserve manifest identity, source scope, five-rank distribution, unresolved counts, and source-error counts.

The Retry Queue may derive rank-gap work from reviewed state plus current manifest observations. It must not infer downgrade or deletion from a lower-detail observation.
