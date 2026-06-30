# Country programme addendum — Profile v2 entries 85-92

Status: active current-state addendum  
Date: 2026-06-30  
Work ID: `WHR-PROFILE-85-92`

This addendum records the effective programme state after reviewed bilingual Profile v2 records for Ghana, Saint Kitts and Nevis, Jordan, Iraq, Azerbaijan, Mongolia, Botswana, and Costa Rica.

## Effective programme state

```text
published:       84
profile_ready:    8
not_started:      6
total:           98

profile-ready routes: 8 EN + 8 JA = 16
published routes:    84 EN + 84 JA = 168
```

## Profile boundary

- Ghana, Jordan, Iraq, and Azerbaijan remain official-link-first.
- Saint Kitts and Nevis and Costa Rica remain explanatory and outside current-calendar output.
- Mongolia exposes bounded C-level date-and-venue guidance only after a newly reviewed official notice; the May 19, 2026 event has passed.
- Botswana exposes bounded C-level date-and-venue guidance for the reviewed July 4, 2026 Kokotsha notice.
- Every Profile v2 record is bilingual and reviewed.
- Every public display ceiling remains C.
- No current publication or QA state is advanced in this work.

## Loader overlay

`src/lib/data.ts` is updated idempotently in clean build environments through:

```text
scripts/apply-profile-v2-85-92-loader.mjs
```

The build-entry script invokes this loader before Astro builds the routes. The final 98-country audit must compact these imports and all tracker transitions into the canonical files.

## Transition file

```text
docs/country-pages/98-country-profile-transitions-85-92.tsv
```

## Next work

```text
Current after merge: WHR-PUB-85-92
Final Source Test:    WHR-ST2-93-98
```
