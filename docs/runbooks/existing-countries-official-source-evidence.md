# Existing countries official source evidence

This runbook records official source evidence for the countries already introduced in the project before any additional country expansion. It is evidence documentation only: it does not add source parsers, live fetch runtime, public overlay replacement, candidate timetable records, racecards, odds, results, payouts, predictions, tips, or new countries.

Policy gate: do not add new countries before existing-country source evidence is reviewed.

This document does not claim public coverage is complete, does not claim any country is complete, and does not claim complete coverage for Japan, Hong Kong, or the UAE. Evidence statuses used below are limited to:

- `source_found`
- `source_not_found`
- `source_needs_manual_review`
- `source_conflicts_with_inventory`
- `source_confirms_inventory`

## Japan

Current repo inventory source checked: `data/static/country-racing-inventory.json`, country `japan`. Japan is split between JRA, NAR, and Banei because those systems have different official source surfaces and different inventory risks.

### Japan — JRA

#### Official source evidence

| Evidence area | Status | Official source URL | What the source proves | Notes |
| --- | --- | --- | --- | --- |
| Racing authority / operator | `source_found` | https://jra.jp/ | JRA is the official Japan Racing Association site used for central racing confirmation. | Link-only source already exists as `japan-jra-home`. |
| Racecourse inventory | `source_confirms_inventory` | https://jra.jp/facilities/ | JRA official facilities page lists the ten JRA racecourses: Sapporo, Hakodate, Fukushima, Niigata, Tokyo, Nakayama, Chukyo, Kyoto, Hanshin, and Kokura. | Confirms the ten JRA racecourses already in repo inventory. |
| Fixture / calendar source | `source_found` | https://jra.jp/keiba/calendar2026/ | JRA official calendar is the fixture source for JRA racedays and racecourse/date combinations. | Needs manual review before any generator relies on it. |
| Meeting date source | `source_found` | https://jra.jp/keiba/calendar2026/ | The JRA calendar provides meeting dates by racecourse. | Current repo records only seed Tokyo/Kyoto dates, not full calendar coverage. |
| First race time source | `source_needs_manual_review` | https://jra.jp/keiba/calendar2026/ | Calendar day pages and race program pages can lead to race programme details, but this PR does not verify a stable first-race-time field for safe extraction. | Do not infer first race time from non-reviewed pages. |
| Timezone assumption | `source_found` | https://www.jma.go.jp/jma/kishou/know/yougo_hp/toki.html | Japan Standard Time is used as the local civil-time assumption for Japan racing records. | Repo timezone assumption remains `Asia/Tokyo`; needs final operational review against source display conventions. |
| Known exclusions | `source_found` | https://jra.jp/ | Racecards, entries, horse names, jockey names, odds, results, payouts, predictions, tips, and raw source bodies are excluded from this PR. | This PR stores URL-level evidence only. |

#### Racecourse inventory comparison

| Current repo inventory item | Official source item | Comparison | Notes |
| --- | --- | --- | --- |
| Sapporo | Sapporo | match | `source_confirms_inventory` via JRA facilities. |
| Hakodate | Hakodate | match | `source_confirms_inventory` via JRA facilities. |
| Fukushima | Fukushima | match | `source_confirms_inventory` via JRA facilities. |
| Niigata | Niigata | match | `source_confirms_inventory` via JRA facilities. |
| Tokyo | Tokyo | match | `source_confirms_inventory` via JRA facilities. |
| Nakayama | Nakayama | match | `source_confirms_inventory` via JRA facilities. |
| Chukyo | Chukyo | match | `source_confirms_inventory` via JRA facilities. |
| Kyoto | Kyoto | match | `source_confirms_inventory` via JRA facilities. |
| Hanshin | Hanshin | match | `source_confirms_inventory` via JRA facilities. |
| Kokura | Kokura | match | `source_confirms_inventory` via JRA facilities. |

#### Fixture/calendar source section

- Status: `source_found`.
- Official fixture/calendar URL: https://jra.jp/keiba/calendar2026/.
- Evidence meaning: official source for JRA calendar dates and racecourse/date fixture confirmation.
- Limitation: this PR does not validate a parser, does not store source bodies, and does not promote additional JRA records.

#### Gaps still requiring source confirmation

- `source_needs_manual_review`: stable first-race-time extraction path for JRA meeting-level timetable records.
- `source_needs_manual_review`: whether each current generated/candidate JRA date still matches the official calendar at review time.
- `source_needs_manual_review`: source-specific terms review before any live fetch or parser work.

### Japan — NAR

#### Official source evidence

