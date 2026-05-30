# Japan official timetable source evidence

Status: PR-084 source-evidence and gap-identification pass.

This document verifies Japan timetable source evidence for JRA, NAR, and Banei before any more timetable records are added or promoted. It is evidence-only: it does not add candidate records, does not promote records, does not replace public overlays, and does not claim Japan complete coverage. Existing Japan timetable coverage remains partial and must be treated as source-reviewed only where the repo already says so.

## Safety boundary

- No new country expansion.
- No new Japan candidate timetable records.
- No live fetch runtime.
- No source page parser.
- No raw official source body storage.
- No racecards, odds, results, payouts, predictions, or tips.
- No public overlay replacement.
- No complete coverage claims for Japan or any Japan subsystem.

## Shared timezone assumption

All documented Japan systems use `Asia/Tokyo` / Japan Standard Time for repo timetable records. Japan does not use daylight saving time in the current repo assumptions, so meeting dates and first-race-time evidence should be recorded as local Japanese dates and local times unless an official source says otherwise.

## JRA

### Racecourse inventory source

Official racecourse inventory source: `https://japanracing.jp/en/racing/go_racing/jra_racecourses/`.

Evidence status: `source_confirms_inventory`.

The official JRA racecourse page says JRA has 10 racecourses and lists:

| Official JRA racecourse | Current repo inventory status | Evidence comparison |
| --- | --- | --- |
| Sapporo | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Hakodate | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Fukushima | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Niigata | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Tokyo | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Nakayama | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Chukyo | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Kyoto | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Hanshin | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |
| Kokura | present in `data/static/country-racing-inventory.json` | matches official 10-course inventory |

### Fixture/calendar source

Official fixture/calendar source: `https://japanracing.jp/en/racing/schedule/jra/2026.html`.

Evidence status: `source_found`.

The official calendar page is the JRA Racing Fixtures & Principal Race Schedule page for 2026. It displays months, meeting dates, graded/principal races, and course markers for JRA. The Japanese JRA calendar surface also exists at `https://jra.jp/keiba/calendar2026/`, and existing repo JRA candidate source URLs point to date pages under that surface.

### Meeting date source

Meeting date source: the official 2026 JRA calendar at `https://japanracing.jp/en/racing/schedule/jra/2026.html`, cross-checkable against JRA date pages such as `https://jra.jp/keiba/calendar2026/2026/5/0530.html` and `https://jra.jp/keiba/calendar2026/2026/5/0531.html`.

Evidence status: `source_found_for_existing_candidates`.

Existing repo JRA candidate records are limited to Tokyo and Kyoto on 2026-05-30 and 2026-05-31:

| Candidate record | Official calendar evidence level | PR-084 action |
| --- | --- | --- |
| `japan-jra-2026-05-30-kyoto` | Existing source URL points to the official JRA 2026-05-30 calendar date page; the JRA 2026 calendar is the official meeting-date source surface. | Keep as existing candidate; do not add new records. |
| `japan-jra-2026-05-30-tokyo` | Existing source URL points to the official JRA 2026-05-30 calendar date page; the JRA 2026 calendar is the official meeting-date source surface. | Keep as existing candidate; do not add new records. |
| `japan-jra-2026-05-31-kyoto` | Existing source URL points to the official JRA 2026-05-31 calendar date page; the JRA 2026 calendar is the official meeting-date source surface. | Keep as existing candidate; do not add new records. |
| `japan-jra-2026-05-31-tokyo` | Existing source URL points to the official JRA 2026-05-31 calendar date page; the JRA 2026 calendar is the official meeting-date source surface. | Keep as existing candidate; do not add new records. |

### First race time source or explicit first race time gap

Potential official first-race-time source: date-specific JRA race selection / race result pages under `https://www.jra.go.jp/JRADB/`, for example official JRA result pages expose `発走時刻` for a race.

Evidence status: `source_needs_manual_review`.

PR-084 verifies that JRA has an official surface that can show start times, but it does not verify an extraction rule for first race time from the existing candidate date pages. Existing JRA candidate `start_time_local` values remain candidates that need manual review before promotion. First-race-time extraction is therefore not verified in this PR.

### Timezone assumption

JRA records should use `Asia/Tokyo` local time.

### Current repo candidate/bundle status

- `data/candidates/japan-jra-candidates.json` currently contains 4 JRA candidate records, all for Tokyo/Kyoto on 2026-05-30 and 2026-05-31.
- `data/candidates/japan-active-window-approved-candidates.json` includes those 4 JRA records in the review bundle.
- No JRA records are added or promoted by PR-084.
- JRA racecourse inventory is complete at the inventory-evidence level, but JRA timetable coverage is not complete.

