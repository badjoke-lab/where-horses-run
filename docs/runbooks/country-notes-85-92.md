# Reviewed country notes — entries 85-92

Status: complete for review  
Work ID: `WHR-NOTE-85-92`  
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

- 8 reviewed public-safe notes
- every Technical Rank remains C
- every Public Ceiling remains C
- implementation remains `not_started`
- no Profile v2 or route publication state is advanced

## Public boundary

The notes do not reproduce complete programmes, participants, horses, jockeys, trainers, odds, results, payouts, predictions, embedded media, or direct stream URLs. Date-and-venue statements are permitted only for the bounded Mongolia and Botswana government notices. Link-only and blocked countries have no approved current meeting rows.

## Validation

```text
node scripts/check-source-test-v2-85-92.mjs
node scripts/check-country-notes-85-92.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
npm install
npm run build
```

Expected:

```text
COUNTRY_NOTES_85_92_VALID reviewed=8 public_ceiling_C=8
PROGRAMME_COUNTS published=84 note_reviewed=8 not_started=6
READINESS_MIX manual_ready=2 link_only=4 blocked=2
```

## Next

`WHR-PROFILE-85-92`
