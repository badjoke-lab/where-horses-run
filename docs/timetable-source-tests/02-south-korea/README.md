# 02 - South Korea timetable source test

Status: complete
Checked date: 2026-06-09
Authority: Korea Racing Authority
Technical capability rank: A+
Fallback rank: A

## Final decision

South Korea official timetable data is obtainable at A+ capability.

Tested racecourses:

- Seoul
- Busan-Gyeongnam
- Jeju

## Verified totals

- Meetings tested: 6
- Valid races: 51
- Post times: 51/51
- Distances: 51/51
- Race descriptions: 51/51

## Official workflow

Meeting selection:

POST https://todayrace.kra.co.kr/main.do

Parameters:

- rcDate
- meets

Meet codes:

- 1 = Seoul
- 2 = Jeju
- 3 = Busan-Gyeongnam

KRA-generated race payload:

- meet
- rcDate
- rcNo

Additional official sources:

- https://todayrace.kra.co.kr/racing/info/selectSimpleInfoList.do
- https://todayrace.kra.co.kr/racing/info/selectInfoList.do

## A+ fields

- race_number
- post_time_local
- distance_m
- race_description
- official_source_url

Optional when available:

- race_name
- surface
- course_label

## Fallback

If A+ programme-summary fields become unavailable, the complete
Race 1-N timetable and all post times remain available.

Therefore the fallback rank is A.

## Tested meetings

- 20260605 Busan-Gyeongnam: 8 races, 8 times, 8 distances, A+
- 20260605 Jeju: 9 races, 9 times, 9 distances, A+
- 20260606 Seoul: 10 races, 10 times, 10 distances, A+
- 20260606 Jeju: 7 races, 7 times, 7 distances, A+
- 20260607 Seoul: 10 races, 10 times, 10 distances, A+
- 20260607 Busan-Gyeongnam: 7 races, 7 times, 7 distances, A+

## Detail endpoint limitation

Historical detail requests may return a common 1297-byte shell.
This does not block A+ because the official selected main, simple
and info pages already provide complete times and distances.

## Superseded results

- korea-nationwide-exact-summary.json C classification
- korea-generated-payload-summary.json A+ failure

## Public-safe boundary

Do not publish or retain:

- horses
- runners
- jockeys
- trainers
- weights
- odds
- results
- payouts
- full racecard text
- raw HTML

Raw HTML remains only in .whr-local-source-tests/.
