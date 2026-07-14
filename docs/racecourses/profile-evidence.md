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
```

The thirteen profile-empty records were Funabashi, Kanazawa, Kasamatsu, Kawasaki, Kochi, Kokura, Monbetsu, Morioka, Nagoya, Oi, Saga, Sonoda, and Urawa.

## Reviewed evidence

For the twelve NAR venues, the official venue pages confirm location and the official NAR course table confirms surface, direction, one-lap course length, and home-straight length. Morioka has both dirt and turf course dimensions. Oi has outer and inner dirt courses; the outer-course values are used as representative values in the current schema.

For Kokura, JAIRS/JRA official pages confirm Kitakyushu, Fukuoka, right-handed operation, turf A/B/C courses, a dirt course, and steeplechase courses. The profile stores the published course lengths as the structured distance profile and uses the turf A-course length as the representative turf circumference.

## Implemented result

```text
reviewed Japanese records: 13
identity-only records remaining: 0
records with no core profile remaining: 0
complete core profiles: 9
city coverage: 36 / 36
region coverage: 33 / 36
racing-type coverage: 36 / 36
surface coverage: 36 / 36
direction coverage: 30 / 36
course-profile coverage: 24 / 36
distance-profile coverage: 11 / 36
seasonality coverage: 36 / 36
public Calendar connection: 36 / 36
```

The thirteen records use `official_profile_partial`. This means location and high-level course facts are reviewed, but the page is not claiming a complete venue profile.

## Retained unknowns

The NAR course table does not provide a complete race-distance menu for the twelve reviewed NAR venues. Their distance profiles therefore remain empty. Lighting, elevation, complete seasonality, notable-race lists, and unsupported visitor details also remain unknown.

Unknown values continue to render as `Not listed yet` or `未掲載`.

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
