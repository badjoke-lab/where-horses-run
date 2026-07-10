# HKJC artifact-only timetable detail core

Status: HKJC-PILOT-05 foundation implementation  
Work ID: `WHR-CAL-HONG-KONG-HKJC`  
Implementation unit: `HKJC-PILOT-05`  
Last reviewed: 2026-07-10

## Purpose

This unit migrates only public-safe timetable parsing and rank-classification concepts from the quarantined historical HKJC racecard path into a review-first artifact-only path.

The historical direct chain remains prohibited:

```text
fetch
-> normalize
-> canonical write
-> public write
```

The new boundary is:

```text
explicit bounded meeting scope
+
official racecard pages held in memory by the collector
-> public-safe field extraction
-> C / B / B+ / A / A+ classification
-> timetable-candidate-v1
-> Coverage Observation
-> Collection Result Manifest
-> review-only collection report
-> HUMAN REVIEW REQUIRED
```

Canonical and public writes remain disabled.

## Allowed fields

The detail core may extract only:

- race number or `Race N` label;
- post time;
- race name;
- distance in metres;
- surface;
- course label;
- official source URL;
- source check timestamp.

It does not retain or expose horses, jockeys, trainers, draws, gates, posts, saddlecloth numbers, weights, odds, betting popularity, results, payouts, predictions, tips, raw HTML, source bodies, embedded video, or direct stream URLs.

Input page bodies are parser inputs only. Artifact output contains parsed public-safe fields and bounded error summaries, not source bodies.

## Rank classification

The shared model remains:

```text
C < B < B+ < A < A+
```

### C

Meeting identity only. No race times or timetable rows are exposed from the detail observation.

### B

Race 1 post time is observed, but complete-meeting evidence is not available.

Output contains first race time only and no timetable rows.

### B+

The meeting is explicitly observed as complete and verified first and last post times are available, but complete continuous race-row timing is not available.

Output contains first and last time and no timetable rows.

### A

The meeting is explicitly observed as complete and race post times are continuous from Race 1 through the observed complete meeting.

Rows contain only:

```text
label
post_time_local
```

Partial A+ metadata is stripped from A output.

### A+

A+ requires complete-meeting evidence, continuous post times from Race 1, and every displayed row to include post time, race name, distance, and surface or course label.

Only the programme-summary fields allowed by the publication boundary may appear.

## Completion evidence rule

Contiguous fetched pages alone do not prove a complete meeting. The core requires explicit caller-supplied `meeting_complete` evidence. Until the collector observes an end-of-meeting stop condition, two or more race pages do not silently raise a meeting to A or A+.

This is intentionally fail closed.

## Artifact set

`buildHkjcDetailArtifacts` emits:

1. `timetable-candidate-v1`;
2. `calendar-coverage-observation-v1`;
3. `calendar-collection-result-manifest-v1`;
4. `calendar-hkjc-detail-artifact-report-v1`.

Every candidate remains `needs_review` with no promotion target.

The collection report records:

```text
candidate_mode: review_only
publication_effect: none
raw_source_storage: disabled
canonical_write: disabled
public_write: disabled
automatic_approval: false
automatic_promotion: false
automatic_publication: false
```

## Collector boundary

`collect-hkjc-detail-artifacts.mjs` accepts either a permanent fixture scenario or an explicit live specification.

Live scope rules:

- 1 through 3 explicitly declared meetings only;
- official `racing.hkjc.com` HTTPS pages only;
- bounded per-race delay;
- response bodies held in memory only;
- artifact writing requires explicit `--write-artifacts`;
- artifact output directory must be outside the repository and is rejected before live acquisition begins;
- output is limited to candidate, Coverage, Manifest, and collection report files.

## Permanent fixture coverage

The foundation fixtures cover exactly five shapes:

- complete A+;
- complete continuous A times with incomplete A+ metadata;
- complete B+ first/last evidence without continuous A rows;
- B first-time-only with incomplete meeting observation;
- C detail-source failure with explicit unresolved state.

Additional proofs require:

- A downgrade strips partial A+ fields;
- incomplete meeting evidence does not infer A/A+;
- unofficial source URLs are rejected;
- Coverage and Manifest source errors match;
- Coverage and Manifest unresolved meeting IDs match;
- rank totals close against discovered records;
- repository-local artifact output is rejected before collection;
- forbidden data keys are absent from artifacts.

## Registry boundary

This implementation does not activate:

```text
detail_source_id
detail_adapter_id
supported observation ranks above C
selected-meeting support
rank-upgrade retry support
```

The implementation uses provisional migration identities:

```text
source_id: hkjc-racecard-public-timetable
adapter_id: hkjc-racecard-detail-artifact-v1
```

Registry activation remains a later explicit decision after bounded live evidence proves the artifact-only detail path.

## Next step inside PILOT-05

Run one bounded reviewed live evidence job for a known HKJC meeting. The run must write only external or ephemeral review artifacts, prove protected canonical/public state is unchanged, upload review artifacts through read-only GitHub Actions, remove ephemeral artifacts, and prove a clean worktree.

Live evidence must be reviewed before Registry detail activation is reconsidered.
