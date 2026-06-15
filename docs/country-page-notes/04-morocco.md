# Morocco

## Metadata

| Field | Value |
| --- | --- |
| Country | Morocco |
| Slug | morocco |
| Note status | reviewed |
| Evidence cutoff | 2026-06-10 |
| Source-test status | Pending |
| Technical rank | unassigned |
| Public display ceiling | pending |
| Source-test directory | `docs/timetable-source-tests/04-morocco/` |
| Revalidation trigger | When FARAS, E-SOREC or another stable official programme source becomes testable |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed SOREC and FARAS source investigation
- `[OBSERVED]`: seen during the bounded discovery and network tests
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during resumed source testing or final page production

## Page-ready verified facts

- [VERIFIED] Société Royale d'Encouragement du Cheval is the official authority identified in the reviewed evidence.
- [VERIFIED] The SOREC official website was reachable during the test.
- [VERIFIED] The SOREC WordPress REST API was reachable during the test.
- [VERIFIED] SOREC official material documented seven racecourse names in the reviewed discovery sample.
- [VERIFIED] FARAS was a current official application and documented race-programme functionality.
- [VERIFIED] No technical timetable rank was assigned because no stable official source had yet produced confirmed meeting-date and racecourse pairings or complete Race 1-N timetable data.

## Racing structure

- [VERIFIED] The reviewed information environment is centred on SOREC and its official digital services.
- [OBSERVED] Programme-related information appears across a website, an application, APIs and other digital services rather than one confirmed public timetable endpoint.
- [INFERRED] Morocco may have an authority-led but technically distributed public information model.
- [NEEDS_RESEARCH] Confirm the current national governance, racecourse-operation and information-distribution structure.

## Governing and organising bodies

- [VERIFIED] Société Royale d'Encouragement du Cheval is the authority identified by the reviewed source test.
- [NEEDS_RESEARCH] Confirm SOREC's precise current regulatory, organising and racecourse-management roles before publication.

## Racecourses observed

The following names appeared in reviewed SOREC official material:

- [VERIFIED] Casablanca-Anfa
- [VERIFIED] Meknès
- [VERIFIED] Marrakech
- [VERIFIED] Rabat
- [VERIFIED] Settat
- [VERIFIED] El Jadida
- [VERIFIED] Khemisset

This list is not yet safe to describe as a complete current active national
racecourse inventory. The source test explicitly left nationwide verification
unresolved.

## Racing codes observed

- [NEEDS_RESEARCH] Confirm the racing codes conducted at each reviewed racecourse.
- [NEEDS_RESEARCH] Confirm how any Thoroughbred, Arabian or other racing categories should be presented on the final page.

## Seasonality and meeting pattern

- [VERIFIED] The current source test did not establish a stable official meeting calendar.
- [NEEDS_RESEARCH] Confirm the annual season, meeting frequency, racecourse rotation and any seasonal breaks.
- [NEEDS_RESEARCH] Obtain official date-and-racecourse pairings before describing a normal meeting pattern.

## How racing information is distributed

- [VERIFIED] SOREC operates an official website.
- [VERIFIED] SOREC exposes a reachable WordPress REST API.
- [VERIFIED] FARAS is an official application with documented race-programme functionality.
- [VERIFIED] A SOREC TV application package was also identified.
- [OBSERVED] The public WordPress API did not expose a confirmed race-programme endpoint during the test.
- [INFERRED] Important timetable functionality may be delivered through an application backend not identified in the reviewed public web routes.

## Programme and racecard format

- [VERIFIED] FARAS documentation indicated programme functionality.
- [VERIFIED] No stable source produced a verified complete Race 1-N timetable during the test.
- [VERIFIED] Post times, distance coverage and surface coverage remain unresolved.
- [VERIFIED] No C, B, B+, A or A+ rank should be assigned until a stable source is verified.
- [NEEDS_RESEARCH] Inspect current official application or network routes without committing application packages or raw responses.

## Current source landscape

