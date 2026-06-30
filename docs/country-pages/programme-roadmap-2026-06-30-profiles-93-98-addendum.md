# Country programme addendum — Profile v2 entries 93-98

Status: active current-state addendum  
Date: 2026-06-30  
Work ID: `WHR-PROFILE-93-98`

## Effective programme state

```text
published:       92
profile_ready:    6
total:           98
profile-ready routes: 12
published routes:    184
```

## Boundary

- Nicaragua, El Salvador, and Tanzania use explanatory treatment.
- Singapore, Macau, and Greece use archive treatment.
- All profiles remain at Public Ceiling C.
- No current meeting rows are approved.
- Archive dates remain historical boundaries only.
- QA and publication states remain unadvanced.

## Integration

The idempotent loader is `scripts/apply-profile-v2-93-98-loader.mjs`.
The transition file is `docs/country-pages/98-country-profile-transitions-93-98.tsv`.
The final audit must compact all loader and tracker overlays.

## Next

`WHR-PUB-93-98`, then `WHR-AUDIT-98`.
