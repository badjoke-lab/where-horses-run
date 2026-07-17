# Canonical and hreflang review

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `CANONICAL-HREFLANG-REVIEW-01`  
Reviewed: 2026-07-18  
Scope updated by: `METHODS-DATA-POLICY-01`

## Purpose

The complete public route set has a reviewed self-canonical and localized-alternate contract. SEO equivalence is limited to real English and Japanese counterparts, while visible language navigation remains available on the three English-only legacy pages.

## Current inventory

```text
Public pages: 771
Canonical links: 771
Unique canonical URLs: 771
Paired pages: 768
Bilingual clusters: 384
English paired pages: 384
Japanese paired pages: 384
Unpaired pages: 3
Hreflang links: 2,304
Self links: 768
Opposite-locale links: 768
x-default links: 768
Language-switch links: 771
```

The frozen set therefore contains 771 canonical links, 384 bilingual clusters, and 2,304 hreflang links.

Every paired page emits the same three-link cluster:

```text
hreflang="en"
hreflang="ja"
hreflang="x-default"
```

The English URL is the `x-default` target.

## Explicit content-page clusters

The FAQ routes form one verified reciprocal cluster:

```text
/faq/
/ja/faq/
```

The Methods routes form one verified reciprocal cluster:

```text
/methods/
/ja/methods/
```

Each pair is self-canonical, lists the opposite language, uses the English route as `x-default`, and keeps the visible language switch aligned with the counterpart.

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

The checker scans all 771 sitemap pages, verifies one self-canonical per page, reconstructs all 384 clusters, compares reciprocal link sets, validates `x-default`, confirms the FAQ and Methods pairs, and preserves the three unpaired exceptions.

## Boundaries

No automatic redirect, visitor-language detection, false localized equivalence, query-state or cross-origin canonical, external SEO service, automatic translation, publication, analytics, cookies, client storage, or deployment is introduced.

Next implementation unit: `OPEN-GRAPH-SOCIAL-CARDS-01`.
