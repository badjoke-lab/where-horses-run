# Japan

## Metadata

| Field | Value |
| --- | --- |
| Country | Japan |
| Slug | japan |
| Note status | reviewed |
| Evidence cutoff | 2026-07-03 |
| Source-test status | Partial |
| Technical rank | A+ for JRA, NAR/local-government racing, and Banei Tokachi |
| Public display ceiling | A+ for each system; each meeting remains evidence-bound |
| Source-test directory | `docs/timetable-source-tests/13-japan/` |
| Revalidation trigger | Material JRA, NAR-authority, or Banei source-route change |

## Reviewed position

- [VERIFIED] Japan remains divided into JRA central racing, NAR and local-government racing, and Banei Tokachi.
- [VERIFIED] All three systems have approved Technical Rank A+ and Public Ceiling A+.
- [VERIFIED] A system-level A+ ceiling does not raise an individual meeting above reviewed canonical evidence.
- [VERIFIED] JRA July 2026 publication validated 24 A+ meetings and 300 public-safe timetable rows.
- [VERIFIED] NAR and Banei remain separate pending-pilot implementations and are not activated by JRA evidence.

## System boundaries

### JRA

JRA uses reviewed annual programme and dated meeting routes. Approved meeting-detail fields are race label, scheduled post time, race name, distance, surface, and course label. Publication remains review-controlled.

### NAR and local-government racing

NAR provides a national entry point, but complete implementation remains authority- and racecourse-specific. The NAR A+ pilot must establish route mapping and meeting evidence without flattening local racing into a JRA-like national feed.

### Banei Tokachi

Banei uses its own official routes and terminology. Its A+ pilot must not impose flat-racing surface or course assumptions.

## Public boundary

- A+ is the system ceiling; unsupported meeting fields are not invented.
- Participant, betting, result, payout, prediction, complete-racecard, raw-source, embedded-video, and direct-stream data remain excluded.
- Scheduling and unattended canonical or public writes remain disabled.

## Current implementation state

- JRA A+ public projection: active through operator-triggered local acquisition and reviewed pull requests.
- NAR A+ public projection: pending separate pilot.
- Banei A+ public projection: pending separate pilot.

## Research still required

- current NAR authority and racecourse route inventory
- reviewed NAR pilot fixtures
- Banei timetable completeness and terminology validation
- system-specific seasonality and rollover handling

## References

- `docs/timetable-source-tests/13-japan/final-summary.json`
- `data/static/calendar-readiness-japan-v2.json`
- `data/static/authority-source-inventory-japan-v2.json`
- `data/static/japan-a-plus-runtime-control.json`

## Editorial handoff

1. preserve the three-system separation
2. use authority-specific labels and links
3. publish A+ only from reviewed meeting evidence
4. do not infer NAR or Banei completeness from JRA capability
5. keep English and Japanese copy natural and system-specific
6. retain the public-field exclusions above
