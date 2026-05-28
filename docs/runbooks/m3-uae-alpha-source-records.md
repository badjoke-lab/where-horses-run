# M3 UAE alpha source records

Status: M3 alpha source record
Phase: M3 v0 Alpha timetable coverage

This runbook documents the UAE alpha source-record step.

---

## Target

Country: United Arab Emirates
Source id: uae-era-home
Mode: link-first / dry-run
Live fetching: disabled

---

## What this PR adds

This PR strengthens the UAE official source record for M3 alpha coverage.

It adds:

- M3 alpha status on the UAE official source record
- explicit link-first and dry-run notes
- explicit no-redistribution boundary
- UAE FetchStatus skipped entry
- validation for the UAE alpha source record

---

## Current boundary

This step does not enable live fetching.

It does not:

- fetch live pages
- scrape racecards
- store raw live page bodies
- republish entries
- republish odds
- republish results
- republish payouts
- provide betting tips

---

## User-facing pages to check

After deployment, manually check:

- /countries/united-arab-emirates/
- /ja/countries/united-arab-emirates/

Both pages should continue to show official source routing and avoid presenting live schedule data as fetched data.

---

## Acceptance

This step is accepted when:

- npm run check passes
- UAE source record has m3_status alpha_link_first
- UAE FetchStatus remains skipped
- live fetching remains disabled
- official source confirmation remains the boundary
