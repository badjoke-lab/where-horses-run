# Japan full-month calendar scope policy

Status: active scope policy  
Applies to: `WHR-CAL-JAPAN-JRA-A-PLUS`, `WHR-CAL-JAPAN-NAR-A-PLUS`, `WHR-CAL-JAPAN-BANEI-A-PLUS`  
Target month: 2026-07

## Rule

Japan calendar work is evaluated on the whole selected calendar month, not on a rolling partial cutoff.

For July 2026 the required calendar boundary is:

```text
2026-07-01 through 2026-07-31 inclusive
```

A `through_date` run may be used for diagnostics or an intermediate reviewed promotion, but it is never completion evidence for the monthly Work ID.

## JRA

JRA July coverage remains the reference shape: every July meeting in the official reviewed programme is represented in the month-wide calendar projection.

## NAR flat racing

The NAR flat-racing Work ID covers all fourteen flat-racing racecourses and the whole selected month.

The collector must distinguish two source layers:

1. the official month schedule, which establishes every scheduled racecourse/date across the full month;
2. RaceList and DebaTable pages, which provide A+ detail when the official meeting detail is available.

Future scheduled meetings must never be misclassified as `no_meeting_in_target_month` merely because RaceList detail is not linked or published yet. They must be retained as explicit scheduled meetings pending detail availability. Existing reviewed A+ meetings remain valid partial promotions, but they do not close the month-wide NAR Work ID.

## Banei

Banei remains a separate Work ID and must follow the same month boundary:

```text
2026-07-01 through 2026-07-31 inclusive
```

Its schedule coverage must include every July Obihiro Banei meeting. Banei-specific race detail must use Banei semantics and must not inherit flat-racing surface/course assumptions. A partial cutoff or one-fixture proof is not Banei monthly completion evidence.

## Completion boundary

A Japan authority Work ID may be marked month-complete only when:

- the selected month starts on day 1 and ends on the calendar month end;
- every official scheduled meeting date is represented or explicitly blocked;
- future scheduled meetings are retained as scheduled/pending rather than silently omitted;
- every available reviewed detail record is promoted at the highest supported rank;
- unavailable future detail does not erase the underlying calendar meeting;
- publication remains review-controlled;
- unattended scheduled writes remain disabled unless separately approved.
