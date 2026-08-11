# 03 - Turkey timetable source test

Status: revalidated for implementation
Original checked date: 2026-06-10
Current route revalidation: 2026-08-11
Authority: Türkiye Jokey Kulübü
Technical capability rank: A+
Public ceiling: A

## Current decision

The original ten-racecourse source test remains the historical capability basis, but the daily programme route changed before implementation.

- Annual programme: still verified.
- Filtered annual data: still verified.
- Daily programme: use `/TR/YarisSever/Info/Page/GunlukYarisProgrami`.
- The previously recorded `/TR/YarisSever/Info/Sehir/GunlukYarisProgrami` route is superseded and must not be used by a new adapter.
- Technical capability remains A+.
- Public output remains capped at A.

See `revalidation-2026-08-11.json` for the current route evidence and explicit limitations.

## Historical verified totals

The 2026-06-10 source test covered:

- Racecourses: 10
- Meetings: 12
- Races: 96
- Post times: 96
- Distances: 96
- Surfaces: 96

## Racecourse results

| Racecourse | Meetings | Races | Times | Distances | Surfaces | Rank |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Adana | 1 | 7 | 7 | 7 | 7 | A+ |
| Ankara | 2 | 19 | 19 | 19 | 19 | A+ |
| Antalya | 1 | 9 | 9 | 9 | 9 | A+ |
| Bursa | 1 | 9 | 9 | 9 | 9 | A+ |
| Diyarbakır | 2 | 12 | 12 | 12 | 12 | A+ |
| Elazığ | 1 | 8 | 8 | 8 | 8 | A+ |
| İstanbul | 1 | 9 | 9 | 9 | 9 | A+ |
| İzmir | 1 | 7 | 7 | 7 | 7 | A+ |
| Kocaeli | 1 | 8 | 8 | 8 | 8 | A+ |
| Şanlıurfa | 1 | 8 | 8 | 8 | 8 | A+ |

## Official source workflow

Annual programme:

https://www.tjk.org/TR/YarisSever/Query/Page/YillikYarisProgramiCoklu

Filtered annual data:

https://www.tjk.org/TR/YarisSever/Query/Data/YillikYarisProgramiCoklu

Current daily race programme:

https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami

Daily parameters:

- SehirId
- QueryParameter_Tarih
- SehirAdi

Superseded daily route:

https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami

## Current 2026-08-11 observation

The official annual programme exposes Ankara and Kocaeli for 2026-08-11 and resolves their daily programme links to the current `Info/Page` route with the same city/date parameters.

The current-day parameterized daily body was not directly captured by the external revalidation fetch, so this revalidation does **not** claim a fresh 2026-08-11 Race 1-N body capture. Recent official `Info/Page` daily pages still expose complete Race 1-N post times plus distance/surface fields, which preserves the historical A+ technical classification for bounded prototype work.

## A+ fields

Technical source capability:

- race_number
- post_time_local
- distance_m
- surface
- official_source_url

Optional when available:

- race_name
- race_condition

Public output remains capped at A. A+ source capability must not be interpreted as permission to publish additional racecard fields.

## Fallback

If the current daily programme cannot reproduce complete Race 1-N post times, downgrade the affected candidate to the highest fully supported rank. Do not infer missing times or treat annual race rows as post-time evidence.

## Superseded results and assumptions

Historical source-test classifications remain evidence, but these implementation assumptions are superseded:

- the 2026-06-10 conclusion that `Info/Page` was the incorrect endpoint;
- the recorded `Info/Sehir/GunlukYarisProgrami` adapter route.

The current official annual programme now links to `Info/Page/GunlukYarisProgrami`.

## Public-safe boundary

Do not publish or retain in public output:

- horses or runners
- jockeys
- trainers
- weights
- odds
- results
- payouts
- predictions
- full racecard text
- raw HTML or raw source bodies
- direct stream URLs

Source revalidation does not approve Canonical writes, public projection, automatic approval, automatic merge, or deployment.
