# Chile

## Metadata

| Field | Value |
| --- | --- |
| Country | Chile |
| Slug | chile |
| Note status | draft |
| Evidence cutoff | 2026-06-10 |
| Source-test status | Complete |
| Technical rank | A+ |
| Public display ceiling | A |
| Source-test directory | `docs/timetable-source-tests/05-chile/` |
| Revalidation trigger | Before final page publication or after a Teletrak or programme-PDF route change |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed source test
- `[OBSERVED]`: seen in the four tested meetings
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during final page production

## Page-ready verified facts

- [VERIFIED] The reviewed Chile source test covered four domestic racecourses.
- [VERIFIED] All four tested meetings supported technical A+ timetable extraction.
- [VERIFIED] The four samples contained 62 races.
- [VERIFIED] Every sampled race had a contiguous race number, post time and distance.
- [VERIFIED] The reviewed workflow used the Teletrak calendar followed by official programme PDFs.
- [VERIFIED] Simulcasting was excluded because it is not a Chilean domestic racecourse.

## Racing structure

- [VERIFIED] The reviewed timetable system covers several separately named racecourses.
- [OBSERVED] Meeting discovery and detailed programme publication are split between Teletrak and racecourse-specific PDF sources.
- [INFERRED] Chile has a distributed racecourse structure with a shared public discovery route.
- [NEEDS_RESEARCH] Confirm the current regulatory body and the ownership or operating relationship of each racecourse.

## Governing and organising bodies

- [VERIFIED] The reviewed source test did not establish one national organiser for all four racecourses.
- [VERIFIED] Teletrak functions as the tested calendar and programme-distribution route, not as proof of racecourse ownership or regulation.
- [NEEDS_RESEARCH] Identify the current regulator, each racecourse operator and any national coordinating organisation.

## Racecourses observed

- [VERIFIED] Club Hípico de Concepción
- [VERIFIED] Valparaíso Sporting Club
- [VERIFIED] Club Hípico de Santiago
- [VERIFIED] Hipódromo Chile

These were the four racecourses covered by the completed source test. The final
page should separately confirm whether this is the complete current national
racecourse list.

## Racing codes observed

- [OBSERVED] The programme sources exposed race structure, times, distances and some surface labels.
- [NEEDS_RESEARCH] Confirm the racing codes conducted at each racecourse.
- [NEEDS_RESEARCH] Confirm whether any Chilean racing activity falls outside the four tested racecourses.

## Seasonality and meeting pattern

- [OBSERVED] The tested meetings occurred from 2026-06-05 through 2026-06-10.
- [OBSERVED] The samples contained 9, 14, 18 and 21 races.
- [VERIFIED] These four samples do not establish normal meeting size.
- [NEEDS_RESEARCH] Confirm the annual calendar, racecourse rotation, seasonal breaks and normal weekly pattern.

## How racing information is distributed

- [VERIFIED] Teletrak exposes a calendar route with meeting dates, start-time information and programme links.
- [VERIFIED] Detailed Race 1-N information was obtained from official programme PDFs linked through that route.
- [OBSERVED] Programme files were hosted by different racecourse or racing-industry domains.
- [INFERRED] Users may need both the shared calendar route and the relevant racecourse programme source.

## Programme and racecard format

- [VERIFIED] Confirmed fields include racecourse, meeting date, race number, local post time, distance and official source URL.
- [OBSERVED] Race names were present in some programme formats and absent in others.
- [OBSERVED] Surface values were present for some racecourses and absent for others.
- [VERIFIED] Race name, surface and course label must remain optional fields.
- [VERIFIED] Initial public display remains at or below rank A pending a separate A+ publication review.

## Current source landscape

### Current

- [VERIFIED] Teletrak calendar AJAX route
- [VERIFIED] Official programme PDFs linked from the calendar
- [VERIFIED] Racecourse-specific programme hosting

### Legacy or inactive

- [NEEDS_RESEARCH] No legacy-source conclusion was established by this source test.

### Supplementary

- [VERIFIED] Teletrak maps calendar entries to the four tested domestic racecourses.
- [VERIFIED] Simulcasting entries must remain excluded from domestic racecourse coverage.

## Operational observations

- [OBSERVED] Programme formats differ by racecourse.
- [OBSERVED] Race-name and surface availability varied while post times and distances remained complete in the tested samples.
- [INFERRED] A Chile collector should preserve source-specific parsing rather than force every programme into one identical format.

## Limitations and cautions

- [VERIFIED] Four tested meetings do not establish annual national coverage.
- [VERIFIED] Teletrak must not be described as the organiser of all Chilean racing solely because it distributes calendar links.
- [VERIFIED] Simulcasting is not a domestic racecourse.
- [VERIFIED] Optional fields must not be assumed across every racecourse.
- [VERIFIED] Technical A+ capability does not justify reproducing full programme content.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] The four tested racecourses are the complete active national list.
- [NEEDS_RESEARCH] Chilean meetings normally contain any fixed number of races.
- [NEEDS_RESEARCH] Teletrak governs or operates the four racecourses.
- [NEEDS_RESEARCH] Every racecourse uses the same programme format.
- [INFERRED] Chile uses a shared-discovery and racecourse-specific-detail model, but its institutional structure requires confirmation.

## Fresh research required

- [NEEDS_RESEARCH] national regulatory and organising structure
- [NEEDS_RESEARCH] current operators of the four tested racecourses
- [NEEDS_RESEARCH] complete active racecourse list
- [NEEDS_RESEARCH] racing codes and surface context
- [NEEDS_RESEARCH] annual calendar and meeting totals
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races
- [NEEDS_RESEARCH] breeding and ownership context
- [NEEDS_RESEARCH] cultural and spectator context
- [NEEDS_RESEARCH] current official source links

## Source-test references

- `docs/timetable-source-tests/05-chile/README.md`
- `docs/timetable-source-tests/05-chile/final-summary.json`
- `docs/timetable-source-tests/05-chile/chile-aplus-summary.json`
- `docs/timetable-source-tests/05-chile/chile-aplus-meeting-summary.tsv`
- `docs/timetable-source-tests/05-chile/chile-aplus-race-summary.tsv`
- `docs/timetable-source-tests/05-chile/teletrak-hipodromo-map.tsv`
- `docs/timetable-source-tests/05-chile/teletrak-program-pdf-candidates.tsv`

## Editorial handoff

When the final country page is written:

1. confirm the current regulator and racecourse operators
2. recheck the Teletrak calendar and all four programme routes
3. confirm whether additional active racecourses belong in scope
4. preserve source-specific programme differences
5. keep Simulcasting outside domestic racecourse coverage
6. keep the initial public timetable display at or below rank A
7. write separate natural English and Japanese copy
8. exclude participant, betting, result, raw PDF and direct-stream data
