# Ireland HRI racecard acquisition route — 2026-09-11

## Verified official route

Horse Racing Ireland's public `/racecards` page loads its meeting list from the HRI-owned AJAX endpoints `/Ajax/Top7FixtureDate` and `/Ajax/RaceMeetingByMonth`.

GitHub Actions verification on 2026-09-11 confirmed that `/Ajax/RaceMeetingByMonth?Month=2026-09-01` returns meeting headers containing HRI meeting IDs and, when published, complete race rows with local post times and race names.

Observed examples used to establish the adapter contract:

- Laytown, 2026-09-10: HRI meeting `2026-269`, six published race rows.
- Ballinrobe, 2026-09-11: HRI meeting `2026-270`, eight published race rows from 15:24 through 19:10.
- Downpatrick, 2026-09-18: HRI meeting `2026-275`, meeting header present but no race rows yet published at the observation time.

## Acquisition semantics

The annual HRI fixture PDF remains the meeting-discovery source. The HRI Racecards monthly route is evaluated for richer evidence.

- published complete post-time rows -> Best Available may rise to `A`;
- meeting present with no race rows -> retain the lower verified observation and record `not_published` / `pending_publication`;
- racecard retrieval or parser failure -> retain the lower verified observation and record `source_error` / `retry_required`;
- no distance/surface/course metadata is inferred, so this route does not claim `A+`.

The unified Calendar refresh already revisits the Ireland runner in full and near-date refresh cycles, so pending HRI detail is re-evaluated without treating a valid lower rank as acquisition-complete.
