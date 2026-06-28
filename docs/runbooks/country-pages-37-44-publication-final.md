# Country pages 37-44 publication runbook

Status: rendered preview approved; publication finalization complete  
Work ID: `WHR-CP-PUB-37-44`  
Normal work branch: `country-pages-37-44-publication-final`  
Final preview branch: `preview-country-pages-37-44`  
Production publication: pending no-skip merge and production verification

## Scope

Validate and publish the English and Japanese country routes for:

- Malaysia
- Thailand
- Philippines
- Mauritius
- Argentina
- Germany
- Italy
- Spain

## Reviewed public ceilings

All eight country-level public ceilings remain C.

Subsystem-level source capability must not raise the country-level public ceiling where wider national coverage remains incomplete.

## GitHub QA gate

The repository verifies:

- all sixteen built routes exist;
- one h1 per route;
- page-specific canonical links;
- reciprocal English/Japanese hreflang links;
- language switching to the matching country route;
- reviewed official source links are rendered;
- C pages do not render start-time or timezone columns;
- no embedded video or `Watch here` output;
- empty meeting data is not described as absence of racing;
- runtime remains Profile v2 only;
- country programme, roadmap, governance, and Calendar contracts remain valid.

## Validation

```text
npm install
npm run build
node scripts/check-country-page-publication-37-44.mjs
node scripts/check-country-profiles-37-44.mjs
node scripts/check-country-detail-profile-runtime.mjs
node scripts/check-country-page-programme.mjs
node scripts/check-country-page-programme-roadmap.mjs
node scripts/check-project-governance-docs.mjs
node scripts/check-calendar-contracts.mjs
```

## Completed preview sequence

1. GitHub QA and the production build passed on the reviewed country-page head.
2. The final `preview-country-pages-37-44` branch requested one Cloudflare preview.
3. All sixteen live English/Japanese routes passed HTML checks.
4. Malaysia and Italy passed representative desktop and mobile rendered review.
5. Official links, language switching, metadata, empty states, CJK rendering, horizontal overflow, and C-rank boundaries passed.
6. Entries 37-44 were advanced to `published`, with `qa_status=passed` and `page_published_at=2026-06-28`.
7. The canonical roadmap was advanced to Calendar Readiness backfill.
8. PR #319 now requires a no-skip merge and one production-deployment confirmation.

## Rendered preview approval

Approved on 2026-06-28.

```text
Branch preview: https://preview-country-pages-37-44.where-horses-run.pages.dev
Preview branch: preview-country-pages-37-44
Preview marker commit: b6851b9bf594878e0d8d71542f95dfd4d706e242
Representative pages: Malaysia and Italy, EN/JA, desktop and Pixel 7
Evidence artifact: rendered-preview-37-44 (artifact 7936442604)
Artifact digest: sha256:8d1f3c314a36ddaeb821115051f51d758aad103d5854a37e6babc82a921c53e0
```

All 16 live routes passed HTML checks. Representative screenshots passed responsive, CJK, card-layout, and C-rank-boundary review.

## Publication state

Entries 37-44 are recorded as `published` with `qa_status=passed` and `page_published_at=2026-06-28`. PR #319 now requires a no-skip merge and one production-deployment confirmation.

Final tracker counts before merge:

```text
published:       44
profile_ready:    0
note_reviewed:    8
not_started:     46
total:           98
```

Final published route count before merge: 44 English + 44 Japanese = 88.

## Superseded work

PR #308 used an older main baseline and a PR-number-specific runbook. The current-main rebuild supersedes it. Do not merge PR #308.

## Next Work ID

`WHR-CAL-BACKFILL-01-20`
