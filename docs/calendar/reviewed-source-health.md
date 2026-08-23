# Reviewed source-health state

Status: active planner input

This document separates source reachability/revalidation evidence from public meeting freshness.

## Problem fixed

The daily live-state builder previously derived both `last_successful_collection_at` and `last_source_revalidation_at` from the newest `last_checked_date` present in the committed public meeting list. That made a source remain `degraded` even after an independent reviewed source revalidation unless Canonical/public meeting data was rewritten merely to refresh a timestamp.

The two concepts are now separate:

- `last_successful_collection_at` continues to come from committed public meeting evidence;
- `last_source_revalidation_at` may come from newer reviewed source-health evidence;
- source revalidation alone does not create or approve timetable candidates;
- source revalidation alone does not write Canonical or public timetable data.

The reviewed input is:

`data/static/calendar-reviewed-source-health-v1.json`

Each record binds a system, checked timestamp, reviewed health disposition, reviewer, official evidence URLs, and a bounded evidence note.

## JRA revalidation on 2026-08-23

The JRA programme source was reviewed again against official JRA pages for 2026-08-29 and 2026-08-30 inside the Due-job revalidation window. The pages are reachable and expose programme rows and scheduled post times. The general 2026 programme index is also available.

This evidence changes source-health planning only. It does not claim that the JRA 2026-08-24 through 2026-08-31 timetable batch has been collected or reviewed for publication.

After the source-health block is cleared, the next planner action is the existing JRA local-primary `regular_refresh` date-window Job for 2026-08-24 through 2026-08-31 exclusive. Hosted JRA execution remains excluded.

## Reviewed season boundary

Active-system coverage gaps are now capped by the current reviewed season record's `effective_end_date_exclusive` as well as the rolling planning window. The planner must never request dates beyond a reviewed active window merely because the global 30-day horizon extends farther.

For the current JRA record, the reviewed active window ends at 2026-09-07 exclusive. Therefore a public source horizon already reaching 2026-09-07 creates no JRA coverage-gap Job beyond that date.

## Safety boundary

Reviewed source-health evidence must not:

- approve candidates;
- promote Canonical records;
- rebuild public timetable data;
- publish results, horses, jockeys, trainers, odds, payouts, predictions, raw HTML, or direct stream URLs;
- change the JRA local-primary runner policy;
- infer season activity beyond reviewed season-state records;
- authorize deployment or merge.
