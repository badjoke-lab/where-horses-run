# Calendar JRA pilot foundation

Status: active  
Work ID: `WHR-CAL-JAPAN-JRA`  
Started: 2026-07-01

## Purpose

The JRA pilot begins with a review-only gate over the existing normalized meeting/detail files and the Pipeline v1 candidate. It does not enable source acquisition or publication.

```text
normalized JRA meetings/details
+ candidate v1
+ Authority/Source and Readiness records
+ JRA pilot control
-> deterministic pilot review
```

## Current result

The four meeting/detail/candidate records agree on IDs, racecourse scope, Technical Rank, confirmed fields, and official host.

The current source fixture was checked on June 9, 2026. The canonical registry minimum is June 17, 2026. The pilot therefore remains blocked by `source_fixture_predates_registry`.

The candidate remains `needs_review` and is not promotion-ready.

## Control

```text
data/static/jra-pilot-control.json
```

Current mode is `fixture_review_only`. Source acquisition, automatic approval, canonical/public writes, scheduled operation, and unattended publication remain disabled.

## Review output

```text
node scripts/timetable/build-jra-pilot-review.mjs
```

Committed baseline:

```text
data/generated/timetable/jra-pilot-review.json
```

The review records eight SHA-256 input digests, source freshness, official host validation, meeting/detail/candidate parity, scope, rank, confirmed fields, review state, public projection counts, blockers, and next actions.

## Next actions

1. obtain a fresh reviewed official JRA fixture;
2. regenerate normalized JRA meeting/detail data;
3. regenerate the candidate v1 file;
4. repeat human review;
5. run canonical promotion only after the freshness gate passes.

## Boundary

The review stores no source body and does not change candidate, canonical, or public data. Calendar list pages remain one meeting per row, and current Public Ceiling rules remain unchanged.

## Manual workflow

`.github/workflows/calendar-jra-pilot-review.yml` is read-only and uploads the review artifact. It does not fetch source pages or commit changes.

## Validation

```text
node scripts/timetable/build-jra-pilot-review.mjs --check
node scripts/check-jra-pilot-foundation.mjs
```

A later JRA pilot slice may add a reviewed acquisition adapter, but only after its input, output, privacy, fallback, and rollback contract is explicit.
