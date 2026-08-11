# 03 - Turkey timetable source test

Status: current programme evidence verified; bounded current adapter next
Original checked date: 2026-06-10
Route revalidation history: 2026-08-11, corrected by direct programme evidence on 2026-08-12
Authority: Türkiye Jokey Kulübü
Technical capability rank: A+
Public ceiling: A

## Current decision

The original ten-racecourse source test remains the historical capability basis. Current implementation must use the route topology verified on 2026-08-12.

- Annual programme: verified.
- Filtered annual data: verified.
- Daily landing route: `/TR/YarisSever/Info/Page/GunlukYarisProgrami`.
- The verified daily landing body emits same-day, same-city venue-detail links under `/TR/YarisSever/Info/Sehir/GunlukYarisProgrami`.
- A new adapter may follow an `Info/Sehir` venue-detail link **only when that exact link is discovered from the verified current `Info/Page` landing response for the requested city/date**. Do not hard-code the historical venue-detail route as the adapter entrypoint.
- `/TR/YarisSever/Info/Data/GunlukYarisProgrami` is present as a current data hint, but the verified probe did not obtain the complete Race 1-N schedule from that route; it is not the current schedule authority for implementation.
- Technical capability remains A+.
- Public output remains capped at A.

Latest implementation evidence: `revalidation-2026-08-12.json`.

The prior `revalidation-2026-08-11.json` is retained as historical evidence. Its 7/8 annual-observation row counts must not be interpreted as current daily race counts.

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

These totals are historical source-test evidence and are not a current-window publication set.

## Official source workflow

Annual programme:

https://www.tjk.org/TR/YarisSever/Query/Page/YillikYarisProgramiCoklu

Filtered annual data:

https://www.tjk.org/TR/YarisSever/Query/Data/YillikYarisProgramiCoklu

Current daily landing:

https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami

Current daily data hint:

https://www.tjk.org/TR/YarisSever/Info/Data/GunlukYarisProgrami

Page-discovered venue-detail path:

`/TR/YarisSever/Info/Sehir/GunlukYarisProgrami`

Daily parameters observed:

- SehirId
- QueryParameter_Tarih
- SehirAdi
- Era

## Direct 2026-08-11 programme evidence captured on 2026-08-12

The read-only GitHub Actions probe started from the current `Info/Page` landing route and followed only the same-day, same-city venue-detail links present in that response.

Verified schedules:

- Ankara (`SehirId=5`): 9 races, 14:00 / 14:30 / 15:00 / 15:30 / 16:00 / 16:30 / 17:00 / 17:30 / 18:00.
- Kocaeli (`SehirId=9`): 9 races, 17:15 / 17:45 / 18:30 / 19:00 / 19:30 / 20:00 / 20:30 / 21:00 / 21:30.

The probe retained only safe verification metadata and schedule fields. Raw HTML/body content was not retained or committed. The exact passing run and artifact provenance are recorded in `revalidation-2026-08-12.json`.

This direct capture corrects the prior assumption that the 2026-08-11 annual-observation row counts (Ankara 7, Kocaeli 8) were current daily race counts.

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

If the current landing cannot expose a same-day, same-city venue-detail link, or the discovered detail cannot reproduce a continuous Race 1-N post-time schedule, downgrade the affected candidate to the highest fully supported rank. Do not infer missing times or treat annual row counts as post-time evidence.

## Historical route note

The 2026-08-11 revalidation correctly identified `Info/Page` as the current landing route but treated `Info/Sehir` as fully superseded. Direct 2026-08-12 evidence refines that conclusion: `Info/Sehir` remains an active venue-detail route when the current `Info/Page` landing itself supplies the exact same-day, same-city link.

This does **not** authorize hard-coding old `Info/Sehir` URLs. Current discovery must start from `Info/Page`.

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

Current programme verification does not approve Canonical writes, public projection, automatic approval, automatic merge, or deployment.