### Gaps before promotion

- Manually verify each existing JRA candidate first-race-time value against an official date-specific JRA race page.
- Confirm whether the English JRA calendar course markers are sufficient for all active-window meeting dates or whether Japanese date pages must be the canonical meeting-date source.
- Produce a Japan active-window candidate gap report before any further JRA additions.
- Do not promote additional JRA records until meeting date and first-race-time evidence are reviewed record by record.

## NAR

### Racecourse inventory source

Official racecourse inventory source: `https://www2.keiba.go.jp/guide/` and individual NAR guide pages such as `https://www2.keiba.go.jp/guide/08/race_map.html`.

Evidence status: `source_confirms_inventory`.

The official NAR racecourse guide surface lists 15 racecourses: Obihiro, Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Ohi, Kawasaki, Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, and Saga. The current repo inventory includes these NAR guide racecourses, with Obihiro cross-listed for Banei.

### Fixture/calendar source

Official fixture/calendar source surface: `https://www2.keiba.go.jp/` / `https://www.keiba.go.jp/` date-specific race information, including `https://www2.keiba.go.jp/KeibaWeb/TodayRaceInfo/TodayRaceInfoTop` and date/racecourse race-list URLs under `https://www2.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList`.

Evidence status: `source_found_date_specific_only`.

PR-084 identifies date-specific race-list pages as an official source surface for NAR meeting dates and start times. It does not verify a stable, single all-racecourse annual/monthly calendar source for every NAR racecourse. Treat NAR as having official date-specific race information pages, not a confirmed stable all-NAR calendar source in this PR.

### Meeting date source

Meeting date source: NAR date-specific race information pages, especially `TodayRaceInfoTop` and `RaceList?k_babaCode=...&k_raceDate=YYYY%2FMM%2FDD` pages.

Evidence status: `source_found_date_specific_only`.

The official `RaceList` page shows a racecourse/date heading and race rows for that selected date. This proves that date-specific NAR pages can support meeting-date verification for a specific racecourse and date, but PR-084 does not convert that into broad NAR calendar coverage.

### First race time source or explicit first race time gap

First race time source: date-specific NAR `RaceList` pages include a `発走時刻` column. Example official NAR race-list pages show 1R start times for selected racecourse/date combinations.

Evidence status: `source_found_surface_not_extracted_for_repo_records`.

Existing repo NAR generated active records deliberately store `Meeting date verified on NAR; exact first start time not stored` instead of exact times. PR-084 confirms the official page surface can expose first-race-time rows, but it does not extract or add exact NAR first-race-time values.

### Timezone assumption

NAR records should use `Asia/Tokyo` local time.

### Current repo candidate/bundle status

- `data/candidates/japan-nar-candidates.json` currently contains 12 NAR candidate records in the 2026-05-30 through 2026-06-01 active-window bundle.
- `data/candidates/japan-active-window-approved-candidates.json` includes those NAR records in the review bundle.
- `data/generated/japan-active-timetable-records.json` currently contains 12 NAR source-reviewed meeting-date-level records with no exact first start time stored.
- PR-084 adds no NAR candidate records and does not promote more NAR records.

### Gaps before promotion

- Identify whether NAR has a stable official calendar source covering all racecourses and dates, or document a date-specific-only workflow explicitly.
- Verify each candidate/generated NAR meeting date against the official date-specific page for the correct `k_babaCode` and date.
- Extract exact first race time only after a reviewed parser-free or manual evidence rule is approved.
- Keep NAR timetable coverage partial until a gap report enumerates active-window missing racecourse/date coverage.

## Banei

### Racecourse inventory source

Official venue source: `https://www.banei-keiba.or.jp/language/index_en.php` and Banei/NAR guide surfaces confirming Obihiro Racecourse for Banei horse racing.

Evidence status: `source_confirms_inventory`.

Banei is venue-specific in the current repo: Obihiro is the Banei venue. The repo inventory has `obihiro-racecourse` under the separate Banei system and also cross-lists Obihiro in the NAR racecourse guide inventory.

### Fixture/calendar source

Official Banei schedule source: `https://www.banei-keiba.or.jp/race_schedule.php`.

Additional annual schedule evidence: `https://banei-keiba.or.jp/tp_detail.php?id=10288` and the linked annual schedule PDF at `https://www.banei-keiba.or.jp/data/pdf/nenkan_kaisai_r8.pdf`.