| Evidence area | Status | Official source URL | What the source proves | Notes |
| --- | --- | --- | --- | --- |
| Racing authority / operator | `source_found` | https://www.keiba.go.jp/ | NAR official local-government racing information site. | Link-only source already exists as `japan-nar-home`. |
| Racecourse inventory | `source_confirms_inventory` | https://www.keiba.go.jp/guide/ | NAR guide lists Obihiro, Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Ohi, Kawasaki, Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, and Saga. | Confirms repo NAR racecourse inventory, while Obihiro is cross-listed with Banei. |
| Fixture / calendar source | `source_found` | https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList | NAR Today Race Info is an official meeting/race listing surface for local-government racing. | Needs manual review for safe meeting-only extraction. |
| Meeting date source | `source_found` | https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList | Date-specific official race list pages can confirm whether a NAR racecourse has a meeting on a date. | This PR does not add NAR timetable records. |
| First race time source | `source_needs_manual_review` | https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList | Race list pages may expose race times, but this PR does not verify a stable first-race-time field for all NAR organizers. | Manual review required per organizer/racecourse. |
| Timezone assumption | `source_found` | https://www.jma.go.jp/jma/kishou/know/yougo_hp/toki.html | Japan Standard Time is the local civil-time assumption. | Repo timezone assumption remains `Asia/Tokyo`. |
| Known exclusions | `source_found` | https://www.keiba.go.jp/ | Racecards, entries, horse names, jockey names, odds, results, payouts, predictions, tips, and raw source bodies are excluded from this PR. | This PR stores URL-level evidence only. |

#### Racecourse inventory comparison

| Current repo inventory item | Official source item | Comparison | Notes |
| --- | --- | --- | --- |
| Obihiro | Obihiro | match | `source_confirms_inventory`; cross-listed with Banei and must not be double-counted as separate public coverage. |
| Monbetsu | Monbetsu | match | `source_confirms_inventory` via NAR guide. |
| Morioka | Morioka | match | `source_confirms_inventory` via NAR guide. |
| Mizusawa | Mizusawa | match | `source_confirms_inventory` via NAR guide. |
| Urawa | Urawa | match | `source_confirms_inventory` via NAR guide. |
| Funabashi | Funabashi | match | `source_confirms_inventory` via NAR guide. |
| Ohi | Ohi | match | `source_confirms_inventory` via NAR guide. |
| Kawasaki | Kawasaki | match | `source_confirms_inventory` via NAR guide. |
| Kanazawa | Kanazawa | match | `source_confirms_inventory` via NAR guide. |
| Kasamatsu | Kasamatsu | match | `source_confirms_inventory` via NAR guide. |
| Nagoya | Nagoya | match | `source_confirms_inventory` via NAR guide. |
| Sonoda | Sonoda | match | `source_confirms_inventory` via NAR guide. |
| Himeji | Himeji | match | `source_confirms_inventory` via NAR guide. |
| Kochi | Kochi | match | `source_confirms_inventory` via NAR guide. |
| Saga | Saga | match | `source_confirms_inventory` via NAR guide. |

#### Fixture/calendar source section

- Status: `source_found`.
- Official fixture/calendar URL: https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList.
- Evidence meaning: official NAR date-specific race list surface for meeting-date confirmation.
- Limitation: this PR does not establish all local organizer first-race-time extraction rules.

#### Gaps still requiring source confirmation

- `source_needs_manual_review`: verify whether NAR provides a stable calendar endpoint suitable for all racecourses beyond date-specific race list pages.
- `source_needs_manual_review`: verify racecourse naming normalization for Ohi/Ooi and any English transliteration policy.
- `source_needs_manual_review`: source-specific terms review before parser or live fetch work.

### Japan — Banei

#### Official source evidence

| Evidence area | Status | Official source URL | What the source proves | Notes |
| --- | --- | --- | --- | --- |
| Racing authority / operator | `source_found` | https://www.banei-keiba.or.jp/ | Official Banei Tokachi site. | Link-only source already exists as `japan-banei-home`. |
| Racecourse inventory | `source_confirms_inventory` | https://www.banei-keiba.or.jp/race_schedule.php | Official schedule page identifies Obihiro Racecourse as the Banei venue. | Confirms repo Banei inventory has one racecourse, Obihiro. |
| Fixture / calendar source | `source_found` | https://www.banei-keiba.or.jp/race_schedule.php | Official Banei schedule page includes daily schedule, monthly schedule, annual schedule, and race times. | Link-only source already exists as `japan-banei-monthly-schedule`. |
| Meeting date source | `source_found` | https://www.banei-keiba.or.jp/race_schedule.php | Monthly/annual schedule surfaces identify Banei meeting dates. | This PR does not add Banei timetable records. |
| First race time source | `source_found` | https://www.banei-keiba.or.jp/race_schedule.php | Official schedule page displays first race time (`1R`) for listed meeting dates. | Manual review still required before parsing; evidence only. |
| Timezone assumption | `source_found` | https://www.jma.go.jp/jma/kishou/know/yougo_hp/toki.html | Japan Standard Time is the local civil-time assumption. | Repo timezone assumption remains `Asia/Tokyo`. |
| Known exclusions | `source_found` | https://www.banei-keiba.or.jp/ | Racecards, entries, horse names, jockey names, odds, results, payouts, predictions, tips, and raw source bodies are excluded from this PR. | This PR stores URL-level evidence only. |

