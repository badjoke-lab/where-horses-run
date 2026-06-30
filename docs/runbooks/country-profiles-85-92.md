# Country profiles 85-92

Status: complete for review  
Work ID: `WHR-PROFILE-85-92`  
Reviewed: 2026-06-30

## Result

- 8 country records
- 8 official source records
- 8 bilingual Profile v2 records
- 16 English/Japanese routes
- every public ceiling remains C

Mongolia and Botswana use bounded `meeting-date-only` guidance. Ghana, Saint Kitts and Nevis, Jordan, Iraq, Azerbaijan, and Costa Rica remain official-link-first or explanatory. No race times, participants, odds, results, payouts, complete programmes, embedded media, or direct streams are introduced.

## Validation

```text
node scripts/check-country-profiles-85-92.mjs
node scripts/check-country-detail-profile-runtime.mjs
npm install
npm run build
```

Expected: 92 Profile v2 records and effective programme state `84 published / 8 profile_ready / 6 not_started`.

## Next

`WHR-PUB-85-92`
