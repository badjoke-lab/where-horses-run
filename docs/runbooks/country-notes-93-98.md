# Reviewed country notes — entries 93-98

Status: complete for review  
Work ID: `WHR-NOTE-93-98`  
Evidence cutoff: 2026-06-30

## Result

- 6 reviewed public-safe notes
- 3 explanatory pages
- 3 archive pages
- every Technical Rank and Public Ceiling remains C
- every Calendar Readiness remains blocked
- Profile and publication states remain unadvanced

## Archive boundaries

- Singapore: final race on 5 October 2024
- Macau: activities ended from 1 April 2024
- Greece: domestic races ceased on 30 January 2024

These dates are archive context only and must not generate current meeting rows.

## Validation

```text
node scripts/check-source-test-v2-93-98.mjs
node scripts/check-country-notes-93-98.mjs
npm install
npm run build
```

Expected:

```text
COUNTRY_NOTES_93_98_VALID reviewed=6 public_ceiling_C=6 blocked=6
PROGRAMME_COUNTS published=92 note_reviewed=6
```

## Next

`WHR-PROFILE-93-98`
