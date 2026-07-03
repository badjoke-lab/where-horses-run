# NAR flat-racing 14-racecourse compatibility audit

Status: complete  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Reviewed: 2026-07-04  
Next phase: collect one complete meeting fixture for every flat-racing racecourse

## Scope correction

The NAR flat-racing pilot covers all fourteen active flat-racing racecourses, not only Urawa and Funabashi.

The fourteen are:

1. Monbetsu
2. Morioka
3. Mizusawa
4. Urawa
5. Funabashi
6. Oi
7. Kawasaki
8. Kanazawa
9. Kasamatsu
10. Nagoya
11. Sonoda
12. Himeji
13. Kochi
14. Saga

Obihiro is the fifteenth current local racecourse and remains a separate Banei implementation.

## Official-source findings

- the NAR guide identifies fifteen current local racecourses, including Obihiro;
- the NAR organiser table identifies the responsible local authority or association for each racecourse;
- the same official RaceList route family is available for all fourteen flat-racing venue codes;
- the official course guide confirms venue-specific direction and surface rules;
- Morioka is the only flat-racing venue in this cohort with both dirt and turf;
- Oi requires left/right course handling;
- Mizusawa and Himeji have no meetings in the July 2026 target month and therefore require seasonal 2026 fixtures rather than being omitted.

Machine-readable matrix:

- `data/static/nar-flat-racecourse-compatibility-v1.json`

## Coverage requirement

NAR fixture coverage is complete only when:

```text
complete racecourse fixtures: 14 / 14
```

For each racecourse the repository must contain at least one reviewed complete meeting fixture with:

- race numbers continuous from 1 to the final race;
- a scheduled post time for every race;
- a race name for every race;
- distance for every race;
- surface for every race;
- course or direction label for every race;
- official list and detail traceability;
- no raw source body or restricted participant/betting/result fields.

A racecourse with no meeting in the selected month is not exempt. Its most recent or next available meeting in the same season must be used for compatibility coverage.

## Monthly collection requirement

After all fourteen racecourses have a complete fixture, a selected-month run must check all fourteen codes and classify every venue/date as one of:

```text
meeting_complete
meeting_incomplete
no_meeting
source_unavailable
parser_failure
```

For the selected month, every actual meeting at every active flat-racing racecourse must be represented by a complete candidate or a recorded blocker. Silent omission is prohibited.

## Parser model

The implementation reuses only the safe parsing concepts recovered from legacy PR #281:

- UTF-8 and Shift_JIS decoding selection;
- RaceList extraction of race number, scheduled time, race name, direction, and distance;
- DebaTable verification of surface and course labels;
- request timeout, delay, and diagnostics.

It does not reuse direct canonical/public writes, unbounded all-date scanning, or post-hoc mutation of public data.

## Write boundary

The complete-fixture collector may write only:

```text
data/fixtures/timetable/nar/complete-meetings/
data/generated/timetable/nar-complete-fixture-report.json
```

It must not write candidate, canonical, public, or production runtime data. Human review remains mandatory before any promotion stage.

## Current counts

```text
racecourses in scope:          14
route/code compatibility:      14 / 14
single-race probes:             2 / 14
complete-meeting fixtures:      0 / 14
public NAR meetings:            0
```