#### Racecourse inventory comparison

| Current repo inventory item | Official source item | Comparison | Notes |
| --- | --- | --- | --- |
| Obihiro | Obihiro Racecourse | match | `source_confirms_inventory`; also appears in NAR guide, so cross-listing needs source-aware handling. |

#### Fixture/calendar source section

- Status: `source_found`.
- Official fixture/calendar URL: https://www.banei-keiba.or.jp/race_schedule.php.
- Evidence meaning: official Banei schedule source for meeting dates and first race times.
- Limitation: this PR does not create a source page parser or new candidate timetable records.

#### Gaps still requiring source confirmation

- `source_needs_manual_review`: verify stable monthly/yearly schedule URL behavior and month parameters before parser design.
- `source_needs_manual_review`: decide whether Banei should be modeled independently or as cross-listed NAR inventory for reporting.
- `source_needs_manual_review`: source-specific terms review before parser or live fetch work.

## Hong Kong

Current repo inventory source checked: `data/static/country-racing-inventory.json`, country `hong-kong`.

### Official source evidence

| Evidence area | Status | Official source URL | What the source proves | Notes |
| --- | --- | --- | --- | --- |
| Racing authority / operator | `source_found` | https://www.hkjc.com/ | HKJC official site. | Link-only source already exists as `hong-kong-hkjc-home`. |
| Racecourse inventory | `source_confirms_inventory` | https://corporate.hkjc.com/corporate/english/who-we-are/racecourse-entertainment.aspx | HKJC corporate source identifies the Club's two Hong Kong racecourses as Sha Tin and Happy Valley. | Same source mentions Conghua in Guangzhou from 2026/27; keep as known exclusion/unresolved for this Hong Kong inventory review. |
| Fixture / calendar source | `source_found` | https://racing.hkjc.com/en-us/local/information/fixture | HKJC fixture page is an official local racing fixture source. | Existing repo source is link-only. |
| Meeting date source | `source_found` | https://racing.hkjc.com/en-us/local/information/fixture | Fixture page confirms date/racecourse meeting rows for Hong Kong local racing. | This PR does not replace public overlay data. |
| First race time source | `source_needs_manual_review` | https://racing.hkjc.com/en-us/local/information/fixture | Fixture page and raceday pages may expose first race time, but this PR does not confirm a safe stable extraction path. | HKJC general visitor pages list typical race start times, not a substitute for meeting-specific first race time. |
| Timezone assumption | `source_found` | https://www.hko.gov.hk/en/gts/time/time-service.htm | Hong Kong Observatory official time service supports the local civil-time assumption. | Repo timezone assumption remains `Asia/Hong_Kong`. |
| Known exclusions | `source_found` | https://www.hkjc.com/ | Racecards, entries, odds, results, payouts, predictions, tips, and raw source bodies are excluded from this PR. | This PR stores URL-level evidence only. |

### Racecourse inventory comparison

| Current repo inventory item | Official source item | Comparison | Notes |
| --- | --- | --- | --- |
| Sha Tin | Sha Tin Racecourse | match | `source_confirms_inventory` for current Hong Kong racecourse inventory. |
| Happy Valley | Happy Valley Racecourse | match | `source_confirms_inventory` for current Hong Kong racecourse inventory. |
| None | Conghua Racecourse, Guangzhou | unresolved | Official HKJC corporate page says fans can enjoy racing at Conghua from the 2026/27 season; it is outside the current Hong Kong two-racecourse inventory and needs separate jurisdiction/coverage policy review. |

### Fixture/calendar source section

- Status: `source_found`.
- Official fixture/calendar URL: https://racing.hkjc.com/en-us/local/information/fixture.
- Evidence meaning: official HKJC fixture source for Hong Kong local race dates and racecourse assignments.
- Limitation: this PR does not parse the fixture page and does not promote additional records.

### Gaps still requiring source confirmation

- `source_needs_manual_review`: meeting-specific first-race-time source and stable extraction path.
- `source_needs_manual_review`: policy for Conghua in 2026/27 and whether it belongs in Hong Kong inventory, China inventory, or a separately modeled HKJC external venue scope.
- `source_needs_manual_review`: source-specific terms review before parser or live fetch work.

