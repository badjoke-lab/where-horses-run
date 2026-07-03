# NAR A+ pilot plan

Status: active  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Completed phases: source architecture; bounded fixture probe  
Current phase: candidate-only adapter  
Next phase: review and promotion  
Next Work ID after completion: `WHR-CAL-JAPAN-BANEI-A-PLUS`

## Sequence

1. source architecture and migration audit — complete;
2. bounded Urawa and Funabashi probe — complete;
3. reviewed test fixture — complete;
4. candidate-only adapter — current;
5. candidate validation and review;
6. human-approved canonical promotion;
7. deterministic public projection;
8. bilingual rendered QA;
9. freshness and rollback completion audit.

## Current boundary

The committed fixture covers venue codes 18 and 19 and contains only the approved six timetable-summary fields. It is test evidence and is not imported by production runtime.

The current phase may create review-required candidates. It must not change canonical or public data. The fourteen-code table remains a research seed rather than an activation list.

## Completion conditions

- each activated venue code is revalidated from an official route;
- authority and racecourse ownership are recorded;
- fixtures remain public-safe;
- promoted A+ meetings contain the approved six fields;
- public output remains inside the display boundary;
- publication remains human-approved;
- scheduling remains disabled;
- bilingual QA and rollback evidence pass.
