# V1 known limitations review

Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-KNOWN-LIMITATIONS-01`  
Status: complete  
Reviewed: 2026-07-18

## Decision

Complete the v1 known-limitations review without expanding the frozen route or data scope.

The public FAQ and Methods and Data Policy pages already state the limitations visitors need in order to interpret Where Horses Run correctly. This unit converts those statements into one permanent, read-only release contract and validates the rendered English and Japanese pages.

No public route, public data class, feature, publication mode, or visitor-facing control is added by this unit.

## Audited public surface

- Public pages in the frozen v1 candidate: 771
- Audited routes: 4
- Route pairs: 2
- Locales: 2
- FAQ questions per locale: 12
- Methods sections per locale: 9
- Known-limitation categories: 12
- New public routes: 0
- New public data classes: 0

Audited routes:

- `/faq/`
- `/ja/faq/`
- `/methods/`
- `/ja/methods/`

## Known limitations fixed by contract

1. **Official-source final confirmation** — official pages remain the final confirmation point for current and complete information.
2. **Coverage varies** — detail differs by country, region, racecourse, organiser, source structure, and review status.
3. **Not real time** — the site does not promise real-time updates or immediate reflection of every change.
4. **Dates and times can change** — meetings may be changed, postponed, or cancelled after publication.
5. **Empty views are not absence claims** — a missing current or upcoming record does not prove that no racing exists.
6. **Last checked is not continuing validity** — a review date does not guarantee that information remains unchanged.
7. **Publication rank is a display boundary** — C through A+ define publication-safe detail, not completeness.
8. **Participant, betting, and result data are excluded** — entries, participant fields, odds, results, payouts, predictions, betting picks, and complete racecards are outside scope.
9. **Video and direct streams are excluded** — the site does not embed video, publish direct stream URLs, use unofficial mirrors, or redistribute recordings.
10. **Viewing access is not guaranteed** — a listed official live or replay route does not guarantee access.
11. **Local time and daylight saving matter** — dates and times are interpreted in the official source's local context and may change with timezone rules.
12. **Correction, reduction, and removal remain allowed** — stale, unsupported, conflicting, or incorrect information may be corrected, reduced, or removed instead of being inferred.

## Permanent files

- `data/static/v1-known-limitations-v1.json`
- `data/audits/v1-known-limitations-v1.json`
- `docs/release/v1-known-limitations.md`
- `scripts/check-v1-known-limitations.mjs`
- `.github/workflows/v1-known-limitations.yml`

## Verification

The permanent checker:

1. validates the release contract and audit identities;
2. preserves Scope Freeze, Data Audit, Mobile QA, Accessibility QA, Performance QA, Source Policy, FAQ, and Methods baselines;
3. verifies all 771 sitemap routes remain present;
4. validates the four audited public pages from the built `dist` tree;
5. checks the English and Japanese FAQ and Methods inventories;
6. checks all 12 limitation categories on their required routes;
7. rejects global-completeness, guaranteed-current, guaranteed-live, and equivalent claims;
8. confirms that no public route or public data class was added;
9. confirms privacy and automation boundaries remain disabled;
10. proves the repository is clean after the build and checks.

## Public boundary

Where Horses Run may describe its purpose, data method, official-source priority, publication ranks, review process, correction process, and known limitations.

It does not publish participant datasets, complete racecards, horse or human participant fields, odds, results, payouts, predictions, betting advice, copied source bodies, embedded video, direct stream URLs, unofficial mirrors, or redistributed recordings.

## Privacy and automation boundary

This unit adds no visitor identifiers, query logging, analytics, cookies, client storage, automatic limitation inference, automatic translation, automatic publication, or deployment action.

## Next implementation unit

`V1-RELEASE-READINESS-01`
