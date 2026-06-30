# Country profiles 93-98

Status: complete for review  
Work ID: `WHR-PROFILE-93-98`

## Result

- 6 country records
- 6 official source records
- 6 bilingual profiles
- 12 English and Japanese routes
- all public ceilings remain C

Entries 93-95 are explanatory pages. Entries 96-98 are archive pages. No current meeting rows or race-time fields are approved.

## Checks

```text
node scripts/check-country-profiles-93-98.mjs
node scripts/check-country-detail-profile-runtime.mjs
npm run build
```

Expected: 98 runtime profiles and effective state `92 published / 6 profile_ready`.

## Next

`WHR-PUB-93-98`
