# Calendar five-rank classifier

Status: active shared classification contract  
Work ID: `WHR-CAL-ACQUISITION-CONTROL-PLANE`  
Last reviewed: 2026-07-08

## Purpose

The shared classifier maps one timetable observation to the highest evidence-backed rank:

```text
C < B < B+ < A < A+
```

It does not require observations to pass through C before reaching a higher rank.

A complete A+ observation may classify directly from no prior observation to A+.

## Canonical files

```text
data/static/calendar-five-rank-classifier-contract-v1.json
data/fixtures/calendar-five-rank-classifier-fixtures-v1.json
scripts/timetable/five-rank-classifier.mjs
scripts/check-calendar-five-rank-classifier.mjs
.github/workflows/calendar-five-rank-classifier.yml
```

## Rank shapes

### C

Required:
- meeting identity;
- date;
- racecourse.

No race time or per-race rows are required.

### B

Required:
- C identity;
- first race time.

No last race time or per-race rows are required.

### B+

Required:
- C identity;
- first race time;
- last race time.

No per-race rows are required.

### A

Required:
- first and last race times;
- non-empty per-race rows;
- every row has label and post time;
- first and last row times match the meeting boundary times.

A may contain partial A+ summary metadata, but incomplete A+ summary fields do not make the observation A+.

### A+

A+ requires complete A rows and, on every row, exactly the approved public-safe summary field family:

```text
label
post_time_local
race_name
distance_m
surface
course_label
```

This classifier does not authorize display. Public Ceiling and field switches remain separate publication-policy decisions.

## Invalid shapes

The classifier rejects:
- missing meeting identity;
- last race time without first race time;
- per-race rows without first and last boundary times;
- rows without valid labels or post times;
- first/last boundary times that disagree with first/last row times.

Rows with valid A timing structure but incomplete A+ summary metadata classify as A.

## Direct classification

The classifier returns the highest rank justified by the current observation.

Examples:

```text
meeting identity only -> C
identity + first time -> B
identity + first + last -> B+
complete race labels/times -> A
complete A rows + summary fields -> A+
```

A direct C to A+ update is valid when a later observation has complete A+ evidence.

No artificial C-only intermediate batch is required.

## Normal reviewed-rank update

Normal reviewed-rank resolution is monotonic.

Examples:

```text
C + observed B -> B
B + observed B+ -> B+
B+ + observed A -> A
A + observed A+ -> A+
C + observed A+ -> A+
A+ + later observed C -> A+
A + later observed B+ -> A
```

A later lower-detail observation does not silently downgrade a higher reviewed rank.

## Corrective downgrade boundary

The classifier does not perform corrective downgrade.

Corrective downgrade remains a separate explicit promotion path with an allowed reason such as official correction, discovered data error, source invalidation, publication policy change, or rollback.

The normal promotion path continues to reject rank regression.

## Test coverage

Classification fixtures cover:
- C;
- B;
- B+;
- A;
- A with partial summary metadata;
- A+.

Normal-update fixtures cover:
- C to B;
- B to B+;
- B+ to A;
- A to A+;
- direct C to A+;
- A+ followed by C without downgrade;
- A followed by B+ without downgrade;
- equal-rank observation.

Invalid fixtures cover missing identity, impossible boundary-time shape, rows without boundaries, malformed A rows, and row/boundary time mismatch.

## Safety boundary

The classifier accepts timetable summary evidence only.

It must not contain or classify:
- participant or horse data;
- jockey or trainer data;
- betting or odds data;
- result or payout data;
- prediction or tip data;
- source bodies or raw HTML.

Classification has no review approval, promotion, public projection, publication, or deployment side effect.

## Next stage

The next control-plane stage is Collection Result Manifest.

Result Manifest will record what actually happened per Job without changing these rank definitions or normal monotonic update rules.
