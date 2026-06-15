# Qatar

## Metadata

| Field | Value |
| --- | --- |
| Country | Qatar |
| Slug | qatar |
| Note status | draft |
| Evidence cutoff | 2026-06-15 |
| Source-test status | Complete |
| Technical rank | A+ |
| Public display ceiling | A |
| Source-test directory | `docs/timetable-source-tests/10-qatar/` |
| Revalidation trigger | Publication of the 2026-27 programme or its opening meeting |

## Evidence labels used in this note

- `[VERIFIED]`: directly supported by the reviewed source test
- `[OBSERVED]`: seen in the three tested 2025-26 meetings
- `[INFERRED]`: supported interpretation requiring confirmation
- `[NEEDS_RESEARCH]`: investigate during final page production

## Page-ready verified facts

- [VERIFIED] Qatar Racing and Equestrian Club provides the official race calendar used by the reviewed source test.
- [VERIFIED] The tested 2025-26 programme was seasonal rather than continuously year-round.
- [VERIFIED] Three meetings and 22 races were tested.
- [VERIFIED] All 22 races supplied race identity, ordered sequence, post time, race name and distance.
- [VERIFIED] The source supported technical A+ capability.
- [VERIFIED] The initial public display ceiling remains A.
- [VERIFIED] Revalidation is required when the 2026-27 programme or opening meeting becomes available.

## Racing structure

- [VERIFIED] The reviewed public programme route is centred on the Qatar Racing and Equestrian Club calendar.
- [VERIFIED] The source test did not establish a complete national racecourse inventory.
- [INFERRED] The tested information model is comparatively centralised.
- [NEEDS_RESEARCH] Confirm the current regulatory, organising and racecourse-operating structure.

## Governing and organising bodies

- [VERIFIED] Qatar Racing and Equestrian Club is the official calendar source identified by the reviewed evidence.
- [NEEDS_RESEARCH] Confirm the club's precise current regulatory and operational responsibilities before publication.

## Racecourses observed

- [VERIFIED] No racecourse or course label was consistently established in the reviewed field coverage.
- [NEEDS_RESEARCH] Confirm the venue or venues used by the current domestic racing programme.

The final page must not infer a racecourse name solely from general knowledge
or the club's identity.

## Racing codes observed

- [NEEDS_RESEARCH] No complete racing-code taxonomy was established by the source test.
- [NEEDS_RESEARCH] Confirm the current Thoroughbred, Arabian or other racing-code scope.

## Seasonality and meeting pattern

- [VERIFIED] The published 2025-26 programme began on 2025-10-15 and continued through April 2026.
- [VERIFIED] The assessment date of 2026-06-15 was outside that published season window.
- [VERIFIED] The absence of a June meeting was not treated as a source failure.
- [OBSERVED] The three tested meetings occurred on 2026-01-21, 2026-02-07 and 2026-04-04.
- [OBSERVED] The samples contained seven, seven and eight races.
- [NEEDS_RESEARCH] Confirm the complete 2026-27 season window when published.

## How racing information is distributed

- [VERIFIED] QREC publishes an official race-calendar interface.
- [VERIFIED] The tested system exposes meeting-list and race-detail data through its official client-backed route.
- [OBSERVED] Race sequence was obtained from the stable official ordered races array.
- [INFERRED] A collector should preserve official array order and not depend on an explicit race-number field.

## Programme and racecard format

- [VERIFIED] Race identity was present for all 22 tested races.
- [VERIFIED] An explicit race-number field was not present.
- [VERIFIED] Race 1-N sequence can be derived from official array order.
- [VERIFIED] Post time, race name and distance were present for all 22 races.
- [VERIFIED] Surface and course labels were not consistently established.
- [VERIFIED] Initial public display remains at or below rank A pending a separate A+ publication review.

## Current source landscape

### Current

- [VERIFIED] QREC official race-calendar interface
- [VERIFIED] Official meeting-list route
- [VERIFIED] Official race-detail route

### Seasonal availability

- [VERIFIED] The reviewed 2025-26 programme ended before June 2026.
- [VERIFIED] Off-season absence must not be interpreted as source failure or racing cessation.

### Supplementary

- [OBSERVED] The official client access flow must remain functional for future extraction.

## Operational observations

- [OBSERVED] Official array order supplied the race sequence even though explicit race numbers were absent.
- [OBSERVED] Surface and course data were less stable than names and distances.
- [INFERRED] Future validation should compare race identifiers and array order before assigning Race 1-N labels.

## Limitations and cautions

- [VERIFIED] The tested samples cover only the middle and later part of the 2025-26 season.
- [VERIFIED] The opening months of that season were not tested.
- [VERIFIED] The A+ result remains demonstrated capability, not a guarantee that the next-season source will be unchanged.
- [VERIFIED] No racecourse name should be added without fresh official confirmation.
- [VERIFIED] Surface and course fields must not be inferred.
- [VERIFIED] Technical A+ capability is separate from the initial public display ceiling of A.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] Qatar races continuously throughout the year.
- [NEEDS_RESEARCH] A missing June meeting means the source has failed.
- [NEEDS_RESEARCH] The tested club calendar establishes a complete national venue inventory.
- [NEEDS_RESEARCH] Every future payload will preserve the same client access flow and array structure.
- [NEEDS_RESEARCH] Surface and course labels are consistently available.
- [INFERRED] The information model is centralised, but wider institutional scope requires fresh confirmation.

## Fresh research required

- [NEEDS_RESEARCH] 2026-27 programme and opening meeting
- [NEEDS_RESEARCH] current regulator and QREC responsibilities
- [NEEDS_RESEARCH] complete current racecourse inventory
- [NEEDS_RESEARCH] racing-code structure
- [NEEDS_RESEARCH] annual meeting totals
- [NEEDS_RESEARCH] racing history
- [NEEDS_RESEARCH] major races
- [NEEDS_RESEARCH] breeding and ownership context
- [NEEDS_RESEARCH] cultural and spectator context
- [NEEDS_RESEARCH] current official source links and client behaviour

## Source-test references

- `docs/timetable-source-tests/10-qatar/README.md`
- `docs/timetable-source-tests/10-qatar/final-summary.json`
- `docs/timetable-source-tests/10-qatar/tested-meetings.tsv`
- `docs/timetable-source-tests/10-qatar/field-availability.tsv`

## Editorial handoff

When the final country page is written:

1. recheck the 2026-27 programme or opening meeting
2. confirm current authority and racecourse structure
3. verify meeting-list, race-detail and client access behaviour
4. preserve official array order as the race-sequence basis
5. do not infer racecourse, surface or course labels
6. keep the initial public timetable display at or below rank A
7. write separate natural English and Japanese copy
8. exclude raw payloads, participant, betting, result and payout data
