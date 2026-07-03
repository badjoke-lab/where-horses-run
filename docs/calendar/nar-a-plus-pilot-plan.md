# NAR A+ pilot plan

Status: active  
Work ID: `WHR-CAL-JAPAN-NAR-A-PLUS`  
Current phase: source architecture  
Next phase: bounded Urawa/Funabashi fixture probe  
Next Work ID after completion: `WHR-CAL-JAPAN-BANEI-A-PLUS`

## Sequence

1. source architecture and legacy migration audit;
2. Urawa/Funabashi live-route probe;
3. reviewed public-safe fixtures;
4. candidate-only venue-aware adapter;
5. candidate validation and prohibited-field checks;
6. human promotion to canonical data;
7. deterministic public projection;
8. bilingual rendered QA;
9. freshness, fallback, rollback, and completion audit.

## Current boundary

The current source-architecture phase does not fetch for publication and does not write canonical or public data. The first implementation probe remains bounded to venue codes 18 and 19. The fourteen-code table is a research seed only.

## Completion conditions

- all activated venue codes are revalidated from official routes;
- organiser, authority, and racecourse ownership are recorded;
- fixtures contain only public-safe extracted fields;
- every promoted A+ meeting has complete label, post time, race name, distance, surface, and course fields;
- no runner, horse, jockey, trainer, odds, result, payout, prediction, raw source, embedded-video, or direct-stream fields enter public output;
- publication remains human-approved;
- scheduling remains disabled;
- bilingual rendered QA and rollback evidence pass.
