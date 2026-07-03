# NAR monthly collection contract

Status: draft contract  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Target month: 2026-07

## Purpose

The all-fourteen fixture phase proves that each NAR flat-racing racecourse can be parsed at least once. The monthly phase is different: it must check every flat-racing racecourse in the selected month and classify every venue/date without silently omitting inactive venues.

## Required distinction

Fixture compatibility:

```text
14 racecourses
x at least one completed meeting per racecourse
x same month not required
```

Monthly collection:

```text
14 racecourses checked for the selected month
x every actual meeting collected
x venues with no meeting explicitly recorded as no_meeting_in_target_month
```

A racecourse with no meeting in the target month is not an error. It is an explicit classification. A racecourse with a meeting that cannot be parsed is a blocker.

## Preconditions

The monthly collector must not run as a promotion path until the complete fixture set exists and passes:

```bash
node scripts/check-calendar-nar-complete-fixture-set.mjs
```

That validator requires one complete reviewed fixture for each of the fourteen flat-racing racecourses.

## Monthly classification states

| State | Meaning | Candidate output |
| --- | --- | --- |
| `meeting_complete` | Official meeting exists and all required A+ fields are complete | `needs_review`, `promotion_eligible=false` |
| `no_meeting_in_target_month` | The selected month has no meeting for that racecourse | no candidate; status record only |
| `meeting_incomplete` | Meeting exists but race continuity or A+ fields are incomplete | blocker record |
| `source_unavailable` | Official source cannot be fetched safely | blocker record |
| `parser_failure` | Source is reachable but cannot be parsed safely | blocker record |

## Write boundary

The monthly collector may write only:

```text
data/generated/timetable/nar-monthly-collection-report.json
data/candidates/nar-monthly-meeting-candidates.json
```

It must not write:

```text
data/generated/timetable/canonical/**
data/generated/timetable/public/**
src/**
```

Raw source storage remains disabled.

## Success condition

A monthly collection PR is valid only if:

- all fourteen flat-racing racecourses are classified;
- every actual meeting in the selected month is represented as complete or explicitly blocked;
- venues with no meeting are recorded as `no_meeting_in_target_month`;
- no candidate is promotion-eligible;
- no canonical or public data changes;
- scheduled acquisition remains disabled.

## Next step after monthly candidates

After a monthly candidate PR passes review, a separate human-approved promotion PR may convert approved complete candidates into canonical data and then regenerate public projection. That promotion step is not part of monthly collection.
