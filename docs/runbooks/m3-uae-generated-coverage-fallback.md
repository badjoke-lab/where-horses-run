# M3 UAE generated coverage fallback

Status: M3 alpha fallback
Phase: M3 v0 Alpha timetable coverage

This runbook documents the UAE generated coverage fallback step.

---

## Target

Country: United Arab Emirates
Source id: uae-era-home
Mode: link-first / dry-run
Live fetching: disabled

---

## What this PR adds

This PR makes M3 alpha coverage display generic for countries with alpha source records or FetchStatus entries.

It adds fallback visibility for UAE without enabling live fetching.

---

## Current boundary

This step does not enable live fetching.

It does not fetch live pages, scrape racecards, store raw live page bodies, republish entries, republish odds, republish results, republish payouts, or provide betting tips.

---

## User-facing pages to check

After deployment, manually check:

- /countries/united-arab-emirates/
- /ja/countries/united-arab-emirates/

Both pages should show:

- Alpha timetable coverage
- FetchStatus coverage
- Generated coverage fallback
- live fetching disabled
- official source routing

---

## Acceptance

This step is accepted when:

- npm run check passes
- UAE page shows generated fallback coverage
- UAE FetchStatus remains skipped
- live fetching remains disabled
