# Racecourse pages — 2026-08-28 current-state addendum

Status: active canonical racecourse-page addendum  
Adopted: 2026-08-28  
Supersedes: `docs/racecourses/current-state-2026-08-09-addendum.md`  
Machine state: `data/static/racecourse-current-state-v1.json`

## Purpose

This addendum advances the Racecourse Pages current-state snapshot without rewriting the historical v1 release evidence. Current size is derived from the canonical racecourse source arrays consumed by the rendered bilingual QA, not from a fixed historical ceiling.

## Current state

The reviewed current racecourse surface is:

```text
canonical racecourse identities represented by the rendered QA source set: 41
English racecourse detail routes: 41
Japanese racecourse detail routes: 41
bilingual racecourse detail routes: 82
```

The historical Racecourse Pages v1 release evidence remains:

```text
racecourse identities at release: 36
bilingual racecourse detail routes at release: 72
```

The 2026-08-09 snapshot of 37 identities / 74 bilingual routes is retained only as historical growth evidence and is no longer the current-state authority.

## Derivation rule

Current counts must be machine-derived from the same canonical racecourse source arrays declared by `scripts/check-racecourse-page-bilingual-qa-rendered.mjs`.

`data/static/racecourse-current-state-v1.json` records the reviewed current count. `scripts/check-racecourse-page-current-state.mjs` must fail when:

- the machine state and current canonical source set disagree;
- English, Japanese, and bilingual route counts do not preserve one EN + one JA route per racecourse;
- the previous 2026-08-09 addendum is not marked superseded;
- this addendum stops identifying the machine state as its current count authority.

A future racecourse-growth PR that changes the rendered QA source set must update the machine current-state record and, when the human-readable current snapshot materially changes, replace this addendum with a newer adopted addendum in the same reviewed unit.

## Current product behavior

Racecourse pages remain reviewed static public surfaces connected to the public timetable projection. The current page strengthening includes:

- Today and Next reviewed meeting state;
- upcoming reviewed meetings;
- effective public rank;
- public-safe first/final time range when available at the permitted summary level;
- meeting timezone;
- reviewed source status;
- last-checked date;
- meeting-detail and official-source links where applicable.

This strengthens freshness and source context on the racecourse page. It does not turn the racecourse page into a full racecard surface.

## Public boundary

Racecourse pages continue to consume only reviewed public timetable data. They must not display or derive internal Review Queue, Retry Queue, reviewer, attempt-history, or raw acquisition state.

The public racecourse surface continues to exclude:

- entries and participant lists;
- horse, jockey, trainer, draw, and weight data;
- odds and betting data;
- results and payouts;
- predictions or tips;
- raw source bodies or raw HTML;
- direct stream URLs.

Identity-only racecourse pages remain valid when profile facts are not reviewed. Missing city, region, address, course, surface, direction, dimensions, or distance-profile facts must not be invented to fill a page.

## Link and language rule

Every current racecourse identity must continue to preserve, where the applicable reviewed route exists:

```text
country <-> racecourse
racecourse <-> Calendar/public meeting state
meeting detail -> racecourse
EN <-> JA language pair
racecourse -> reviewed official source
```

The rendered bilingual QA remains responsible for verifying route-pair completeness, metadata, accessibility, language parity, public-boundary notices, and inherited racecourse release contracts.

## Current maintenance direction

Racecourse maintenance is an independent post-v1 lane. A Calendar acquisition no-op does not block authorized racecourse-page work.

The next valid units may include:

1. reviewed profile-evidence growth for existing identity-only pages;
2. country/racecourse navigation strengthening;
3. source/freshness presentation improvements;
4. reviewed racecourse identities introduced by source expansion;
5. regression, responsive, accessibility, SEO, and performance fixes required by page growth.

None of these units authorizes unsupported profile facts or unattended timetable publication.

## Required reading

Before subsequent racecourse-page growth, review at least:

1. `docs/governance/document-authority.md`;
2. `docs/project-roadmap-2026-08-25-addendum.md`;
3. `docs/racecourses/identity-reconciliation.md`;
4. `docs/racecourses/public-timetable-connection.md`;
5. `docs/racecourses/profile-evidence.md`;
6. `docs/racecourses/page-link-architecture.md`;
7. `docs/racecourses/bilingual-qa.md`;
8. this addendum;
9. `data/static/racecourse-current-state-v1.json`;
10. current racecourse validators and applicable Calendar public-display contracts.
