# South Korea

## Metadata

| Field | Value |
| --- | --- |
| Country | South Korea |
| Slug | south-korea |
| Note status | reviewed |
| Evidence cutoff | 2026-06-09 |
| Source-test status | Complete |
| Technical rank | A+ |
| Public display ceiling | A |
| Source-test directory | `docs/timetable-source-tests/02-south-korea/` |
| Revalidation trigger | Before final page publication or after a material KRA page or endpoint change |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed KRA source test
- `[OBSERVED]`: seen in the six tested meetings
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during final page production

## Page-ready verified facts

- [VERIFIED] Korea Racing Authority is the official authority used by the reviewed timetable source.
- [VERIFIED] The reviewed source test covered Seoul, Busan-Gyeongnam and Jeju.
- [VERIFIED] Official KRA timetable data was obtainable at technical A+ capability.
- [VERIFIED] Six meetings and 51 races were tested.
- [VERIFIED] All 51 tested races supplied post times, distances and race descriptions.
- [VERIFIED] If A+ programme-summary fields become unavailable, the reviewed source still supports a complete Race 1-N timetable at rank A.

## Racing structure

- [VERIFIED] The three reviewed racecourses are exposed through a common KRA information system.
- [INFERRED] The public timetable information model is centralised around KRA rather than split among unrelated racecourse websites.
- [NEEDS_RESEARCH] Confirm how national regulation, racecourse operation and the different racing forms at the three venues should be described.

## Governing and organising bodies

- [VERIFIED] Korea Racing Authority is the authority and official public information provider identified in the reviewed source test.
- [NEEDS_RESEARCH] Confirm the precise current statutory and operational description suitable for the final page.

## Racecourses observed

- [VERIFIED] Seoul
- [VERIFIED] Busan-Gyeongnam
- [VERIFIED] Jeju

The reviewed source test covered these three venues. A final page should still
confirm whether any additional active racing venue or separately administered
racing form belongs in national scope.

## Racing codes observed

- [OBSERVED] KRA uses separate meet codes for Seoul, Jeju and Busan-Gyeongnam.
- [NEEDS_RESEARCH] Confirm the appropriate racing-code description for each venue and avoid treating all three as identical without evidence.

## Seasonality and meeting pattern

- [OBSERVED] The tested meetings occurred from 2026-06-05 through 2026-06-07.
- [OBSERVED] The six samples contained between seven and ten races.
- [VERIFIED] These sample totals describe only the tested meetings.
- [NEEDS_RESEARCH] Confirm the annual racing calendar, seasonal breaks, normal weekly pattern and venue-specific meeting cycles.

## How racing information is distributed

- [VERIFIED] KRA provides a meeting-selection workflow through its official race-day pages.
- [VERIFIED] Meeting selection uses a date and meet code.
- [VERIFIED] Separate official simple-information and information-list routes support the reviewed data.
- [INFERRED] Users can follow one KRA information system while selecting the relevant venue and date.

## Programme and racecard format

- [VERIFIED] The reviewed A+ fields include race number, local post time, distance, race description and official source URL.
- [VERIFIED] Race name, surface and course label are optional rather than universally confirmed fields.
- [OBSERVED] All 51 sampled races had post time, distance and description values.
- [VERIFIED] The public display ceiling remains A for the initial implementation even though the technical source capability is A+.

## Current source landscape

### Current

- [VERIFIED] KRA selected main race-day page
- [VERIFIED] KRA simple-information route
- [VERIFIED] KRA information-list route

### Legacy or superseded project findings

- [VERIFIED] Earlier C classification and an earlier generated-payload A+ failure were superseded by the completed source test.

### Supplementary

- [VERIFIED] KRA-generated meeting payloads use meet, date and race-number fields.

## Operational observations

- [OBSERVED] Meet code 1 represented Seoul, 2 represented Jeju and 3 represented Busan-Gyeongnam in the reviewed workflow.
- [OBSERVED] Some historical detail requests returned a common small shell page.
- [VERIFIED] That historical detail limitation did not block A+ extraction because the selected main, simple and information pages supplied the required fields.

## Limitations and cautions

- [VERIFIED] Six tested meetings do not establish the normal race count for every KRA meeting.
- [VERIFIED] The source test does not by itself establish complete annual calendar coverage.
- [VERIFIED] Optional race names, surface values and course labels must not be assumed to exist for every race.
- [VERIFIED] Technical A+ capability is separate from the initial public display ceiling of A.
- [OBSERVED] Historical detail-page behaviour may differ from current selected race-day pages.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] South Korea normally stages a fixed number of races per meeting.
- [NEEDS_RESEARCH] The six June samples represent the full annual meeting pattern.
- [NEEDS_RESEARCH] Seoul, Busan-Gyeongnam and Jeju all use the same racing code and operational model.
- [NEEDS_RESEARCH] The reviewed KRA routes provide complete future nationwide calendar coverage without additional calendar research.
- [INFERRED] Public timetable information is centralised, but the broader institutional description requires fresh confirmation.

## Fresh research required

- [NEEDS_RESEARCH] current KRA governing and operating structure
- [NEEDS_RESEARCH] complete active racecourse and racing-code scope
- [NEEDS_RESEARCH] annual calendar and meeting totals
- [NEEDS_RESEARCH] venue-specific season and weekly patterns
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races
- [NEEDS_RESEARCH] breeding and ownership context
- [NEEDS_RESEARCH] cultural and spectator context
- [NEEDS_RESEARCH] current official URLs and navigation

## Source-test references

- `docs/timetable-source-tests/02-south-korea/README.md`
- `docs/timetable-source-tests/02-south-korea/final-summary.json`
- `docs/timetable-source-tests/02-south-korea/korea-final-capability-check.tsv`
- `docs/timetable-source-tests/02-south-korea/korea-generated-meeting-summary.tsv`
- `docs/timetable-source-tests/02-south-korea/korea-generated-payloads.tsv`

## Editorial handoff

When the final country page is written:

1. recheck the KRA routes and meet-code behaviour
2. confirm the current annual calendar and venue scope
3. research the racing-code distinction among the three venues
4. preserve the distinction between six tested meetings and national norms
5. keep the initial public timetable display at or below rank A
6. write separate natural English and Japanese copy
7. keep participant, betting, result and direct-stream data out of the page
