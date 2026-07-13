# Banei current-window acquisition

Status: review-only live acquisition  
Work ID: `WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-ACQUISITION`  
Implementation unit: `BANEI-CURRENT-WINDOW-01`  
Requested window: 2026-07-13 through 2026-08-11  
Timezone: `Asia/Tokyo`

## Starting state

The reviewed Japan current-window audit found zero Canonical Banei meetings in the requested window.

This is an absence of current Canonical records. It is not a claim that no official Banei racing exists.

The next operation is therefore schedule acquisition before any promotion decision.

## Why the window is split

The active Banei acquisition profile supports:

- date-window collection;
- selected-meeting collection;
- rank-upgrade retry.

It does not claim cross-month collection.

The 30-day requested window crosses from July into August, so it is represented by two standard Collection Jobs:

```text
2026-07-13 <= date < 2026-08-01
2026-08-01 <= date < 2026-08-12
```

Each Job remains within one official monthly schedule page and uses the existing `banei-schedule-detail-actions` executor.

## Monthly schedule collector

The historical July collector is parameterized with:

```text
--target-month=YYYY-MM
--candidate-output=<path>
--report-output=<path>
```

The previous no-argument behavior remains July 2026 for historical checks.

The Actions executor derives exactly one target month from each Job. A date-window or selected-meeting Job that crosses months fails closed.

The monthly collector retains only public-safe extracted fields. Raw HTML is not written.

## Live acquisition flow

For each month Job:

```text
Collection Job
-> Runner Execution
-> official Banei monthly schedule
-> official NAR Banei RaceList / DebaTable detail route
-> merged B or A+ Candidate
-> Coverage Observation
-> Result Manifest
-> Review Queue
-> Collection Report
```

The two monthly outputs are then reconciled into one campaign result.

The campaign result records:

- discovered meeting count;
- B fallback count;
- A+ detail count;
- unresolved meeting count;
- source error count;
- exact meeting IDs and dates;
- per-month coverage and rank counts;
- review state;
- publication effect.

## Rank interpretation

### B

The official Banei schedule provides meeting identity and schedule-level timing information, but complete A+ race programme details were not obtained for that meeting.

### A+

The official NAR Banei detail route provides complete public-safe race rows.

Only these public programme fields are permitted:

- race label;
- post time;
- race name;
- distance;
- surface;
- course label.

## Safety boundary

Disabled:

- automatic approval;
- automatic promotion;
- Canonical write;
- public write;
- automatic publication;
- deployment;
- raw source storage.

The GitHub Actions workflow has `contents: read`, writes review artifacts only in its temporary workspace, uploads them, then removes generated files and proves the repository is clean.

## After the live campaign

The result determines the next bounded action:

1. review complete A+ candidates;
2. retain B records where detail remains unavailable;
3. prepare a separate promotion proposal only for approved records;
4. use selected-meeting retry only for the remaining lower-rank set;
5. keep unattended publication disabled until the three-country operating review.
