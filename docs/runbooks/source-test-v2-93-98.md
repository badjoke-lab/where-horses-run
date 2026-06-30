# Source Test v2 — entries 93-98

Status: complete for review  
Work ID: `WHR-ST2-93-98`  
Evidence cutoff: 2026-06-30

## Scope

- Nicaragua: explanatory, blocked
- El Salvador: explanatory, blocked
- Tanzania: explanatory, blocked
- Singapore: archive, blocked
- Macau: archive, blocked
- Greece: archive, blocked

## Result

- 6 Source Test v2 records
- 6 authority references
- 6 readiness references
- 98 countries with closed decisions
- 116 effective references
- all Technical Ranks and Public Ceilings remain C
- implementation remains not started

Archive dates describe cessation or final-race context only. They are not current meeting dates. No current race-time or programme fields are approved.

## Validation

```text
node scripts/check-source-test-v2-93-98.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
npm install
npm run build
```

Expected:

```text
SOURCE_TEST_V2_93_98_VALID countries=6 authority=116 readiness=116
PROGRAMME_COUNTS published=92 source_tested=6
READINESS_MIX blocked=6
```

## Next

`WHR-NOTE-93-98`
