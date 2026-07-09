# Banei Detail Adapter Contract

Status: active source-specific adapter contract  
Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Last reviewed: 2026-07-09

## Purpose

This contract defines the first Banei-specific detail adapter built on the official NAR Banei race pages.

The adapter path is:

```text
reviewed Banei schedule inventory
-> bounded date-window or selected-meeting scope
-> official NAR RaceList
-> official NAR DebaTable for every race
-> Banei-specific metadata cross-check
-> complete A+ meeting candidate
-> review-only batch and Coverage Observation
```

The adapter is deliberately separate from the NAR flat-racing collector.

Registry activation is separate from parser implementation and must wait for bounded source execution evidence.

## Official source responsibilities

### RaceList

RaceList supplies meeting-level race rows including:

```text
race number
post time
race name
straight-course distance notation such as 直200m
```

The adapter treats RaceList as the row inventory and post-time source.

### DebaTable

DebaTable supplies per-race Banei course metadata used by the adapter to verify:

```text
surface: Dirt
distance
course shape: straight
```

The accepted Banei detail pattern is equivalent to:

```text
ダート 200m（直）
```

The adapter does not infer this metadata from racecourse identity alone.

## A+ completeness rule

A+ requires every race row to satisfy all of the following:

```text
continuous race numbers from Race 1
post time present
race name present
RaceList straight-course distance present
DebaTable metadata present for the same race number
RaceList and DebaTable distance match
DebaTable surface parsed as Dirt
DebaTable course shape parsed as straight
```

Only after all rows pass does the adapter emit one meeting record at:

```text
capability_rank: A+
```

If one race is missing detail metadata, the meeting is blocked rather than partially labeled A+.

If RaceList and DebaTable disagree on distance, the meeting is blocked.

## Banei-specific course semantics

The first reviewed public-safe mapping is:

```text
surface: Dirt
course_label: Banei Straight Course
```

`Banei Straight Course` is emitted only after DebaTable confirms the straight Banei course pattern.

There is no flat-racing matrix fallback.

The adapter does not reuse NAR flat-racing assumptions for:

```text
left/right direction
inner/outer course
flat dirt-course labels
flat turf-course labels
racecourse matrix surface fallback
racecourse matrix direction fallback
```

## Scope model

The bounded collector supports two explicit scope modes.

### date-window

The operator supplies:

```text
start_date
end_date_exclusive
```

Only meetings already present in the reviewed Banei schedule inventory and falling inside the window are detail targets.

The collector does not probe every calendar date blindly.

### selected-meeting

The operator supplies one or more stable meeting IDs.

Every selected ID must already exist in the input schedule inventory.

Unknown meeting IDs fail closed.

This supports future retry-oriented execution without yet claiming that the Acquisition Registry has activated automatic rank-upgrade retry.

## Schedule inventory dependency

The detail collector consumes either:

```text
banei-full-month-candidate-set-v1
or
banei-control-plane-bridge-fixture-v1
```

The full-month schedule inventory remains responsible for meeting identity and official meeting-date coverage.

The detail adapter is responsible for A+ row completeness on selected meeting targets.

## Candidate model

A complete meeting becomes one shared `timetable-candidate-v1` record.

The record contains only:

```text
meeting identity
racecourse identity
date and timezone
A+ capability rank
first and last race times
public-safe timetable rows
source identity and official RaceList URL
review status
```

Each timetable row contains:

```text
label
post_time_local
race_name
distance_m
surface
course_label
```

The adapter does not retain participant-level table content from DebaTable.

## Human review boundary

Every generated candidate remains:

```text
review_status: needs_review
```

and the batch envelope remains:

```text
review.status: needs_review
promotion_target: null
```

The detail adapter performs acquisition and normalization only.

It does not approve, promote, write canonical data, write public projection data, publish, or deploy.

Human review and Promotion Validation remain separate requirements.

## Coverage model

The bounded collector emits `calendar-coverage-observation-v1`.

For each requested scope it reports:

```text
records_discovered
records_updated
unresolved_dates
unresolved_meeting_ids
source_errors
coverage_claim
```

