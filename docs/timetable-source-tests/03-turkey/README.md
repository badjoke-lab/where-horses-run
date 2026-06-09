# 03 - Turkey timetable source test

Status: complete
Checked date: 2026-06-10
Authority: Türkiye Jokey Kulübü
Technical capability rank: A+
Fallback rank: A

## Final decision

All ten domestic TJK racecourses support A+ timetable extraction.

## Verified totals

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

Daily race programme:

https://www.tjk.org/TR/YarisSever/Info/Sehir/GunlukYarisProgrami

Daily parameters:

- SehirId
- QueryParameter_Tarih
- SehirAdi

## A+ fields

- race_number
- post_time_local
- distance_m
- surface
- official_source_url

Optional when available:

- race_name
- race_condition

## Fallback

If distance and surface become unavailable, complete Race 1-N
post times remain available. The fallback rank is A.

## Superseded results

- C results produced by the incorrect Info/Page endpoint
- C results produced by requiring a visible date string
- Diyarbakır date-by-date scan

## Public-safe boundary

Do not publish or retain:

- horses or runners
- jockeys
- trainers
- weights
- odds
- results
- payouts
- full racecard text
- raw HTML

Raw HTML remains only in .whr-local-source-tests/.
