# FAQ content pages

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `FAQ-CONTENT-PAGES-01`  
Reviewed: 2026-07-18

## Purpose

Where Horses Run now has bilingual public FAQ pages that explain how the site should be used and where its information boundaries lie.

The FAQ makes source priority, coverage variation, update limits, publication ranks, excluded racecard data, betting-advice exclusion, and official live/replay boundaries visible without exposing internal operating circumstances.

## Public routes

```text
/faq/
/ja/faq/
```

The two routes are:

- public and included in the 769-URL sitemap;
- self-canonical;
- one reciprocal English/Japanese hreflang cluster;
- linked from the corresponding English and Japanese home pages;
- linked to About, Disclaimer, Official Sources, and Glossary pages.

## Visible content

Each page contains 12 visible questions and 12 answers.

The English and Japanese pages cover the same topics:

1. what Where Horses Run is;
2. what information is available;
3. where information comes from;
4. why coverage differs by country, region, racecourse, and organizer;
5. how updates are reviewed and why real-time updates are not promised;
6. what C, B, B+, A, and A+ publication ranks mean;
7. why an empty upcoming-meetings view does not prove that racing is absent;
8. why dates and post times require final official confirmation;
9. which participant, racecard, odds, result, and payout fields are not published;
10. why betting advice is not provided;
11. the boundary for official live and replay routes;
12. how to use official-source links and the glossary.

The FAQ does not discuss revenue, monetization, budget, relationships to other projects, or internal circumstances.

## Structured data

The shared component is:

```text
src/components/FaqPage.astro
```

Each page emits one page-specific JSON-LD script marked:

```text
data-faq-structured-data="faq-page-v1"
```

The script contains:

- one `FAQPage` node;
- 12 `Question` nodes;
- 12 `Answer` nodes;
- an `isPartOf` relation to the page’s baseline `WebPage` identity.

Visible question and answer text and structured question and answer text are generated from the same reviewed array and must match exactly.

The FAQ structured-data totals are:

```text
FAQPage scripts: 2
Visible questions: 24
Visible answers: 24
Structured questions: 24
Structured answers: 24
Visible/structured mismatches: 0
```

## Expanded public inventory

Adding the FAQ pair changes the public route inventory to:

```text
Public pages: 769
English pages: 386
Japanese pages: 383
Bilingual clusters: 383
Paired pages: 766
Unpaired pages: 3
Hreflang links: 2,298
```

The Sitemap, Structured Data Baseline, Canonical/Hreflang, Open Graph, and Title/Description contracts are updated in the same implementation unit.

## Verification

Permanent checker:

```text
scripts/check-faq-content-pages.mjs
```

Read-only Actions gate:

```text
.github/workflows/faq-content-pages.yml
```

The gate builds the complete site, preserves every existing Phase 11 SEO contract, verifies all visible and structured FAQ content, checks bilingual navigation and homepage links, and proves the repository remains clean.

## Public and privacy boundaries

The FAQ may explain:

- public data scope;
- official-source priority;
- review and update policy;
- limitations and coverage variation;
- publication ranks;
- information excluded from publication.

It may not expose:

- revenue or monetization purpose;
- budget or cost constraints;
- other-project relationships;
- internal circumstances;
- participant or racecard datasets;
- betting advice.

No visitor identifier, interaction logging, analytics, cookie, client storage, external content service, automatic question generation, automatic translation, publication, or deployment is introduced.

Next implementation unit: `METHODS-DATA-POLICY-01`.
