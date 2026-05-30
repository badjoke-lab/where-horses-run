# Japan active-window candidate gap report

PR-085 compares the existing Japan candidate/generated timetable records against the official source evidence documented in [`docs/runbooks/japan-official-timetable-source-evidence.md`](./japan-official-timetable-source-evidence.md). The purpose is to identify missing racecourse/date coverage and record-level first-race-time verification needs before Japan receives more candidate records or any further timetable promotion.

## Active-window basis

This report uses the existing repo candidate window where present:

- `start_date`: `2026-05-29`
- `end_date_exclusive`: `2026-06-28`
- `timezone`: `Asia/Tokyo`

This PR does not fetch live source pages. This PR does not add candidate records. This PR does not promote records, replace public overlays, add parsers, or add live-fetch runtime behavior.

## Summary table

| System | Inventory scope | Current records | Exact time status | Active-window completeness status | Next required action |
| --- | --- | --- | --- | --- | --- |
| JRA | 10 JRA racecourses: Sapporo, Hakodate, Fukushima, Niigata, Tokyo, Nakayama, Chukyo, Kyoto, Hanshin, Kokura | 4 JRA candidate records only: Tokyo and Kyoto on 2026-05-30 and 2026-05-31 | Exact `start_time_local` values are stored in candidate records, but first-race-time verification is required record by record against official JRA evidence before promotion | Not verified across the active window; all other JRA racecourses and all other active-window dates are not verified in repo | Perform JRA record-level source verification for each candidate date/racecourse/time before adding or promoting more JRA records |
| NAR | 15 NAR racecourses: Obihiro, Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Ohi, Kawasaki, Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga | 12 NAR candidate/generated meeting-date-level records | NAR exact first race times are not stored; records retain meeting-date-level text instead of exact first-race-time values | Date-specific source workflow is identified, but active-window completeness is not checked and NAR is not covered | Build a future date/racecourse matrix from official NAR date-specific pages before more NAR records are added |
| Banei | 1 Banei venue: Obihiro | 3 Banei records for Obihiro on 2026-05-30, 2026-05-31, and 2026-06-01 | Exact first-race-time values exist, but Banei times must be rechecked against official source evidence before future promotion | Active-window dates beyond the 3 current records are not verified unless official source evidence is added | Recheck each current Banei record against the official monthly/annual evidence and document any additional active-window dates before expansion |

## JRA

### Official source evidence URLs

- `https://japanracing.jp/en/racing/go_racing/jra_racecourses/`
- `https://japanracing.jp/en/racing/schedule/jra/2026.html`
- `https://jra.jp/keiba/calendar2026/`
- Existing candidate date pages:
  - `https://jra.jp/keiba/calendar2026/2026/5/0530.html`
  - `https://jra.jp/keiba/calendar2026/2026/5/0531.html`

### Current repo candidate/generated record count

The repo currently has 4 JRA candidate records only. They are limited to:

- Tokyo / 2026-05-30
- Kyoto / 2026-05-30
- Tokyo / 2026-05-31
- Kyoto / 2026-05-31

There are no JRA records in `data/generated/japan-active-timetable-records.json`; the active generated Japan file currently contains NAR and Banei meeting-level records.

### Current racecourses represented

- Tokyo
- Kyoto

### Known racecourses in inventory

The JRA inventory scope is the official 10-course JRA set:

- Sapporo
- Hakodate
- Fukushima
- Niigata
- Tokyo
- Nakayama
- Chukyo
- Kyoto
- Hanshin
- Kokura

### Missing racecourse/date coverage status

Only Tokyo and Kyoto have repo JRA candidate records, and only for 2026-05-30 and 2026-05-31. Sapporo, Hakodate, Fukushima, Niigata, Nakayama, Chukyo, Hanshin, and Kokura have no JRA candidate records in this active-window bundle. Every active-window date other than 2026-05-30 and 2026-05-31 is not verified in repo for JRA, including Tokyo and Kyoto.

### First-race-time verification status

JRA candidate records store exact `start_time_local` values, but those values require record-by-record official first-race-time verification before promotion. PR-085 does not verify those times against live JRA pages.

### Whether exact first race times are stored

Yes. JRA candidate records contain exact `start_time_local` values for the four Tokyo/Kyoto records, but the stored values remain candidate-level evidence and must not be promoted without record-level official verification.