Evidence status: `source_found`.

The official Banei schedule page provides meeting dates and opening/start-time information for Banei開催 days. The annual schedule announcement/PDF provides season-level dates and basic first/final race time patterns, while the monthly schedule page is the active official schedule surface used by existing repo records.

### Meeting date source

Meeting date source: `https://www.banei-keiba.or.jp/race_schedule.php`, with annual backup evidence from `https://banei-keiba.or.jp/tp_detail.php?id=10288`.

Evidence status: `source_found`.

The Banei schedule page provides Banei開催 dates. PR-084 records this evidence but does not add more Banei candidate records.

### First race time source or explicit first race time gap

First race time source: `https://www.banei-keiba.or.jp/race_schedule.php` provides date-specific schedule/time entries, and the annual schedule PDF describes first-race-time patterns by day type.

Evidence status: `source_found_surface_needs_record_review`.

Existing Banei generated records include exact first race times for 2026-05-30 through 2026-06-01. PR-084 records that the official Banei schedule page provides meeting dates and first race times, but it does not add records and does not re-promote Banei coverage as complete.

### Timezone assumption

Banei records should use `Asia/Tokyo` local time.

### Current repo candidate/bundle status

- `data/candidates/japan-banei-candidates.json` currently contains 3 Banei candidate records for Obihiro on 2026-05-30, 2026-05-31, and 2026-06-01.
- `data/candidates/japan-active-window-approved-candidates.json` includes those Banei records in the review bundle.
- `data/generated/japan-active-timetable-records.json` currently contains 3 Banei source-reviewed records with exact first race times.
- PR-084 adds no Banei candidate records and does not replace the public overlay.

### Gaps before promotion

- Re-check each existing Banei date/time against the current official Banei schedule page immediately before any future promotion or public overlay replacement.
- Decide whether annual schedule PDFs or monthly schedule pages are canonical when they differ.
- Keep Obihiro/Banei as one-venue evidence, not broad Japan timetable coverage.

## Comparison table

| System | Official source URL | Evidence status | What it proves | Current repo status | Remaining gap | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| JRA | `https://japanracing.jp/en/racing/go_racing/jra_racecourses/`; `https://japanracing.jp/en/racing/schedule/jra/2026.html`; `https://jra.jp/keiba/calendar2026/` | `source_confirms_inventory`; `source_found`; `source_needs_manual_review` for first race time extraction | Confirms the 10 JRA racecourses and official 2026 calendar surface; existing candidate dates point to official JRA calendar date pages. | 4 JRA candidate records only; no PR-084 additions; no JRA complete-coverage claim. | First-race-time extraction from official JRA race pages is not verified. | PR-085 active-window candidate gap report and manual first-race-time evidence review. |
| NAR | `https://www2.keiba.go.jp/guide/`; `https://www2.keiba.go.jp/KeibaWeb/TodayRaceInfo/TodayRaceInfoTop`; `https://www2.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList` | `source_confirms_inventory`; `source_found_date_specific_only`; first-time source surface found but not extracted for repo records | Confirms NAR guide racecourse inventory and identifies official date-specific race-list pages for meeting dates and `発走時刻`. | 12 NAR candidates and 12 generated meeting-date-level active records; exact first start time not stored. | Stable all-NAR calendar source not confirmed; exact first-race-time extraction not done. | PR-085 gap report should enumerate active-window NAR missing dates and decide all-calendar vs date-specific workflow. |
| Banei | `https://www.banei-keiba.or.jp/race_schedule.php`; `https://banei-keiba.or.jp/tp_detail.php?id=10288`; `https://www.banei-keiba.or.jp/data/pdf/nenkan_kaisai_r8.pdf` | `source_confirms_inventory`; `source_found`; `source_found_surface_needs_record_review` | Confirms Obihiro as the Banei venue and official Banei schedule surfaces for meeting dates and first race time evidence. | 3 Banei candidates and 3 generated source-reviewed records; no PR-084 additions. | Existing times should be re-checked against current official schedule before any future public replacement. | PR-085 should report Banei active-window gaps and identify canonical monthly-vs-annual evidence. |

## Non-claims and gap posture

- This document does not claim Japan complete.
- This document does not claim JRA complete.
- This document does not claim NAR covered.
- This document does not claim Banei covered.
- Racecourse inventory evidence is not timetable coverage.
- Existing candidates and generated records remain partial and should not be used as proof that Japan timetable coverage is comprehensive.
