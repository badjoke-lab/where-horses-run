# Peru

## Metadata

| Field | Value |
| --- | --- |
| Country | Peru |
| Slug | peru |
| Note status | reviewed |
| Evidence cutoff | 2026-06-15 |
| Source-test status | Complete |
| Technical rank | A+ |
| Public display ceiling | A |
| Source-test directory | `docs/timetable-source-tests/06-peru/` |
| Revalidation trigger | Before final page publication or after a Monterrico page or API change |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed source test
- `[OBSERVED]`: seen in the three tested Monterrico meetings
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during final page production

## Page-ready verified facts

- [VERIFIED] The completed Peru source test covered Hipódromo de Monterrico.
- [VERIFIED] The official Monterrico website provides programme pages backed by machine-readable JSON endpoints.
- [VERIFIED] Three meetings and 27 races were tested.
- [VERIFIED] All 27 tested races supplied post times, race names, distances and surface labels.
- [VERIFIED] Course labels were absent from all 27 tested race-detail records.
- [VERIFIED] The tested source supported technical A+ capability.

## Racing structure

- [VERIFIED] The reviewed source test established one official racecourse programme system at Hipódromo de Monterrico.
- [VERIFIED] The test did not establish that Monterrico represents all racing activity in Peru.
- [INFERRED] The tested public information route is comparatively integrated at racecourse level.
- [NEEDS_RESEARCH] Confirm the national regulatory structure and whether additional active racecourses or racing systems exist.

## Governing and organising bodies

- [VERIFIED] The source test confirmed the official Hipódromo de Monterrico information system.
- [NEEDS_RESEARCH] Confirm the current racecourse operator, national authority and their respective responsibilities.
- [NEEDS_RESEARCH] Do not infer an organisation name solely from the website or racecourse name.

## Racecourses observed

- [VERIFIED] Hipódromo de Monterrico

This is the primary tested racecourse, not a verified complete national
racecourse inventory.

## Racing codes observed

- [OBSERVED] Surface labels were available through the race-detail API.
- [NEEDS_RESEARCH] Confirm the racing code conducted at Monterrico and whether other codes operate elsewhere in Peru.

## Seasonality and meeting pattern

- [OBSERVED] The tested meetings were dated 2026-06-13, 2026-06-14 and 2026-06-15.
- [OBSERVED] Two samples contained ten races and one contained seven races.
- [VERIFIED] These three samples do not establish a normal national meeting pattern.
- [NEEDS_RESEARCH] Confirm the annual season, usual race days and meeting totals.

## How racing information is distributed

- [VERIFIED] The official Monterrico site provides an upcoming-programmes page.
- [VERIFIED] A date endpoint returns meeting-level programme information.
- [VERIFIED] A meeting endpoint returns the races associated with a meeting.
- [VERIFIED] A race-detail endpoint supplies additional programme fields including surface.
- [INFERRED] The racecourse website and JSON API form one integrated official distribution system.

## Programme and racecard format

- [VERIFIED] Meeting-level fields include meeting date, racecourse name and meeting identifier.
- [VERIFIED] Race-level fields include race label, post time, race name and distance.
- [VERIFIED] Surface requires the race-detail endpoint.
- [VERIFIED] Course label was not confirmed in the tested fields.
- [VERIFIED] Initial public display remains at or below rank A pending a separate A+ publication review.

## Current source landscape

### Current

- [VERIFIED] Monterrico upcoming-programmes page
- [VERIFIED] Programme-by-date JSON endpoint
- [VERIFIED] Programme-by-meeting JSON endpoint
- [VERIFIED] Race-detail JSON endpoint

### Legacy or inactive

- [NEEDS_RESEARCH] No legacy-source conclusion was established by the test.

### Supplementary

- [OBSERVED] Several API layers are required to obtain the complete safe A+ summary field set.

## Operational observations

- [OBSERVED] Meeting and programme APIs supplied most fields.
- [OBSERVED] Surface values required an additional request for each race.
- [INFERRED] A production collector should separate meeting discovery, programme retrieval and race-detail enrichment.

## Limitations and cautions

- [VERIFIED] The completed technical test is limited to Monterrico.
- [VERIFIED] Three meetings do not establish annual or nationwide coverage.
- [VERIFIED] Course labels must not be fabricated from other fields.
- [VERIFIED] Raw API responses must not be committed or republished.
- [VERIFIED] Technical A+ capability is separate from the initial public display ceiling.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] Monterrico is the only active racecourse in Peru.
- [NEEDS_RESEARCH] Peru has one national racing operator.
- [NEEDS_RESEARCH] Peruvian meetings normally contain seven or ten races.
- [NEEDS_RESEARCH] The tested June dates represent the normal annual calendar.
- [INFERRED] The tested information system is racecourse-centred, but national completeness is unverified.

## Fresh research required

- [NEEDS_RESEARCH] current national authority and Monterrico operator
- [NEEDS_RESEARCH] complete active racecourse list
- [NEEDS_RESEARCH] racing-code scope
- [NEEDS_RESEARCH] annual calendar and meeting totals
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races
- [NEEDS_RESEARCH] breeding and ownership context
- [NEEDS_RESEARCH] cultural and spectator context
- [NEEDS_RESEARCH] current official source links and API behaviour

## Source-test references

- `docs/timetable-source-tests/06-peru/README.md`
- `docs/timetable-source-tests/06-peru/final-summary.json`
- `docs/timetable-source-tests/06-peru/peru-monterrico-meeting-summary.tsv`
- `docs/timetable-source-tests/06-peru/peru-monterrico-detail-summary.tsv`
- `docs/timetable-source-tests/06-peru/peru-monterrico-race-field-availability.tsv`
- `docs/timetable-source-tests/06-peru/peru-monterrico-race-detail-field-availability.tsv`

## Editorial handoff

When the final country page is written:

1. confirm the current authority and Monterrico operator
2. determine whether additional active racecourses or systems belong in scope
3. recheck all official programme and API routes
4. preserve the distinction between meeting, programme and detail endpoints
5. keep absent course labels absent
6. keep the initial public timetable display at or below rank A
7. write separate natural English and Japanese copy
8. exclude participant, betting, result, raw API and direct-stream data