### Next action before data expansion

Before adding or promoting more JRA records, perform a JRA record-level source verification pass that maps each active-window date/racecourse candidate to the official date page and confirms the exact first race time.

## NAR

### Official source evidence URLs

- `https://www2.keiba.go.jp/guide/`
- `https://www.keiba.go.jp/guide/`
- `https://www2.keiba.go.jp/KeibaWeb/TodayRaceInfo/TodayRaceInfoTop`
- `https://www2.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList`

### Current repo candidate/generated record count

The repo currently has 12 NAR candidate/generated meeting-date-level records. The candidate bundle contains 12 NAR candidate records, and `data/generated/japan-active-timetable-records.json` contains 12 NAR meeting-date-level records.

### Current racecourses represented

- Funabashi
- Kanazawa
- Kasamatsu
- Kochi
- Mizusawa
- Saga
- Sonoda
- Urawa

### Known racecourses in inventory

The NAR inventory scope is the official 15-racecourse guide set:

- Obihiro
- Monbetsu
- Morioka
- Mizusawa
- Urawa
- Funabashi
- Ohi
- Kawasaki
- Kanazawa
- Kasamatsu
- Nagoya
- Sonoda
- Himeji
- Kochi
- Saga

### Missing racecourse/date coverage status

The date-specific source workflow is identified, but active-window completeness is not checked. NAR records currently represent a subset of racecourses and dates only. Obihiro, Monbetsu, Morioka, Ohi, Kawasaki, Nagoya, and Himeji have no NAR candidate/generated meeting-date-level records in the current active-window set, and represented venues still have unverified active-window dates outside their current record dates.

### First-race-time verification status

NAR first-race-time extraction remains a verification gap. The official race-list workflow can expose date/racecourse-specific race times, but this PR does not run that workflow and does not verify exact NAR first race times.

### Whether exact first race times are stored

No. NAR exact first race times are not stored. Current NAR generated records use the meeting-date-level value `Meeting date verified on NAR; exact first start time not stored`, and the NAR candidate records do not carry verified exact first-race-time values.

### Next action before data expansion

Create a future NAR date/racecourse matrix for the active window using official NAR date-specific pages before more NAR records are added. The matrix should mark each racecourse/date as meeting found, no meeting found, or source unavailable, and should separately record exact first-race-time verification status.

## Banei

### Official source evidence URLs

- `https://www.banei-keiba.or.jp/language/index_en.php`
- `https://www.banei-keiba.or.jp/race_schedule.php`
- `https://banei-keiba.or.jp/tp_detail.php?id=10288`
- `https://www.banei-keiba.or.jp/data/pdf/nenkan_kaisai_r8.pdf`

### Current repo candidate/generated record count

The repo currently has 3 Banei records for Obihiro:

- Obihiro / 2026-05-30
- Obihiro / 2026-05-31
- Obihiro / 2026-06-01

The candidate file contains 3 Banei records, and `data/generated/japan-active-timetable-records.json` contains the same 3 Banei meeting records.

### Current racecourses represented

- Obihiro

### Known racecourses in inventory

Obihiro is the only Banei venue in the current repo inventory and official-source evidence posture.

### Missing racecourse/date coverage status

Because Obihiro is the only Banei venue, the remaining gap is date coverage rather than venue coverage. Active-window dates beyond 2026-05-30, 2026-05-31, and 2026-06-01 are not verified unless official source evidence is added.

### First-race-time verification status

Banei exact first-race-time values exist in candidate and generated records, but Banei times must be rechecked against the official schedule evidence before future promotion.

### Whether exact first race times are stored

Yes. Banei records store exact `start_time_local` values for the three current Obihiro dates: 14:35, 14:25, and 14:20.

### Next action before data expansion

Recheck the three existing Obihiro records against the official Banei schedule page and decide how monthly schedule evidence and annual schedule PDF evidence should be reconciled before adding any additional active-window Banei dates.

## Explicit non-coverage posture

- This report identifies gaps; it does not claim Japan complete.
- This report does not claim JRA complete.
- This report does not claim NAR covered.
- This report does not claim Banei covered.
- Racecourse inventory evidence is not active-window timetable coverage.
- Candidate records are not promoted records.
