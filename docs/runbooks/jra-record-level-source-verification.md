# JRA record-level official source verification

PR-086 verifies the existing JRA candidate records record by record against official JRA source pages before any further Japan data expansion. It covers exactly the four JRA candidate records that already exist in `data/candidates/japan-jra-candidates.json`; it does not add, promote, or modify timetable data.

## Scope

Covered candidate records only:

- `japan-jra-2026-05-30-tokyo`
- `japan-jra-2026-05-30-kyoto`
- `japan-jra-2026-05-31-tokyo`
- `japan-jra-2026-05-31-kyoto`

Official JRA source pages used:

- `https://jra.jp/keiba/calendar2026/2026/5/0530.html`
- `https://jra.jp/keiba/calendar2026/2026/5/0531.html`

The JRA calendar date pages are official JRA meeting-date/program pages. They identify the meeting date, the racecourse meeting number, race numbers, and scheduled `発走時刻` values. No non-official source is used as authoritative evidence.

## Evidence status vocabulary

Each record uses the following controlled status terms:

- `meeting_date_confirmed`: the official JRA meeting-date page includes the relevant racecourse/date meeting.
- `first_race_time_confirmed`: the official JRA meeting-date/program page includes the racecourse's 1レース `発走時刻`, and it matches the stored candidate `start_time_local` after converting Japanese hour/minute notation to `HH:mm`.
- `first_race_time_needs_manual_review`: retained as an allowed status for future cases where an exact official first-race-time source cannot be safely confirmed.
- `source_unavailable`: retained as an allowed status for future cases where the official source is unavailable.
- `source_conflicts_with_candidate`: retained as an allowed status for future cases where official source evidence conflicts with the candidate.

Comparison result vocabulary:

- `match`
- `mismatch`
- `unresolved`

## Summary table

| candidate_id | Meeting date status | First race time status | Comparison result | Next action |
| --- | --- | --- | --- | --- |
| `japan-jra-2026-05-30-tokyo` | `meeting_date_confirmed` | `first_race_time_confirmed` | `match` | Keep candidate in review posture until the normal promotion gate is run in a later PR. |
| `japan-jra-2026-05-30-kyoto` | `meeting_date_confirmed` | `first_race_time_confirmed` | `match` | Keep candidate in review posture until the normal promotion gate is run in a later PR. |
| `japan-jra-2026-05-31-tokyo` | `meeting_date_confirmed` | `first_race_time_confirmed` | `match` | Keep candidate in review posture until the normal promotion gate is run in a later PR. |
| `japan-jra-2026-05-31-kyoto` | `meeting_date_confirmed` | `first_race_time_confirmed` | `match` | Keep candidate in review posture until the normal promotion gate is run in a later PR. |

## Record evidence

### `japan-jra-2026-05-30-tokyo`

| Field | Value |
| --- | --- |
| candidate_id | `japan-jra-2026-05-30-tokyo` |
| racecourse_id | `tokyo-racecourse` |
| racecourse_name | `Tokyo` |
| date | `2026-05-30` |
| current stored start_time_local | `09:50` |
| official meeting-date source URL | `https://jra.jp/keiba/calendar2026/2026/5/0530.html` |
| official first-race-time source URL, if found | `https://jra.jp/keiba/calendar2026/2026/5/0530.html` |
| evidence status | `meeting_date_confirmed`; `first_race_time_confirmed` |
| comparison result | `match` |
| notes | The official JRA 2026-05-30 calendar/program page lists `2回東京11日` and its `1レース` with `発走時刻` `9時50分`, which normalizes to `09:50` and matches the stored candidate value. |

### `japan-jra-2026-05-30-kyoto`

| Field | Value |
| --- | --- |
| candidate_id | `japan-jra-2026-05-30-kyoto` |
| racecourse_id | `kyoto-racecourse` |
| racecourse_name | `Kyoto` |
| date | `2026-05-30` |
| current stored start_time_local | `10:05` |
| official meeting-date source URL | `https://jra.jp/keiba/calendar2026/2026/5/0530.html` |
| official first-race-time source URL, if found | `https://jra.jp/keiba/calendar2026/2026/5/0530.html` |
| evidence status | `meeting_date_confirmed`; `first_race_time_confirmed` |
| comparison result | `match` |
| notes | The official JRA 2026-05-30 calendar/program page lists `3回京都11日` and its `1レース` with `発走時刻` `10時05分`, which normalizes to `10:05` and matches the stored candidate value. |

### `japan-jra-2026-05-31-tokyo`

| Field | Value |
| --- | --- |
| candidate_id | `japan-jra-2026-05-31-tokyo` |
| racecourse_id | `tokyo-racecourse` |
| racecourse_name | `Tokyo` |
| date | `2026-05-31` |
| current stored start_time_local | `09:40` |
| official meeting-date source URL | `https://jra.jp/keiba/calendar2026/2026/5/0531.html` |
| official first-race-time source URL, if found | `https://jra.jp/keiba/calendar2026/2026/5/0531.html` |
| evidence status | `meeting_date_confirmed`; `first_race_time_confirmed` |
| comparison result | `match` |
| notes | The official JRA 2026-05-31 calendar/program page lists `2回東京12日` and its `1レース` with `発走時刻` `9時40分`, which normalizes to `09:40` and matches the stored candidate value. |

### `japan-jra-2026-05-31-kyoto`

| Field | Value |
| --- | --- |
| candidate_id | `japan-jra-2026-05-31-kyoto` |
| racecourse_id | `kyoto-racecourse` |
| racecourse_name | `Kyoto` |
| date | `2026-05-31` |
| current stored start_time_local | `09:55` |
| official meeting-date source URL | `https://jra.jp/keiba/calendar2026/2026/5/0531.html` |
| official first-race-time source URL, if found | `https://jra.jp/keiba/calendar2026/2026/5/0531.html` |
| evidence status | `meeting_date_confirmed`; `first_race_time_confirmed` |
| comparison result | `match` |
| notes | The official JRA 2026-05-31 calendar/program page lists `3回京都12日` and its `1レース` with `発走時刻` `9時55分`, which normalizes to `09:55` and matches the stored candidate value. |

## Verification result

All four existing JRA candidate records have official JRA meeting-date evidence and official JRA first-race-time evidence on the corresponding JRA calendar/program page. All four stored `start_time_local` values match the official first-race `発走時刻` values documented above.

This verification is evidence only. The four candidate records remain candidate records and are not promoted by PR-086.

## Explicit non-goals and guardrails

- Does not add new JRA candidate records.
- Does not add NAR records.
- Does not add Banei records.
- Does not add new country data.
- Does not modify candidate data.
- Does not modify generated timetable records.
- Does not promote records.
- Does not add a public overlay replacement.
- Does not add live fetch runtime.
- Does not add a source parser.
- Does not add raw source body storage.
- Does not add racecards, odds, results, payouts, predictions, or tips.
- Does not claim Japan coverage is finished.
- Does not claim JRA coverage is finished.
