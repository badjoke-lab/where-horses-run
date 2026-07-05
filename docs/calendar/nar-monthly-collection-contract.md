# NAR monthly collection contract

Status: active contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Target month: 2026-07  
Required boundary: 2026-07-01 through 2026-07-31 inclusive

## Purpose

The monthly phase covers the whole selected calendar month. It must check every flat-racing racecourse, represent every official meeting date, and never mistake unavailable future race detail for a no-meeting venue.

## Required distinction

Fixture compatibility proves parser compatibility with one complete meeting per racecourse. Monthly coverage is different:

```text
14 racecourses checked
x full calendar month
x every official meeting date represented
x future detail gaps retained explicitly
x no-meeting venues recorded explicitly
```

A partial `through_date` run may be used for diagnostics or an intermediate reviewed promotion. It is not monthly completion evidence.

## Source layers

The collector uses two official-source layers:

1. monthly schedule grid — establishes all scheduled racecourse/date pairs for the full month;
2. RaceList and DebaTable — provide A+ race times, race names, distance, surface, and course information when available.

A future scheduled meeting with unavailable detail is `scheduled_pending_details`, not `no_meeting_in_target_month` and not a silent omission.

## Preconditions

The full-month collector requires the complete fourteen-racecourse fixture set to pass:

```bash
node scripts/check-calendar-nar-complete-fixture-set.mjs
```

## Monthly states

| State | Meaning |
| --- | --- |
| `meeting_complete` | Official detail exists and all required A+ fields are complete |
| `scheduled_pending_details` | Official month schedule contains the meeting, but future detail is not available yet |
| `no_meeting_in_target_month` | The full selected month has no meeting for that racecourse |
| `meeting_incomplete` | Past/current meeting exists but required fields are incomplete |
| `source_unavailable` | Past/current official source cannot be fetched safely |
| `parser_failure` | Past/current source is reachable but cannot be parsed safely |

## Full-month output

The full-month collector writes only review artifacts:

```text
data/candidates/nar-monthly-2026-07-full-month-candidates.json
data/generated/timetable/nar-monthly-2026-07-full-month-collection-report.json
```

It must not write canonical data, public projections, runtime source files, or raw source bodies.

## Success conditions

- `month_start` is `2026-07-01`;
- `month_end` is `2026-07-31`;
- `through_date` is null;
- all fourteen flat-racing racecourses are classified;
- every official July meeting date resolves to A+ complete, scheduled pending detail, or explicit blocker;
- future scheduled meetings are not classified as inactive;
- no candidate is promotion-eligible before review;
- canonical and public writes remain disabled;
- scheduled acquisition remains disabled.

## Promotion rule

Existing reviewed A+ promotions remain valid partial data. They do not close the Work ID. Remaining July meetings are reviewed and promoted in later batches until the whole month is covered at the highest official-source rank available for each meeting.
