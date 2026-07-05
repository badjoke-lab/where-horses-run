# NAR A+ pilot plan

Status: active  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Target month: 2026-07  
Required boundary: 2026-07-01 through 2026-07-31 inclusive  
Current phase: full-month schedule coverage and month-wide detail completion  
Next Work ID: `WHR-CAL-JAPAN-BANEI-A-PLUS`

## Scope

The NAR flat-racing scope is fourteen racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains a separate Banei Work ID.

The reviewed A+ promotion through 2026-07-04 is valid partial data. It is not completion evidence for the NAR monthly Work ID. Completion requires the whole July calendar month.

## Sequence

1. source architecture — complete;
2. route probe — complete;
3. candidate adapter — complete;
4. all-fourteen compatibility audit — complete;
5. complete fixture coverage 14/14 — complete;
6. first reviewed A+ promotion through 2026-07-04 — complete as partial month data;
7. extract every July schedule date for all fourteen racecourses — current;
8. retain future scheduled meetings whose detail is not available yet;
9. add A+ detail as official RaceList and DebaTable data becomes available;
10. review and promote the remaining July meetings;
11. public projection and bilingual QA;
12. freshness and rollback audit.

## Source layers

Month-wide coverage must not depend only on RaceList links already exposed for near-term dates.

The pipeline uses the official monthly schedule to establish every scheduled racecourse/date in July. RaceList and DebaTable provide A+ timetable detail when available.

A future scheduled meeting with unavailable detail must remain an explicit pending meeting. It must not be classified as `no_meeting_in_target_month` and must not be silently omitted.

Mizusawa and Himeji have no July 2026 meetings. They remain part of the fourteen-racecourse classification and are explicitly recorded as no-meeting venues.

## Completion conditions

- exact window: 2026-07-01 through 2026-07-31;
- all fourteen racecourses classified;
- every official July meeting date represented;
- future detail gaps recorded explicitly;
- every past or current meeting A+ complete or explicitly blocked;
- partial cutoff output never treated as monthly completion;
- publication remains reviewed;
- unattended scheduled writes remain disabled;
- bilingual QA and rollback evidence pass.

## Banei handoff

The following Banei Work ID uses the same full-month rule for July 2026. A partial cutoff or a one-meeting fixture is not Banei monthly completion. Banei detail parsing remains separate from flat-racing assumptions.
