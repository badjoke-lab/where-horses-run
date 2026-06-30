# Country programme publication addendum — entries 69-76

Status: active current-state addendum  
Date: 2026-06-30  
Work ID: `WHR-PUB-69-76`  
PR: #340

This addendum supersedes the current-position counts in `docs/country-pages/programme-roadmap.md` after PR #340 is merged. The full roadmap remains the phase and completion-contract authority.

## Effective state

```text
published:       76
page_qa:          0
profile_ready:    0
note_reviewed:    0
source_tested:    0
not_started:     22
total:           98

published routes: 76 EN + 76 JA = 152
final target:     98 EN + 98 JA = 196
```

## Publication evidence

- Source Test v2: PR #335
- reviewed notes: PR #336
- Profile v2: PR #338
- preview-only QA: PR #339
- publication: PR #340
- rendered run: `28420131078`
- rendered artifact: `7970924909`
- result: 16 routes, 32 viewport checks, 16 screenshots, 0 errors

## Tracker transition model

The original 98-row tracker is retained as an immutable compatibility base. Later state changes are appended to `98-country-tracker-transitions.tsv` and applied by wave-specific validators. This prevents older validators from being rewritten during active delivery. The final audit `WHR-AUDIT-COUNTRY-CALENDAR-98` must compact the base and all transitions into one reviewed canonical tracker.

## Next work

```text
Current after merge: WHR-ST2-77-84
Next:                WHR-NOTE-77-84
```

Entries 77-84 are Kazakhstan, Egypt, Algeria, Iran, Vietnam, Bolivia, Guatemala, and Honduras.
