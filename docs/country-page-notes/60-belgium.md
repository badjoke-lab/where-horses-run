# Belgium

## Metadata

| Field | Value |
| --- | --- |
| Country | Belgium |
| Slug | belgium |
| Note status | reviewed |
| Evidence cutoff | 2026-06-29 |
| Source-test status | Complete at reviewed national federation level |
| Technical rank | A |
| Public display ceiling | C |
| Calendar readiness | prototype_ready |
| Source-test directory | `docs/timetable-source-tests/60-belgium/` |
| Revalidation trigger | federation calendar filters, racecourse list, or race-page structure changes |

## Evidence labels

- `[VERIFIED]`: reviewed official evidence
- `[OBSERVED]`: bounded official sample
- `[INFERRED]`: interpretation
- `[NEEDS_RESEARCH]`: unresolved

## Page-ready verified facts

- [VERIFIED] The Belgian Federation for Horse Racing publishes a national racing calendar.
- [VERIFIED] The reviewed calendar aggregates Belgian racecourses and meeting dates.
- [VERIFIED] The source exposes race labels and post times at technical rank A.
- [VERIFIED] The country public display ceiling remains C.

## Racing structure

- [VERIFIED] The reviewed source represents a national federation calendar covering Belgian racecourses within its authority scope.

## Governing and organising body

- [VERIFIED] The Belgian Federation for Horse Racing owns the reviewed national source.

## Racecourses observed

- [VERIFIED] Multiple Belgian racecourses appear in the federation calendar.
- [NEEDS_RESEARCH] Stable racecourse IDs must be completed through the separate racecourse-inventory process.

## Programme format

- [VERIFIED] Publish meeting date and racecourse only on the country page.
- [VERIFIED] Retain race labels, post times, and other higher-detail source fields behind the C-level public boundary.

## Limitations and cautions

- [VERIFIED] Technical capability does not itself authorize A-level country display.
- [VERIFIED] The federation calendar must not be reproduced as a complete programme substitute.
- [VERIFIED] Higher-detail fields require a separate display-policy review before any future promotion.

## Claims not yet safe for publication

- [NEEDS_RESEARCH] A public-ceiling promotion above C.
- [NEEDS_RESEARCH] Complete stable racecourse identifiers for every federation venue.
- [NEEDS_RESEARCH] Any A+ programme-summary treatment.

## Fresh research required

- [NEEDS_RESEARCH] Revalidate the national calendar structure and venue list before implementing an adapter or changing the public ceiling.

## Source-test references

- `docs/timetable-source-tests/60-belgium/source-test-v2.json`
- `https://belgiumhorseracing.be/koersen/`

## Editorial handoff

1. keep country display at C
2. retain technical rank A internally as verified capability
3. do not expose race-level fields on list or country pages
4. require a separate display-policy review before any promotion