## UAE

Current repo inventory source checked: `data/static/country-racing-inventory.json`, country `united-arab-emirates`. UAE receives special attention because the current repo inventory has three racecourses and official Emirates Racing sources show additional racecourses. Do not assume the current three-racecourse UAE inventory is complete.

### Official source evidence

| Evidence area | Status | Official source URL | What the source proves | Notes |
| --- | --- | --- | --- | --- |
| Racing authority / operator | `source_found` | https://emiratesracing.com/ | Emirates Racing Authority / Emirates Racing official site for UAE racing. | Link-only source already exists as `uae-era-home`. |
| Racecourse inventory | `source_conflicts_with_inventory` | https://emiratesracing.com/about-us/racing-in-the-uae | Official Emirates Racing source says the current UAE season is conducted at five venues: Meydan, Jebel Ali, Abu Dhabi, Sharjah, and Al Ain. | Repo currently has Meydan, Al Ain, and Abu Dhabi Turf Club only; Jebel Ali and Sharjah are missing. |
| Racecourse inventory | `source_conflicts_with_inventory` | https://emiratesracing.com/news/the-emirates-racing-authority-era-has-announced-the-official-schedule-for-the-2025-2026-uae-horse-racing-season-which-is-set-to-begin-on-25th-october-2025-at-the-abu-dhabi-turf-club | Official 2025-2026 schedule release lists 64 meetings across five major racecourses: Abu Dhabi Turf Club, Al Ain Racecourse, Jebel Ali Racecourse, Sharjah Racecourse, and Meydan Racecourse. | Confirms missing repo inventory items and meeting counts by racecourse. |
| Fixture / calendar source | `source_found` | https://emiratesracing.com/season-calendar/current-season | Emirates Racing current-season calendar is the official UAE fixture/calendar source candidate. | Existing repo source is link-only. |
| Meeting date source | `source_found` | https://emiratesracing.com/season-calendar/current-season | Current-season calendar confirms UAE meeting dates and venues. | Do not add candidate timetable records in this PR. |
| First race time source | `source_needs_manual_review` | https://emiratesracing.com/season-calendar/current-season | Calendar pages may link to meeting details, but this PR does not confirm a stable first-race-time field for safe extraction. | Existing UAE records are out-of-window seed artifacts only. |
| Timezone assumption | `source_found` | https://u.ae/en/information-and-services/public-holidays-and-religious-affairs/time | UAE official government portal supports UAE local time assumption. | Repo timezone assumption remains `Asia/Dubai`. |
| Known exclusions | `source_found` | https://emiratesracing.com/ | Racecards, entries, horse names, jockey names, odds, results, payouts, predictions, tips, and raw source bodies are excluded from this PR. | No public overlay replacement and no candidate records in this PR. |

### Racecourse inventory comparison

| Current repo inventory item | Official source item | Comparison | Notes |
| --- | --- | --- | --- |
| Meydan | Meydan Racecourse | match | `source_confirms_inventory`; present in repo and official UAE source. |
| Al Ain | Al Ain Racecourse | match | `source_confirms_inventory`; present in repo and official UAE source. |
| Abu Dhabi Turf Club | Abu Dhabi Turf Club / Abu Dhabi | match | `source_confirms_inventory`; present in repo and official UAE source, naming needs normalization review. |
| None | Jebel Ali Racecourse | missing | `source_conflicts_with_inventory`; official UAE sources list Jebel Ali but repo inventory does not. Must be corrected before further expansion. |
| None | Sharjah Racecourse / Sharjah Longines Racecourse | missing | `source_conflicts_with_inventory`; official UAE sources list Sharjah but repo inventory does not. Must be corrected before further expansion. |

### Fixture/calendar source section

- Status: `source_found`.
- Official fixture/calendar URL: https://emiratesracing.com/season-calendar/current-season.
- Evidence meaning: official UAE current-season fixture/calendar source candidate for meeting dates and venues.
- Limitation: this PR does not add candidate timetable records, does not add missing UAE racecourses to repo inventory, and does not replace the public overlay.

### Gaps still requiring source confirmation

- `source_conflicts_with_inventory`: repo UAE racecourse inventory is missing Jebel Ali Racecourse and Sharjah Racecourse / Sharjah Longines Racecourse.
- `source_needs_manual_review`: normalize Abu Dhabi Turf Club vs Abu Dhabi Equestrian Club naming across official pages and existing repo IDs.
- `source_needs_manual_review`: stable first-race-time source for UAE meetings.
- `source_needs_manual_review`: source-specific terms review before parser or live fetch work.
