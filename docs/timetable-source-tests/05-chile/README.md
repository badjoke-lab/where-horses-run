# 05 - Chile timetable source test

Status: complete
Checked date: 2026-06-10
Technical capability rank: A+
Fallback rank: A

## Final decision

Chile official timetable data is obtainable at A+ capability.

Verified racecourses:

- Club Hípico de Concepción
- Valparaíso Sporting Club
- Club Hípico de Santiago
- Hipódromo Chile

## Verified totals

- Racecourses tested: 4
- Meetings tested: 4
- Races detected: 62
- A+ meetings: 4/4

## Source workflow

1. Use Teletrak calendar AJAX to obtain meeting dates, start times and programme PDF links.
2. Exclude Simulcasting because it is not a Chilean domestic racecourse.
3. Download the official programme PDFs linked from Teletrak.
4. Extract Race 1-N, post time and distance from the official programme PDFs.

Calendar endpoint:

```text
https://teletrak.cl/wp-admin/admin-ajax.php
```

Calendar action:

```text
get_hipodromo_races_detailed
```

## Tested meetings

- 2026-06-09 Club Hípico de Concepción: 9 races, 9 post times, 9 distances, rank A+
- 2026-06-10 Valparaíso Sporting Club: 14 races, 14 post times, 14 distances, rank A+
- 2026-06-05 Club Hípico de Santiago: 18 races, 18 post times, 18 distances, rank A+
- 2026-06-06 Hipódromo Chile: 21 races, 21 post times, 21 distances, rank A+

## A+ fields confirmed

- racecourse
- meeting_date
- race_number
- post_time_local
- distance_m
- official_source_url

Optional fields:

- race_name when present in the programme PDF
- surface when present in the programme PDF
- course_label when present in the programme PDF

## Public-safe boundary

Do not commit raw PDFs, raw extracted programme text, horses, runners, jockeys, trainers, odds, results, payouts, predictions, tips or full racecard text.

Raw PDFs and text extraction outputs remain under .whr-local-source-tests/.
