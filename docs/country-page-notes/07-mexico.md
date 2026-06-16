# Mexico

## Metadata

| Field | Value |
| --- | --- |
| Country | Mexico |
| Slug | mexico |
| Note status | reviewed |
| Evidence cutoff | Not recorded in the reviewed source-test summary |
| Source-test status | Pending |
| Technical rank | unassigned |
| Public display ceiling | pending |
| Source-test directory | `docs/timetable-source-tests/07-mexico/` |
| Revalidation trigger | Retry from a different network environment or when a stable official source is identified |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed source-test result
- `[OBSERVED]`: seen during the bounded DNS and HTTP probes
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during resumed source testing or final page production

## Page-ready verified facts

- [VERIFIED] Hipódromo de las Américas was the primary official source candidate tested.
- [VERIFIED] The official website candidate could not be reached from the local source-test environment.
- [VERIFIED] No meeting or race-level timetable fields were confirmed.
- [VERIFIED] The correct source-test status is Pending.
- [VERIFIED] The failed reachability test is not a C-rank result.
- [VERIFIED] The result does not establish that racing in Mexico has stopped.

## Racing structure

- [VERIFIED] The source test considered one primary racecourse and official-site candidate.
- [VERIFIED] The test did not establish the wider structure of Mexican racing.
- [NEEDS_RESEARCH] Identify all active racing systems, racecourses, authorities and operators before describing national structure.

## Governing and organising bodies

- [VERIFIED] No national authority or racecourse operator was confirmed by the retrieved source payload because no source payload was obtained.
- [NEEDS_RESEARCH] Confirm the operator of Hipódromo de las Américas and the current national regulatory structure.

## Racecourses observed

- [OBSERVED] Hipódromo de las Américas was the primary official candidate racecourse.

This is a source candidate, not a confirmed complete national racecourse list.

## Racing codes observed

- [NEEDS_RESEARCH] No racing code was established by the source test.
- [NEEDS_RESEARCH] Confirm whether Thoroughbred, Quarter Horse or other forms belong in the active national scope.

## Seasonality and meeting pattern

- [VERIFIED] No official meeting dates were confirmed.
- [NEEDS_RESEARCH] Confirm the current season, usual race days, meeting frequency and annual total.

## How racing information is distributed

- [OBSERVED] The primary candidate was the official Hipódromo de las Américas website family.
- [OBSERVED] Multiple HTTP, HTTPS and likely programme or calendar paths were tested.
- [OBSERVED] The local environment returned name-resolution failures or timeouts.
- [INFERRED] The unresolved result may reflect network, DNS, hosting or regional reachability conditions rather than source absence.

## Programme and racecard format

- [VERIFIED] Meeting date was not confirmed.
- [VERIFIED] Race labels and post times were not confirmed.
- [VERIFIED] Race names, distances and surfaces were not confirmed.
- [VERIFIED] No technical timetable rank can be assigned.
- [NEEDS_RESEARCH] Obtain a stable official programme, PDF, API or machine-readable timetable source before classification.

## Current source landscape

### Current candidate

- [OBSERVED] Hipódromo de las Américas official website family

### Unavailable during the test

- [OBSERVED] Tested host and path variants returned HTTP 000.
- [OBSERVED] Curl reported host-resolution failure or resolution timeout.

These observations apply only to the tested environment and time.

### Supplementary

- [NEEDS_RESEARCH] Search official social, regulatory, downloadable programme and archived official routes during the resumed investigation.

## Operational observations

- [OBSERVED] The failure occurred before any programme payload could be inspected.
- [INFERRED] Retesting from another network or browser environment is more useful than assigning a low capability rank.

## Limitations and cautions

- [VERIFIED] Pending does not mean C.
- [VERIFIED] DNS failure does not prove that a website is permanently offline.
- [VERIFIED] Website unavailability does not prove that the racecourse or Mexican racing has stopped.
- [VERIFIED] No public timetable upgrade may be based on this test.
- [VERIFIED] No meeting-pattern claim is supported.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] Mexican horse racing has stopped.
- [NEEDS_RESEARCH] Hipódromo de las Américas is inactive.
- [NEEDS_RESEARCH] Mexico has no public racing programme.
- [NEEDS_RESEARCH] Hipódromo de las Américas is the only active racecourse.
- [NEEDS_RESEARCH] Any technical rank applies to Mexico.
- [INFERRED] The source candidate may remain usable outside the tested environment, but that requires direct verification.

## Fresh research required

- [NEEDS_RESEARCH] repeat DNS and HTTP testing from another environment
- [NEEDS_RESEARCH] current official Hipódromo de las Américas route
- [NEEDS_RESEARCH] stable programme, PDF or API source
- [NEEDS_RESEARCH] national authority and racecourse operators
- [NEEDS_RESEARCH] complete active racecourse list
- [NEEDS_RESEARCH] racing codes and seasonality
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races
- [NEEDS_RESEARCH] breeding and cultural context
- [NEEDS_RESEARCH] current official source links

## Source-test references

- `docs/timetable-source-tests/07-mexico/README.md`
- `docs/timetable-source-tests/07-mexico/final-summary.json`
- `docs/timetable-source-tests/07-mexico/mexico-dns-probe.txt`
- `docs/timetable-source-tests/07-mexico/mexico-official-candidate-http-summary.tsv`

## Editorial handoff

When source testing or final page work resumes:

1. retry the official candidate from another network environment
2. verify whether the domain, host or path has changed
3. search official downloadable programme and regulatory sources
4. confirm current racecourse activity independently
5. assign no technical rank until positive source evidence exists
6. preserve Pending rather than interpreting failure as cessation
7. write separate natural English and Japanese copy
8. exclude participant, betting, result, raw response and direct-stream data
