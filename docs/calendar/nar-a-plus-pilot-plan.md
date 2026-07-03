# NAR A+ pilot plan

Status: active  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Completed phases: source architecture; bounded fixture probe; candidate-only adapter; all-14 racecourse compatibility audit  
Current phase: all-14 complete-meeting fixture collection  
Next phase: selected-month all-meeting collection and candidate review  
Next Work ID after completion: `WHR-CAL-JAPAN-BANEI-A-PLUS`

## Sequence

1. source architecture — complete;
2. bounded route probe — complete;
3. public-safe test fixture — complete;
4. non-promotable candidate adapter — complete;
5. all-fourteen racecourse compatibility audit — complete;
6. one complete meeting fixture for each of the fourteen flat-racing racecourses — current;
7. selected-month collection of every actual meeting at every active flat-racing racecourse;
8. candidate validation and review;
9. reviewed canonical promotion;
10. public projection and bilingual QA;
11. freshness and rollback audit.

## Scope

The flat-racing NAR scope is fourteen racecourses:

```text
Monbetsu, Morioka, Mizusawa, Urawa, Funabashi, Oi, Kawasaki,
Kanazawa, Kasamatsu, Nagoya, Sonoda, Himeji, Kochi, Saga
```

Obihiro remains a separate Banei Work ID.

Two single-race probes are not completion evidence. Every flat-racing racecourse requires at least one complete meeting fixture. After that compatibility coverage is complete, the selected-month collection must cover every actual meeting at every active racecourse.

Mizusawa and Himeji have no meetings in July 2026. They still require seasonal 2026 fixtures and are not excluded from the fourteen-racecourse completion requirement.

## Current boundary

The complete-fixture collector may write only reviewed fixture output and a diagnostic report. It must not write candidates, canonical meetings, public projections, or production runtime data.

Every complete fixture must contain continuous race numbers from 1 through the final race and the approved six fields for every row:

- race label;
- scheduled post time;
- race name;
- distance;
- surface;
- course label.

## Completion conditions

- route and venue-code compatibility is recorded for all fourteen racecourses;
- complete-meeting fixture coverage reaches 14/14;
- seasonal racecourses are not silently omitted;
- the selected-month run checks all fourteen codes;
- every actual meeting is complete or has an explicit blocker;
- fixture fields stay inside the public boundary;
- complete meetings have continuous race numbers and times;
- publication remains reviewed;
- scheduling remains disabled;
- bilingual QA and rollback evidence pass.
