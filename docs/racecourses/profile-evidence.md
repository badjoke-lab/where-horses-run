# Racecourse page profile evidence

Status: implemented for review

Work ID: `WHR-RACECOURSE-PAGES-V1`

Implementation unit: `RACECOURSE-PAGE-PROFILE-EVIDENCE-01`

## Purpose

Racecourse pages must separate verified profile facts from unknown fields. This unit reviews the thirteen Japanese identity-only records created during timetable identity reconciliation and adds only facts supported by official NAR or JAIRS/JRA pages.

## Discovery baseline

The read-only discovery reviewed all 36 canonical racecourse records.

```text
racecourses: 36
identity-only records: 13
records with no core profile: 13
complete core profiles: 8
city: 23
region: 23
racing types: 22
surfaces: 14
direction: 10
course profile: 23
race-distance profile: 8
```

The thirteen profile-empty records were Funabashi, Kanazawa, Kasamatsu, Kawasaki, Kochi, Kokura, Monbetsu, Morioka, Nagoya, Oi, Saga, Sonoda, and Urawa.

## Reviewed evidence

For the twelve NAR venues, the official venue pages confirm location and the official NAR course table confirms surface, direction, one-lap course length, and distance from the start of the home straight to the finish. Morioka has separate dirt and turf courses. Monbetsu and Funabashi have outer and inner layouts. Oi has an outer course usable in both directions and a right-handed inner course.

The official values correct earlier provisional assumptions: Funabashi uses 308m to the finish, Kasamatsu uses 201m, and Oi must not be reduced to a right-handed-only venue.

For Kokura, JAIRS/JRA official pages confirm Kitakyushu, Fukuoka, right-handed operation, turf A/B/C courses, a dirt course, and steeplechase courses. The current schema stores the turf A-course and dirt-course lengths as representative course circumferences. The B/C and steeplechase values remain in the source-backed course notes.

Course circumference is not a race-distance menu. No race-distance profile is created for these thirteen records.

## Implemented result

```text
reviewed Japanese records: 13
identity-only records remaining: 0
records with no core profile remaining: 0
complete core profiles: 8
city coverage: 36 / 36
region coverage: 36 / 36
racing-type coverage: 35 / 36
surface coverage: 27 / 36
direction coverage: 23 / 36
course-profile coverage: 36 / 36
race-distance-profile coverage: 8 / 36
seasonality coverage: 36 / 36
public Calendar connection: 36 / 36
```

The thirteen records use `official_profile_partial`. This means location and high-level course facts are reviewed, but the page is not claiming a complete venue profile.

## Retained unknowns

The official course pages do not provide a complete race-distance menu for the thirteen reviewed venues. Their race-distance profiles therefore remain empty. Kokura's home-straight length is also left unknown because the reviewed official page does not state it.

Lighting, elevation, complete seasonality, notable-race lists, and unsupported visitor details remain unknown. Unknown values continue to render as `Not listed yet` or `未掲載`.

## Source boundary

Profile facts are accepted only from:

- the official NAR venue pages and NAR course table;
- the official JAIRS/JRA Kokura venue and course-detail pages;
- the JRA official Kokura venue route.

The permanent gate does not perform network requests. It validates the reviewed repository evidence, source identifiers, exact course metrics, rendered bilingual pages, and explicit unknown-state behavior.

## Public data boundary

This unit does not add participants, entries, jockeys, trainers, odds, results, payouts, predictions, full racecards, raw source bodies, embedded video, or direct stream URLs.

It performs no Canonical or public timetable write and enables no automatic source acceptance, publication, or deployment.

## Next unit

`RACECOURSE-PAGE-LINK-ARCHITECTURE-01` will complete the country, racing-type, glossary, Calendar, meeting, racecourse, and official-source navigation model across bilingual pages.
