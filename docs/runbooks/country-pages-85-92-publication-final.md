# Country pages 85-92 — publication final

Status: complete for review  
Work ID: `WHR-PUB-85-92`  
Publication date: 2026-06-30

## Scope

- Ghana
- Saint Kitts and Nevis
- Jordan
- Iraq
- Azerbaijan
- Mongolia
- Botswana
- Costa Rica

## Final result

- 8 English routes published
- 8 Japanese routes published
- effective total: 92 countries and 184 routes
- every page remains at Public Ceiling C
- rendered gate passed with 16 routes, 32 viewport checks, 16 screenshots, and 0 errors

## Evidence

- preview PR: #349
- preview head: `58a04fc6646136facafa14843589c2ae2f8df805`
- rendered run: `28429885439`
- rendered job: `84241726718`
- artifact: `7974585662`
- digest: `sha256:d6c5c8301fcf166d892a4b2506be5f5c29db59b463a025b0a996dbdff99b9850`

## Public boundary

No race times, participant lists, horses, jockeys, trainers, odds, results, payouts, predictions, complete programmes, embedded media, or direct stream URLs are included. Mongolia and Botswana retain only the bounded reviewed date-and-venue context permitted at C. Link-only and explanatory pages do not generate current meeting rows.

## Validation

```text
node scripts/check-country-page-publication-77-84.mjs
node scripts/check-country-page-publication-85-92.mjs
node scripts/check-country-detail-profile-runtime.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
npm install
npm run build
```

Expected:

```text
COUNTRY_PAGE_PUBLICATION_85_92_VALID published=92 routes=184 errors=0
COUNTRY_DETAIL_PROFILE_RUNTIME_VALID v2=92
```

## Next

`WHR-ST2-93-98`
