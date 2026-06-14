# Timetable source tests

This directory stores public-safe local terminal test results for Where Horses Run timetable source research.

Raw official HTML must remain under .whr-local-source-tests/ and must not be committed.

## Folder naming

Format:

NN-country-slug/

## Public-safe rule

Do not commit:

- raw official HTML
- full racecard text
- horses or runners
- jockeys
- trainers
- weights
- odds
- results
- payouts
- predictions or tips

Public-safe test records may include:

- official source URLs
- HTTP status
- source structure
- tested racecourses
- tested race counts
- obtainable timetable fields
- technical capability rank
- fallback rank
- source limitations

## Current country test index

| No. | Country | Status | Current finding |
| ---: | --- | --- | --- |
| 01 | UAE | Complete | ERA official sources verified across Meydan, Al Ain, Jebel Ali, Sharjah and Abu Dhabi Turf Club; 35 races confirmed; technical capability A+. |
| 02 | South Korea | Complete | KRA official sources verified across Seoul, Busan-Gyeongnam and Jeju; 6 meetings and 51 races confirmed; technical capability A+; fallback rank A. |
| 03 | Turkey | Complete | TJK official sources verified across 10 domestic racecourses, 12 meetings and 96 races; technical capability A+; fallback rank A. |
| 04 | Morocco | Pending | A+ investigation paused; FARAS and SOREC infrastructure confirmed, but no stable official meeting-date or Race 1-N source confirmed; no technical rank assigned. |
| 05 | Chile | Complete | Teletrak calendar and official programme PDFs verified across Club Hípico de Concepción, Valparaíso Sporting Club, Club Hípico de Santiago and Hipódromo Chile; 4 meetings and 62 races confirmed; technical capability A+. |

## Country tests

| No. | Country | Status | Technical rank | Primary source model | Tested scope |
| ---: | --- | --- | --- | --- | --- |
| 06 | Peru | Complete | A+ | Hipódromo de Monterrico official website + official JSON API | 3 meetings / 27 races |
| 07 | Mexico | Pending | Pending | Hipódromo de las Américas official website candidate | DNS/reachability failure; no programme source confirmed |
| 08 | Brazil | Complete | A+ | Multi-source official HTML/PDF by racecourse and racing system | 4 timed programme samples / 39 races; 1 untimed Arabian supplementary race; Tarumã pending |
| 09 | Bahrain | Complete | A+ | Bahrain Turf Club official per-race HTML pages | 3 meetings / 25 races; post times and distances 25/25; initial public ceiling A |