### Current

- [VERIFIED] SOREC official website
- [VERIFIED] SOREC WordPress REST API
- [VERIFIED] FARAS official application
- [VERIFIED] SOREC TV application presence

### Unavailable during the test

- [OBSERVED] E-SOREC resolved in DNS but HTTP and HTTPS connections timed out.
- [OBSERVED] The tested SOREC streaming host resolved in DNS but HTTP and HTTPS connections timed out.

These observations do not prove that either service is permanently inactive.

### Supplementary

- [OBSERVED] Application-store metadata supplied current package, version and release information.
- [OBSERVED] Certificate-history and store-page checks did not reveal a confirmed current FARAS backend host.

## Operational observations

- [OBSERVED] Seven racecourse names were found on the reviewed SOREC racing material.
- [OBSERVED] Only Marrakech and Rabat appeared in one reviewed home-page sample, while the racing page exposed all seven names.
- [OBSERVED] Different official surfaces exposed different portions of the available information.
- [INFERRED] A future collector may need to combine authority, application and programme routes rather than rely on the public WordPress API alone.

## Limitations and cautions

- [VERIFIED] Morocco remains Pending and has no assigned technical rank.
- [VERIFIED] Reachable authority pages do not by themselves establish timetable capability.
- [VERIFIED] Seven documented racecourse names do not yet prove a complete current active national inventory.
- [VERIFIED] A connection timeout does not prove that a service or Moroccan racing has stopped.
- [VERIFIED] Programme functionality documented in an application does not establish a stable public extraction route.
- [VERIFIED] Testing should resume from the A+ investigation rather than assigning a lower rank without evidence.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] Morocco has no publicly available racing calendar.
- [NEEDS_RESEARCH] The seven discovered racecourses are all currently active and form the complete national list.
- [NEEDS_RESEARCH] E-SOREC and the tested streaming service are permanently inactive.
- [NEEDS_RESEARCH] FARAS is the only official programme-distribution channel.
- [NEEDS_RESEARCH] Moroccan meetings normally follow any specific race count, weekday or seasonal pattern.
- [INFERRED] Programme data may be available through an unidentified FARAS backend, but this is not yet verified.

## Fresh research required

- [NEEDS_RESEARCH] stable official meeting source
- [NEEDS_RESEARCH] official meeting-date and racecourse pairings
- [NEEDS_RESEARCH] complete Race 1-N post times
- [NEEDS_RESEARCH] distance, surface and course-label coverage
- [NEEDS_RESEARCH] current FARAS backend or official export route
- [NEEDS_RESEARCH] complete active racecourse inventory
- [NEEDS_RESEARCH] racing codes and seasonality
- [NEEDS_RESEARCH] current authority and racecourse-operator structure
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races
- [NEEDS_RESEARCH] breeding and cultural context
- [NEEDS_RESEARCH] current official URLs and navigation

## Source-test references

- `docs/timetable-source-tests/04-morocco/README.md`
- `docs/timetable-source-tests/04-morocco/pending-summary.json`
- `docs/timetable-source-tests/04-morocco/morocco-discovery-summary.json`
- `docs/timetable-source-tests/04-morocco/morocco-wp-api-summary.json`
- `docs/timetable-source-tests/04-morocco/morocco-network-diagnostics.txt`
- `docs/timetable-source-tests/04-morocco/morocco-official-app-links.txt`
- `docs/timetable-source-tests/04-morocco/morocco-app-package-candidates.txt`

## Editorial handoff

When source testing or final page work resumes:

1. inspect the current FARAS application or its network traffic
2. retry E-SOREC and other official programme infrastructure
3. search official programme PDFs, exports and hidden endpoints
4. verify the current active status of all seven discovered racecourses
5. assign a technical rank only after a stable official source is verified
6. do not describe timeouts or missing endpoints as an absence of racing
7. write separate natural English and Japanese copy
8. keep application files, raw responses, participant, betting, result and direct-stream data out of the repository
