# Timetable candidate review format

## Purpose

This document defines the review format for timetable candidate files before any candidate data is promoted into production-facing overlay files.

Candidate files are not public coverage by themselves. They are review inputs.

## Review checklist

For each candidate file, confirm:

- The file uses `timetable-candidates-v0`.
- The country and source adapter are clear.
- The candidate window is explicit.
- Every record is inside the candidate window.
- Every record is meeting-level only.
- Every record has a source URL and source checked timestamp.
- Duplicate date/racecourse/source records are resolved.
- No raw HTML, response body, racecard, entries, odds, results, payouts, predictions, or tips are present.
- Rejected records are not promoted.
- Approved records remain traceable to official source links.

## Review statuses

| Status | Meaning |
|---|---|
| `needs_review` | Candidate was generated but has not been reviewed. |
| `approved` | Candidate is allowed to be promoted to overlay. |
| `rejected` | Candidate must not be promoted. |

## Candidate lifecycle

```text
source adapter
↓
candidate JSON
↓
validator
↓
human review
↓
approved records only
↓
overlay promotion
↓
site display
```

## Safe fields

Only meeting-level safe fields are allowed:

- country
- racing system
- racecourse
- date
- start-time text
- timezone
- racing type
- source id
- source URL
- source checked timestamp
- status
- confidence
- notes

## Forbidden data

The following must not be stored in candidate or overlay files:

- raw HTML
- source response body
- racecards
- entries
- horse names
- jockey names
- trainer names
- odds
- results
- payouts
- predictions
- tips
- betting advice

## Promotion rule

A candidate record can be promoted only when:

1. `review_status` is `approved`.
2. Required safe fields are present.
3. It is inside the active candidate window.
4. It has no duplicate date/racecourse/source key.
5. It contains no forbidden data markers.

If these conditions are not met, it remains a candidate and must not appear as site coverage.
