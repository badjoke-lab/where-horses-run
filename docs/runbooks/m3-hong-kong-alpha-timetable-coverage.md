# M3 Hong Kong alpha timetable coverage

Status: M3 alpha kickoff  
Phase: M3 v0 Alpha timetable coverage

This runbook documents the first M3 alpha timetable coverage step for Where Horses Run / 競馬どこ？.

---

## Target

Country: Hong Kong  
Source id: hong-kong-hkjc-home  
Mode: link-first / dry-run  
Live fetching: disabled

---

## What this PR adds

This PR makes Hong Kong visibly act as the first M3 alpha timetable coverage candidate.

It adds:

- country-page alpha coverage messaging
- FetchStatus visibility on the Hong Kong country page
- official source notes on country pages
- Japanese country-page source and racecourse display parity
- public runbook for Hong Kong alpha coverage

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

## M3 acceptance for this step

This step is accepted if:

- `/countries/hong-kong/` shows alpha timetable coverage status
- `/ja/countries/hong-kong/` shows alpha timetable coverage status
- Hong Kong FetchStatus is visible
- official source links remain the confirmation point
- `npm run check` passes
- generated data remains placeholder / dry-run safe

---

## Next step

After this PR, continue M3 by expanding the next alpha jurisdiction or deepening Hong Kong source notes without enabling unsafe live fetching.
