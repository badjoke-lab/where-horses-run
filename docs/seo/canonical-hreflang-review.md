# Canonical and hreflang review

Status: complete  
Work ID: `WHR-SEO-PUBLIC-CONTENT-V1`  
Implementation unit: `CANONICAL-HREFLANG-REVIEW-01`  
Reviewed: 2026-07-17

## Purpose

The complete public route set now has a reviewed canonical and localized-alternate contract.

The review separates two different concerns:

- SEO metadata describes only real English and Japanese versions of equivalent content;
- visible language navigation remains available even when the current page has no translated counterpart.

This prevents a language-menu fallback from being misrepresented as a localized content equivalent.

## Defect corrected

Before this review, every page emitted three hreflang links. Pages covered by the bilingual route patterns correctly pointed to their English or Japanese counterpart.

Three English-only Major Countries legacy pages had no Japanese equivalent. Their language switch correctly led users to the Japanese home page, but the same fallback was also emitted as `hreflang="ja"`. That incorrectly described the Japanese home page as a localized version of the legacy page.

The metadata and navigation targets are now calculated separately.

## Canonical contract

Every one of the 767 public pages emits exactly one canonical link.

Each canonical:

- equals the page's final public URL;
- appears in the generated sitemap;
- uses HTTPS;
- uses `https://whr.badjoke-lab.com`;
- contains no query or fragment;
- follows the trailing-slash route contract;
- is unique across the public page set.

The review does not add canonical redirects or cross-page canonical consolidation. English and Japanese pages remain independently self-canonical.

## Bilingual hreflang contract

The current public site contains:

```text
382 English/Japanese clusters
764 paired pages
```

Every paired page emits exactly three fully qualified alternate links:

```text
hreflang="en"
hreflang="ja"
hreflang="x-default"
```

The English and Japanese pages in a cluster emit the identical set.

Requirements:

- the current page lists itself;
- the current page lists the opposite locale;
- the opposite page returns the reference;
- `x-default` points to the English version;
- no other hreflang code appears;
- all targets exist in the public rendered route set.

The final measured totals are:

```text
Hreflang links: 2,292
Self links: 764
Opposite-locale links: 764
x-default links: 764
Reciprocal errors: 0
Cluster-set errors: 0
```

## Unpaired pages

The following three routes currently have no Japanese equivalent:

```text
/major-countries/preview-timetable/
/major-countries/source-health/
/major-countries/timetable/
```

They emit:

- one self-canonical;
- no `hreflang="en"`;
- no `hreflang="ja"`;
- no `hreflang="x-default"`.

They still render the visible Japanese language switch, which leads to `/ja/`. That is a navigation fallback only and does not create an SEO equivalence claim.

If a page explicitly supplies `alternatePath`, that reviewed path may establish a localized pair even when the general route pattern does not.

## Shared layout implementation

The implementation remains in:

```text
src/layouts/BaseLayout.astro
```

The layout now distinguishes:

```text
metadataAlternateHref
languageSwitchHref
```

`metadataAlternateHref` is null when no actual localized counterpart is known. The hreflang cluster is rendered only when that value exists.

`languageSwitchHref` preserves the existing user-facing fallback to the other language home page for unpaired routes.

No client JavaScript, visitor-language detection, cookie, redirect, or dynamic locale response is introduced.

## Frozen scope

Discovery validated:

```text
Public pages: 767
Canonical links: 767
Unique canonical URLs: 767
Paired pages: 764
Bilingual clusters: 382
English paired pages: 382
Japanese paired pages: 382
Unpaired pages: 3
Language-switch links: 767
Unpaired language-switch home fallbacks: 3
```

Measured errors were zero for:

- canonical self-reference;
- canonical origin;
- canonical query or fragment;
- canonical trailing slash;
- missing self hreflang;
- missing opposite-locale hreflang;
- missing `x-default`;
- unexpected hreflang values;
- reciprocal references;
- cluster-set consistency;
- rendered language;
- `x-default` targets;
- hreflang on unpaired pages.

## Public, privacy, and automation boundary

Allowed:

- public self-canonical metadata;
- hreflang for verified localized pairs;
- English versions as `x-default` within those pairs;
- visible language-navigation fallback.

Not allowed:

- false localized equivalence;
- query-state or cross-origin canonicals;
- automatic redirects;
- visitor-language detection;
- visitor identifiers, logging, cookies, storage, or analytics;
- external SEO services;
- automatic route inference, translation, publication, or deployment.

## Validation

The permanent checker is:

```text
scripts/check-canonical-hreflang-review.mjs
```

The permanent read-only Actions gate is:

```text
.github/workflows/canonical-hreflang-review.yml
```

The checker reads all 767 sitemap URLs and rendered pages, requires exact self-canonical equality, rebuilds all English/Japanese clusters from emitted links, checks reciprocity and identical link sets, verifies the three unpaired paths, confirms that UI language navigation remains present, preserves all previous SEO metadata contracts, and proves that validation leaves the repository clean.

## Next implementation unit

```text
OPEN-GRAPH-SOCIAL-CARDS-01
```
