# Source Test v2 — entries 85-92

Status: complete for review  
Work ID: `WHR-ST2-85-92`  
Evidence cutoff: 2026-06-30

## Scope

| Delivery | Country | Readiness | Public treatment |
| --- | --- | --- | --- |
| 85 | Ghana | `link_only` | official association context |
| 86 | Saint Kitts and Nevis | `blocked` | legal/archive explanation only |
| 87 | Jordan | `link_only` | official federation context |
| 88 | Iraq | `link_only` | international federation context |
| 89 | Azerbaijan | `link_only` | federation racing context |
| 90 | Mongolia | `manual_ready` | bounded regional date and venue |
| 91 | Botswana | `manual_ready` | bounded Kokotsha date and venue |
| 92 | Costa Rica | `blocked` | equestrian context, not racing calendar |

## Result

- 8 Source Test v2 summaries
- 8 authority/source reference records
- 8 Calendar Readiness reference records
- 92 countries with closed decisions
- 110 effective authority/source and readiness records
- every Technical Rank remains C
- every Public Ceiling remains C
- every implementation status remains `not_started`

## Public-safe exclusions

No raw source bodies, complete programmes, participants, horses, jockeys, trainers, odds, results, payouts, predictions, credentials, restricted-access details, embedded video, or direct stream URLs are committed.

## Validation

```text
node scripts/check-source-test-v2-53-60.mjs
node scripts/check-source-test-v2-61-68.mjs
node scripts/check-source-test-v2-69-76.mjs
node scripts/check-source-test-v2-77-84.mjs
node scripts/check-source-test-v2-85-92.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
npm install
npm run build
```

Expected:

```text
SOURCE_TEST_V2_85_92_VALID countries=8 authority=110 readiness=110
PROGRAMME_COUNTS published=84 source_tested=8 not_started=6
READINESS_MIX manual_ready=2 link_only=4 blocked=2
```

## Next

`WHR-NOTE-85-92`
