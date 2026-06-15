# Bahrain timetable source test

Status: Complete
Final technical rank: A+
Initial public display ceiling: A
Primary official source: Bahrain Turf Club official racecard pages

## Result

The Bahrain Turf Club official racecard system provides stable date-and-race URLs.

Three meetings containing 25 races were tested. Every meeting exposed a contiguous sequence beginning with Race 1, together with a post time and distance for every confirmed race.

Race names, race-specific surface fields and course labels were not reliably confirmed.

## Tested meetings

| Date | Races | First post | Last post | Post times | Distances | Technical rank |
| --- | ---: | --- | --- | ---: | ---: | --- |
| 2026-02-12 | 8 | 17:30 | 21:00 | 8/8 | 8/8 | A+ |
| 2026-03-13 | 8 | 20:15 | 23:45 | 8/8 | 8/8 | A+ |
| 2026-04-24 | 9 | 16:00 | 20:00 | 9/9 | 9/9 | A+ |

## Source model

Observed official race URL pattern:

`https://bahrainturfclub.com/racecard/{YYYY-MM-DD}/{race_number}/entries`

The tested pages supplied:

- race number
- local post time
- distance
- stable official race URL

The pages also contain entries and other racecard material. Those fields are outside the Where Horses Run publication boundary.

## Field availability

| Meetings | Races | Race labels | Post times | Race names | Distances | Surfaces | Course labels |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3 | 25 | 25/25 | 25/25 | 0/25 | 25/25 | 0/25 | 0/25 |

The word `TURF` was visible in the tested pages but was not confirmed as a race-specific field adjacent to each race's distance metadata. It is therefore not counted as an obtainable surface field.

A broad text-window detector also found many possible text segments before each distance field. The detector was too imprecise to establish race-name availability, so race names remain unconfirmed.

## Technical rank

The source qualifies for technical rank A+ because it provides the complete per-race timetable plus an additional common programme-summary field, distance, for every tested race.

## Publication boundary

The initial public display ceiling remains A.

Until a separate Bahrain A+ publication review is completed, public pages should display only race labels and post times.

Do not publish runners, horse names, jockeys, trainers, owners, weights, ratings, draws, odds, results, payouts, betting information, full racecard contents, raw HTML or copied official page text.

## Local-only raw files

Downloaded HTML and exploratory extraction files remain under `.whr-local-source-tests/09-bahrain/` and must not be committed.
