# UAE ERA exact four Rank A review unit — 2026-09-01

This file records the immutable review identity for four existing public UAE ERA Rank C meetings that were re-acquired from the official ERA racecard route and classified at Rank A.

## Exact review evidence

- workflow run: `33488095481`
- workflow head: `99efe2532bab4c8bb998b82e500f1b5b039fc8cf`
- artifact ID: `9792598245`
- artifact ZIP SHA-256: `24f359830315c7de3dbe7c532a69785cb044984ff35b042f18d71cccc6095271`
- candidate SHA-256: `eda7fd10ee5ac1ea0f571c5814958bc4641ac25a30a1c1c7703ffb8789c84f51`
- manifest SHA-256: `b4bd443550357ee0dba8000de294e8b1ab1f0827538dd68293a1b631b7fa867a`
- coverage claim: `source_window_complete`
- rank counts: `A=4`, all other ranks `0`
- source errors: `0`
- canonical write: `false`
- public write: `false`

## Exact meeting scope

- `era-al-ain-racecourse-2026-04-03` — Rank A — 9 races — 17:00–21:00
- `era-abu-dhabi-turf-club-2026-04-04` — Rank A — 7 races — 17:00–20:00
- `era-al-ain-racecourse-2026-04-10` — Rank A — 10 races — 17:00–21:30
- `era-abu-dhabi-turf-club-2026-04-11` — Rank A — 8 races — 16:00–19:30

Only public-safe Race 1-N labels and post times are in scope for Rank A. Participant, betting, result, payout, prediction, raw-source, and stream data remain excluded.

## Explicit exclusion

`era-meydan-racecourse-2026-04-01` is not part of this review unit. The same live probe reached the official source but discovered only Race 1 and classified the observation at Rank B (`first_race_time_local=09:00`, no last-race time). That observation is not treated as a complete-meeting rank upgrade.

## Review boundary

This record does not itself approve or publish the four upgrades. It fixes the exact source artifact, hashes, meeting identities, and public-safe scope so that any later approval/promotion can be bounded to these four records only.
