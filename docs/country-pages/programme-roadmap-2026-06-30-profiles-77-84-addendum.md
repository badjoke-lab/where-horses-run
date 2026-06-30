# Country programme addendum — Profile v2 entries 77-84

Status: active current-state addendum  
Date: 2026-06-30  
Work ID: `WHR-PROFILE-77-84`

This addendum records the effective programme state after reviewed bilingual Profile v2 records for Kazakhstan, Egypt, Algeria, Iran, Vietnam, Bolivia, Guatemala, and Honduras.

## Effective programme state

```text
published:       76
profile_ready:    8
not_started:     14
total:           98

profile-ready routes: 8 EN + 8 JA = 16
published routes:    76 EN + 76 JA = 152
```

## Profile boundary

- Kazakhstan and Vietnam expose bounded C-level date-and-venue guidance only.
- Egypt, Algeria, Iran, Bolivia, Guatemala, and Honduras remain official-link-first or explanatory.
- Every Profile v2 record is bilingual and reviewed.
- Every public display ceiling remains C.
- No current publication or QA state is advanced in this work.

## Loader overlay

`src/lib/data.ts` is updated idempotently in clean build environments through:

```text
scripts/apply-profile-v2-77-84-loader.mjs
```

The build-entry script invokes this loader before Astro builds the routes. The final 98-country audit must compact these imports and all tracker transitions into the canonical files.

## Transition file

```text
docs/country-pages/98-country-profile-transitions-77-84.tsv
```

## Next work

```text
Current after merge: WHR-PUB-77-84
Next source-test wave: WHR-ST2-85-92
```
