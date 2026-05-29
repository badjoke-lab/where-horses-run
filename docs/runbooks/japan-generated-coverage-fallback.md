# Japan generated coverage fallback

Status: M3 real-data readiness fallback
Phase: PR-050

This runbook documents the Japan generated timetable fallback added for the timetable schema v0 foundation.

---

## Target

Country: Japan
Source id: japan-jra-home
Mode: link-first / dry-run
Live fetching: disabled
Generated file: data/generated/timetables.json

---

## Current mode

Japan currently uses link-first / dry-run mode. The project has an official JRA source record, but this PR does not turn that record into an automated data source.

The generated timetable fallback exists so future UI work can read a stable file and field shape while Japan date-level data remains unverified.

---

## What this PR adds

This PR adds an empty Japan-safe timetable fallback structure. It records that Japan is in manual fallback mode and points users back to the official JRA link for confirmation.

No exact meeting dates or start times are asserted by this fallback file.

---

## What this PR does not add

This PR does not add:

- A Japan parser.
- Live fetching.
- Source-specific page fetching.
- Raw source body storage.
- Saved official page content.
- Racecard, runner, odds, result, payout, prediction, or tip publication.

---

## Safety boundary

Live fetching remains disabled for Japan. The fallback must stay safe for UI prototyping and must not store raw official page bodies or copied page text.

Official links remain the final confirmation point until a later source-reviewed timetable extraction PR is accepted.

---

## Future use

The next UI step can display the safe timetable data structure and fallback status on country pages. When date-level Japan timetable facts are verified later, they can be added as timetable records using only the schema v0 fields.
