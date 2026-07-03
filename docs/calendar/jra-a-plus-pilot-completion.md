# JRA A+ pilot completion

Status: complete  
Work ID: `WHR-CAL-JAPAN-JRA-A-PLUS`  
Completed: 2026-07-03  
Next Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`

## Completed scope

The JRA pilot is complete for the review-controlled Pipeline v1 path.

- official JRA Japanese programme pages are acquired from an operator-triggered local command;
- July 2026 produced 24 reviewed A+ meetings and 288 July timetable rows;
- one retained June A+ detail brings the complete JRA public-detail baseline to 25 meetings and 300 rows;
- candidate, normalized, canonical, public, Japan A+ override, pilot-review, operations-status, and operations-review artifacts are synchronized;
- meeting details expose only race label, scheduled post time, race name, distance, surface, and course label;
- rendered Calendar surfaces and meeting routes pass bilingual public QA;
- production changes remain pull-request reviewed.

## Operating model

Run from the repository root:

```bash
sh refresh-jra-manual YYYY-MM
```

The command uses an isolated temporary checkout, fetches the selected month, requires every publishable meeting to reach A+, validates public boundaries, builds the site, and creates or updates a review PR. It does not update production by itself.

## Failure and rollback

- acquisition, parser, A+ completeness, boundary, dependency, or build failure creates no review PR;
- generated timetable files are restored on failure;
- the original local working tree is not modified;
- stale or failed production acquisition leaves the previously merged public data in place;
- official-source fallback remains available;
- scheduled and unattended publication remain disabled.

## Public boundary

Allowed meeting-detail fields:

- race label or number;
- scheduled post time;
- race name or condition;
- distance;
- surface;
- course label.

Participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, and direct-stream data remain excluded.

## Completion evidence

- PR #401: July 2026 JRA A+ data and recurring refresh path;
- PR #402: Japan A+ policy reconciliation;
- `data/audits/calendar-jra-a-plus-pilot-completion.json`;
- `scripts/check-calendar-jra-a-plus-pilot-completion.mjs`;
- grouped Calendar release gates and repository-wide Check.

## Next work

`WHR-CAL-JAPAN-NAR-A-PLUS` begins with authority- and racecourse-specific source architecture. The old PR #281 is not merged directly; only unique reusable parsing knowledge may be migrated into the current Pipeline v1 path.
