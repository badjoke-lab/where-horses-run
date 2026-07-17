# Canonical and hreflang review

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `CANONICAL-HREFLANG-REVIEW-01`  
Reviewed: 2026-07-18  
Scope updated by: `FAQ-CONTENT-PAGES-01`

## Purpose

The complete public route set has a reviewed self-canonical and localized-alternate contract. SEO equivalence is limited to real English and Japanese counterparts, while visible language navigation remains available on the three English-only legacy pages.

## Current inventory

```text
Public pages: 769
Canonical links: 769
Unique canonical URLs: 769
Paired pages: 766
Bilingual clusters: 383
English paired pages: 383
Japanese paired pages: 383
Unpaired pages: 3
Hreflang links: 2,298
Self links: 766
Opposite-locale links: 766
x-default links: 766
Language-switch links: 769
```

The frozen set therefore contains 769 canonical links, 383 bilingual clusters, and 2,298 hreflang links.

Every paired page emits the same three-link cluster:

```text
hreflang="en"
hreflang="ja"
hreflang="x-default"
```

The English URL is the `x-default` target.

## FAQ bilingual cluster

The FAQ routes form one verified reciprocal cluster:

```text
/faq/
/ja/faq/
```

Both pages are self-canonical, list each other, use `/faq/` as `x-default`, and keep the visible language switch aligned with the opposite page.

## Unpaired pages

These three English-only legacy routes emit no hreflang cluster:

```text
/major-countries/preview-timetable/
/major-countries/source-health/
/major-countries/timetable/
```

Their visible Japanese language switch still leads to `/ja/`. That navigation fallback does not claim localized equivalence.

## Verification

Permanent checker:

```text
scripts/check-canonical-hreflang-review.mjs
```

Read-only Actions gate:

```text
.github/workflows/canonical-hreflang-review.yml
```

The checker scans all 769 sitemap pages, verifies one self-canonical per page, reconstructs all 383 clusters, compares reciprocal link sets, validates `x-default`, confirms the FAQ pair, and preserves the three unpaired exceptions.

## Boundaries

No automatic redirect, visitor-language detection, false localized equivalence, query-state or cross-origin canonical, external SEO service, automatic translation, publication, analytics, cookies, client storage, or deployment is introduced.

Next implementation unit: `OPEN-GRAPH-SOCIAL-CARDS-01`.
