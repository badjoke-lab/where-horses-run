# V1 release readiness

Release ID: `WHR-V1-PREPARATION-V1`  
Work ID: `WHR-V1-PREPARATION-V1`  
Implementation unit: `V1-RELEASE-READINESS-01`  
Status: release candidate ready  
Reviewed: 2026-07-18

## Decision

The frozen Where Horses Run v1 candidate is ready to enter a separate final release-decision unit.

This unit aggregates the completed v1 preparation sequence, adds public-safe release notes, verifies final cleanup, rebuilds the complete 771-page static site, rechecks the principal release contracts, and confirms that no new route family or public data class was introduced.

It does not create a release tag, authorize deployment, perform deployment, or declare v1 publicly released.

## Completed preparation units

1. `V1-SCOPE-FREEZE-01`
2. `V1-DATA-AUDIT-01`
3. `V1-MOBILE-QA-01`
4. `V1-ACCESSIBILITY-QA-01`
5. `V1-PERFORMANCE-QA-01`
6. `V1-SOURCE-POLICY-REVIEW-01`
7. `V1-KNOWN-LIMITATIONS-01`

## Candidate inventory

- locales: 2;
- public pages: 771;
- English pages: 387;
- Japanese pages: 384;
- route families: 17;
- audited JSON files: 154;
- top-level public-data rows: 462;
- official-source records: 171;
- countries and regions with sources: 98;
- racecourse records: 36;
- mobile page-viewport checks: 2,313;
- accessibility page checks: 771;
- performance-measured pages: 771;
- known-limitation categories: 12;
- new public routes: 0;
- new public data classes: 0.

## Release materials

Added:

- `data/static/v1-release-readiness-v1.json`;
- `data/audits/v1-release-readiness-v1.json`;
- `docs/release/v1-release-readiness.md`;
- `docs/release/v1-release-notes.md`;
- `scripts/check-v1-release-readiness.mjs`;
- `.github/workflows/v1-release-readiness.yml`.

The release notes describe the public product, included capabilities, excluded content, official-source priority, known limitations, completed QA, privacy boundary, and automation boundary. They do not contain revenue, budget, unrelated-project, or internal-circumstance discussion.

## Final cleanup boundary

The readiness gate rejects:

- temporary v1 preparation workflows;
- temporary discovery scripts;
- committed browser or performance diagnostic reports;
- committed local validation logs and exit files;
- unexpected public route growth;
- unexpected public data-class growth;
- a dirty repository after generated reports are removed.

## Permanent verification

The release-readiness gate:

1. installs dependencies without creating a lockfile;
2. validates public data references;
3. builds all 771 public pages;
4. preserves Phase 11 SEO QA;
5. preserves v1 Scope Freeze and Data Audit;
6. preserves Source Policy and Known Limitations;
7. measures the complete static performance inventory and enforces the existing budgets;
8. validates all seven completed v1 preparation contracts and their accepted zero-error boundaries;
9. validates the public-safe release notes;
10. validates sitemap route count and route-family freeze;
11. removes generated performance diagnostics;
12. proves the repository is clean.

## Readiness result

```text
readiness: ready_for_v1_release_decision
final release decision: incomplete
release tag: not created
deployment authorization: false
deployment performed: false
```

## Public boundary

The candidate remains an official-link-first static guide. It does not publish participant datasets, complete racecards, odds, results, payouts, predictions, betting advice, copied official bodies, embedded video, direct stream URLs, unofficial mirrors, or redistributed recordings.

## Privacy and automation boundary

No visitor identifiers, interaction logging, query logging, analytics, cookies, or client storage are introduced.

No automatic scope expansion, generation, translation, publication, release-tag creation, or deployment is enabled.

## Next implementation unit

`V1-RELEASE-DECISION-01`