A source or parser blocker creates an unresolved meeting ID and a bounded source error.

When every targeted meeting completes A+ parsing:

```text
coverage_claim: source_window_complete
```

When any targeted meeting is blocked:

```text
coverage_claim: partial
```

This is ordinary batch coverage, not July Completion Audit certification.

## Collector output boundary

The collector writes:

```text
candidate.json
coverage-observation.json
collection-report.json
```

The collection report remains:

```text
candidate_mode: review_only
promotion_eligible_candidates: 0
publication_effect: none
canonical_write: disabled
public_write: disabled
raw_source_storage: disabled
```

No raw RaceList or DebaTable HTML is stored.

## Source-load boundary

The collector:

1. fetches one RaceList page per targeted meeting;
2. discovers and validates continuous race numbers;
3. fetches one DebaTable page per discovered race row;
4. applies a configurable bounded delay between detail requests;
5. stops A+ completion for a meeting when a required detail page fails or cannot be parsed.

The operator scope therefore controls source load explicitly.

## Parser validation

Permanent CI uses minimal synthetic markup to validate parser semantics without depending on live source availability.

The fixture proves:

```text
2 continuous RaceList rows
2 post times
2 race names
2 straight 200m row observations
DebaTable Dirt / 200m / straight metadata
complete two-row A+ candidate
```

Negative tests prove rejection of:

```text
non-continuous race numbers
non-Dirt detail pattern
non-straight detail pattern
missing per-race detail metadata
RaceList/DebaTable distance mismatch
```

## Live source validation

Live source validation is a separate manual smoke-test boundary.

It may test a bounded known meeting date such as one reviewed July 2026 meeting, but live network availability is not made a mandatory pull-request CI dependency.

A live smoke test may establish evidence for a later Registry activation PR.

Registry activation is separate because parser correctness alone does not prove stable runner behavior.

## Registry activation boundary

This adapter PR does not change the active Banei Registry profile.

The Registry remains provisional until bounded live execution proves:

```text
detail source identity
adapter output on official pages
runner behavior
source-error behavior
bounded date-window behavior
selected-meeting behavior
output safety
```

A later Registry activation may then declare:

```text
detail_source_id: nar-banei-race-list-deba-table
detail_adapter_id: banei-nar-race-list-detail-v1
supported observation ranks including A+
supported bounded scope modes supported by execution proof
```

Rank-upgrade retry must remain separate until runner and retry execution semantics are also validated.

## Public data boundary

The adapter must not retain or publish:

- horse names;
- jockey names;
- trainer names;
- owners or breeders;
- draw or gate positions;
- weights;
- odds;
- popularity or betting rank;
- results;
- payouts;
- predictions;
- tips;
- raw HTML;
- source bodies;
- credentials, cookies, secrets, or tokens;
- direct stream URLs.

The adapter reads official pages that contain more information than the public Calendar needs. It extracts only the public-safe programme summary fields required for A+.

## Completion boundary

The Banei detail adapter stage is complete when:

- official RaceList URL generation is deterministic;
- official DebaTable URL generation is deterministic;
- RaceList parser extracts continuous race numbers, post times, race names, and straight-course distance;
- DebaTable parser extracts Dirt, distance, and straight-course evidence;
- A+ requires complete metadata for every race row;
- distance mismatch is rejected;
- `Banei Straight Course` is based on official detail evidence;
- date-window and selected-meeting scopes are explicit;
- no flat-racing matrix fallback exists;
- candidates remain review-only;
- Coverage Observation records blockers honestly;
- no raw source storage or publication side effect occurs;
- Registry activation remains a later evidence-based step.

## Next handoff

After parser and bounded collector validation, run a bounded manual live source smoke test.

If the live run proves stable official-source behavior, the next PR should:

1. register the Banei detail source and adapter;
2. choose the runner from execution evidence;
3. update supported observation ranks;
4. connect complete A+ detail batches to Result Manifest and Review Queue;
5. only then consider selected-meeting Retry Queue activation.
