# Country profiles 77-84

Status: complete for review  
Work ID: `WHR-PROFILE-77-84`  
Reviewed: 2026-06-30

## Scope

- 8 country records
- 8 official source records
- 8 reviewed bilingual Profile v2 records
- 16 complete English/Japanese routes
- every public display ceiling remains C

## Schedule boundary

| Country | Profile treatment |
| --- | --- |
| Kazakhstan | `meeting-date-only` within the Baige Federation championship |
| Egypt | `official-link-only` |
| Algeria | `official-link-only` |
| Iran | `official-link-only` |
| Vietnam | `meeting-date-only` only after a new provincial notice |
| Bolivia | `official-link-only`, explanatory and blocked |
| Guatemala | `official-link-only`, no inferred future date |
| Honduras | `official-link-only`, explanatory and blocked |

No race times, participants, odds, results, payouts, complete programmes, embedded media, or direct streams are introduced.

## Runtime integration

The idempotent loader adds the 77-84 country, source, and Profile imports to `src/lib/data.ts` in a clean workspace. It is invoked by the existing build-entry script and by the profile validator.

## Validation

```text
node scripts/check-country-profiles-69-76.mjs
node scripts/check-country-profiles-77-84.mjs
node scripts/check-country-detail-profile-runtime.mjs
npm install
npm run build
```

Expected:

```text
COUNTRY_PROFILES_77_84_VALID countries=8 sources=8 profiles=8
PROGRAMME_COUNTS published=76 profile_ready=8 not_started=14
PUBLIC_CEILINGS C=8
```

## Next

`WHR-PUB-77-84`
